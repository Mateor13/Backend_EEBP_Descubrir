import { NoEncontradoError, SolicitudInvalidaError } from '../../shared/errores.js'
import { diaDesdeISO, hoyEnEscuela } from '../../shared/utils/fechas.js'
import { aClase } from '../academico/academico.servicio.js'
import { calcularPromedioClase, decidirPromocion } from './dominio/promedios.js'

const aEvaluacion = (e) => ({
    id: String(e._id), clase: String(e.clase), tipo: e.tipo, titulo: e.titulo, descripcion: e.descripcion,
    fecha: e.fecha, evidenciaUrl: e.evidenciaUrl
})

export const crearCalificacionesServicio = ({
    calificacionesRepo, academicoRepo, estudiantesRepo, periodosServicio, politicas, almacenamiento, enTransaccion
}) => {
    // Carga la clase, verifica que el usuario la dicte y, si se va a escribir, que el periodo esté abierto
    const claseAutorizada = async (usuario, claseId, { escritura = false } = {}) => {
        const clase = await academicoRepo.buscarClase(claseId)
        if (!clase || !clase.activo) throw new NoEncontradoError('Clase')
        politicas.asegurarDictaClase(usuario, clase)
        if (escritura) periodosServicio.asegurarEditable(await periodosServicio.resolver(clase.periodo))
        return clase
    }

    const evaluacionAutorizada = async (usuario, evaluacionId, opciones) => {
        const evaluacion = await calificacionesRepo.buscarEvaluacion(evaluacionId)
        if (!evaluacion) throw new NoEncontradoError('Evaluación')
        const clase = await claseAutorizada(usuario, evaluacion.clase, opciones)
        return { evaluacion, clase }
    }

    return {
        // La evaluación se crea UNA vez para la clase (antes se copiaba en el documento de cada alumno)
        async crearEvaluacion(usuario, claseId, { tipo, titulo, descripcion, fecha }, archivo) {
            await claseAutorizada(usuario, claseId, { escritura: true })
            const evidenciaUrl = archivo ? await almacenamiento.subirImagen(archivo.buffer, archivo.mimetype) : null
            const evaluacion = await calificacionesRepo.crearEvaluacion({
                clase: claseId, tipo, titulo, descripcion, evidenciaUrl, creadaPor: usuario.id,
                fecha: fecha ? diaDesdeISO(fecha) : hoyEnEscuela()
            })
            return aEvaluacion(evaluacion)
        },

        async listarEvaluaciones(usuario, claseId, tipo) {
            await claseAutorizada(usuario, claseId)
            return (await calificacionesRepo.evaluacionesDeClase(claseId, tipo)).map(aEvaluacion)
        },

        async actualizarEvaluacion(usuario, evaluacionId, cambios, archivo) {
            await evaluacionAutorizada(usuario, evaluacionId, { escritura: true })
            const datos = { ...cambios }
            if (cambios.fecha) datos.fecha = diaDesdeISO(cambios.fecha)
            if (archivo) datos.evidenciaUrl = await almacenamiento.subirImagen(archivo.buffer, archivo.mimetype)
            return aEvaluacion(await calificacionesRepo.actualizarEvaluacion(evaluacionId, datos))
        },

        async eliminarEvaluacion(usuario, evaluacionId) {
            await evaluacionAutorizada(usuario, evaluacionId, { escritura: true })
            await enTransaccion(async (session) => {
                await calificacionesRepo.eliminarCalificacionesDeEvaluacion(evaluacionId, session)
                await calificacionesRepo.eliminarEvaluacion(evaluacionId, session)
            })
        },

        // Registrar y corregir notas es la misma operación (upsert), en una sola escritura a la BDD
        async registrarCalificaciones(usuario, evaluacionId, calificaciones) {
            const { clase } = await evaluacionAutorizada(usuario, evaluacionId, { escritura: true })
            const delCurso = new Set((await estudiantesRepo.idsEstudiantesDelCurso(clase.curso, clase.periodo)).map(String))
            const ajenos = calificaciones.filter(c => !delCurso.has(c.estudiante))
            if (ajenos.length) {
                throw new SolicitudInvalidaError('Hay estudiantes que no pertenecen al curso de esta clase', ajenos.map(a => a.estudiante))
            }
            await calificacionesRepo.guardarCalificaciones(evaluacionId, calificaciones, usuario.id)
            return { registradas: calificaciones.length }
        },

        // Planilla para el docente: todos los estudiantes del curso con su nota (o null)
        async planilla(usuario, evaluacionId) {
            const { evaluacion, clase } = await evaluacionAutorizada(usuario, evaluacionId)
            const [matriculas, calificaciones] = await Promise.all([
                estudiantesRepo.matriculasDelCurso(clase.curso, clase.periodo),
                calificacionesRepo.calificacionesDeEvaluacion(evaluacionId)
            ])
            const notas = new Map(calificaciones.map(c => [String(c.estudiante), c.nota]))
            return {
                evaluacion: aEvaluacion(evaluacion),
                estudiantes: matriculas.map(({ estudiante: e }) => ({
                    id: String(e._id), nombre: e.nombre, apellido: e.apellido, cedula: e.cedula,
                    nota: notas.get(String(e._id)) ?? null
                }))
            }
        },

        // Boletín: promedios por clase y resultado del año, para admin, profesor del curso o representante
        async boletin(usuario, estudianteId, periodoId) {
            const periodo = await periodosServicio.resolver(periodoId)
            await politicas.asegurarAccesoEstudiante(usuario, estudianteId, periodo._id)
            const matricula = await estudiantesRepo.matriculaDe(estudianteId, periodo._id)
            if (!matricula) throw new NoEncontradoError('Matrícula del estudiante en el periodo')
            const clases = await academicoRepo.listarClases({ periodo: periodo._id, curso: matricula.curso._id })
            const evaluaciones = await calificacionesRepo.evaluacionesDeClases(clases.map(c => c._id))
            const calificaciones = await calificacionesRepo.calificacionesDeEstudiantes([estudianteId], evaluaciones.map(e => e._id))
            const notas = new Map(calificaciones.map(c => [String(c.evaluacion), c.nota]))

            const materias = clases.map((clase) => {
                const propias = evaluaciones.filter(e => String(e.clase) === String(clase._id))
                const promedio = calcularPromedioClase({ evaluaciones: propias, notasPorEvaluacion: notas, ponderaciones: periodo.ponderaciones })
                return {
                    clase: aClase(clase),
                    promedio,
                    evaluaciones: propias.map(e => ({ ...aEvaluacion(e), nota: notas.get(String(e._id)) ?? null }))
                }
            })
            const resultado = decidirPromocion({
                nivel: matricula.curso.nivel,
                promediosFinales: materias.map(m => m.promedio.final),
                notaMinima: periodo.notaMinima,
                nivelMinimoReprobacion: periodo.nivelMinimoReprobacion
            })
            return {
                periodo: { id: String(periodo._id), nombre: periodo.nombre, estado: periodo.estado, ponderaciones: periodo.ponderaciones },
                estudiante: estudianteId,
                materias,
                resultado: { ...resultado, provisional: periodo.estado !== 'cerrado' }
            }
        }
    }
}
