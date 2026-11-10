import { NoEncontradoError, SolicitudInvalidaError, ConflictoError } from '../../shared/errores.js'
import { diaDesdeISO, hoyEnEscuela } from '../../shared/utils/fechas.js'
import { ESTADOS_ASISTENCIA } from '../../infra/db/modelos.js'

export const crearAsistenciasServicio = ({ asistenciasRepo, estudiantesRepo, periodosServicio, politicas }) => {
    const resolverFecha = (fecha) => {
        const dia = fecha ? diaDesdeISO(fecha) : hoyEnEscuela()
        if (dia > hoyEnEscuela()) throw new SolicitudInvalidaError('No se puede registrar asistencia de una fecha futura')
        return dia
    }

    return {
        // Registra (o corrige) la lista del día de un curso. Enviarla dos veces no duplica nada.
        async registrarDelDia(usuario, cursoId, { fecha, registros }) {
            const periodo = await periodosServicio.activo()
            await politicas.asegurarAccesoCurso(usuario, cursoId, periodo._id)
            const dia = resolverFecha(fecha)
            if (dia < periodo.inicio) throw new SolicitudInvalidaError('La fecha es anterior al inicio del periodo')
            const delCurso = new Set((await estudiantesRepo.idsEstudiantesDelCurso(cursoId, periodo._id)).map(String))
            const ajenos = registros.filter(r => !delCurso.has(r.estudiante))
            if (ajenos.length) throw new SolicitudInvalidaError('Hay estudiantes que no pertenecen a este curso', ajenos.map(a => a.estudiante))
            await asistenciasRepo.guardarDelDia({ periodo: periodo._id, curso: cursoId, fecha: dia, registros, usuarioId: usuario.id })
            return { registradas: registros.length, fecha: dia }
        },

        async listaDelDia(usuario, cursoId, fecha) {
            const periodo = await periodosServicio.activo()
            await politicas.asegurarAccesoCurso(usuario, cursoId, periodo._id)
            const dia = resolverFecha(fecha)
            const [matriculas, registros] = await Promise.all([
                estudiantesRepo.matriculasDelCurso(cursoId, periodo._id),
                asistenciasRepo.delCursoEnFecha(cursoId, dia)
            ])
            const porEstudiante = new Map(registros.map(r => [String(r.estudiante), r]))
            return {
                fecha: dia,
                registrada: registros.length > 0,
                estudiantes: matriculas.map(({ estudiante: e }) => {
                    const r = porEstudiante.get(String(e._id))
                    return { id: String(e._id), nombre: e.nombre, apellido: e.apellido, estado: r?.estado ?? null, asistenciaId: r ? String(r._id) : null }
                })
            }
        },

        async justificar(asistenciaId, justificacion) {
            const asistencia = await asistenciasRepo.buscarPorId(asistenciaId)
            if (!asistencia) throw new NoEncontradoError('Registro de asistencia')
            periodosServicio.asegurarEditable(await periodosServicio.resolver(asistencia.periodo))
            if (!['ausente', 'atraso'].includes(asistencia.estado)) throw new ConflictoError('Solo se pueden justificar ausencias o atrasos')
            return asistenciasRepo.actualizar(asistenciaId, { estado: 'justificado', justificacion })
        },

        // Las faltas se CALCULAN a partir de los registros (antes había un contador que se desincronizaba)
        async delEstudiante(usuario, estudianteId, periodoId) {
            const periodo = await periodosServicio.resolver(periodoId)
            await politicas.asegurarAccesoEstudiante(usuario, estudianteId, periodo._id)
            const registros = await asistenciasRepo.delEstudiante(estudianteId, periodo._id)
            const resumen = Object.fromEntries(ESTADOS_ASISTENCIA.map(e => [e, 0]))
            for (const r of registros) resumen[r.estado]++
            return {
                periodo: periodo.nombre,
                resumen,
                registros: registros.map(r => ({ id: String(r._id), fecha: r.fecha, estado: r.estado, justificacion: r.justificacion }))
            }
        }
    }
}
