import { ConflictoError, NoEncontradoError } from '../../shared/errores.js'
import { calcularPromedioClase, decidirPromocion, nivelDestino } from '../calificaciones/dominio/promedios.js'

// Pasa a los estudiantes de un periodo al siguiente. Reemplaza a "promoverEstudiantesPorNivel"
// de la v1 (que vivía dentro de un esquema de Mongoose y reprobaba a todos por un await faltante).
// Toda la escritura ocurre en una transacción: si algo falla, no queda una promoción a medias.
export const crearPromocionServicio = ({ periodosRepo, estudiantesRepo, academicoRepo, calificacionesRepo, enTransaccion }) => ({
    // Calcula el resultado de cada estudiante SIN escribir nada (sirve como vista previa)
    async calcular(origenId) {
        const origen = await periodosRepo.buscarPorId(origenId)
        if (!origen) throw new NoEncontradoError('Periodo de origen')
        const matriculas = (await estudiantesRepo.matriculasVigentesDelPeriodo(origen._id)).filter(m => m.estudiante?.activo)
        const clases = await academicoRepo.clasesDelPeriodo(origen._id)
        const evaluaciones = await calificacionesRepo.evaluacionesDeClases(clases.map(c => c._id))
        const calificaciones = await calificacionesRepo.calificacionesDeEstudiantes(
            matriculas.map(m => m.estudiante._id), evaluaciones.map(e => e._id)
        )
        // Índice nota[estudiante][evaluacion] para no recorrer listas en cada cálculo
        const notas = new Map()
        for (const c of calificaciones) {
            const clave = String(c.estudiante)
            if (!notas.has(clave)) notas.set(clave, new Map())
            notas.get(clave).set(String(c.evaluacion), c.nota)
        }
        return matriculas.map((m) => {
            const notasEstudiante = notas.get(String(m.estudiante._id)) ?? new Map()
            const promediosFinales = clases
                .filter(c => String(c.curso) === String(m.curso._id))
                .map(c => calcularPromedioClase({
                    evaluaciones: evaluaciones.filter(e => String(e.clase) === String(c._id)),
                    notasPorEvaluacion: notasEstudiante,
                    ponderaciones: origen.ponderaciones
                }).final)
            const { aprueba, clasesReprobadas } = decidirPromocion({
                nivel: m.curso.nivel, promediosFinales,
                notaMinima: origen.notaMinima, nivelMinimoReprobacion: origen.nivelMinimoReprobacion
            })
            return { matricula: m, aprueba, clasesReprobadas, nivelDestino: nivelDestino({ nivel: m.curso.nivel, aprueba }) }
        })
    },

    async promover({ origen: origenId, destino: destinoId, copiarClases = true }) {
        const [origen, destino] = await Promise.all([periodosRepo.buscarPorId(origenId), periodosRepo.buscarPorId(destinoId)])
        if (!origen || !destino) throw new NoEncontradoError('Periodo')
        if (origen.estado !== 'cerrado') throw new ConflictoError('Cierre el periodo de origen antes de promover')
        if (destino.estado === 'cerrado') throw new ConflictoError('El periodo de destino está cerrado')

        const resultados = await this.calcular(origen._id)
        const resumen = { promovidos: 0, repiten: 0, egresados: 0, yaMatriculados: 0, clasesCopiadas: 0 }

        await enTransaccion(async (session) => {
            const yaEnDestino = new Set((await estudiantesRepo.matriculasVigentesDelPeriodo(destino._id, session)).map(m => String(m.estudiante._id)))
            const nuevas = []
            for (const r of resultados) {
                const idEst = String(r.matricula.estudiante._id)
                if (r.nivelDestino === null) { resumen.egresados++; continue }
                if (yaEnDestino.has(idEst)) { resumen.yaMatriculados++; continue }
                const curso = await academicoRepo.obtenerOCrearCurso(r.nivelDestino, r.matricula.curso.paralelo, session)
                nuevas.push({ periodo: destino._id, curso: curso._id, estudiante: idEst })
                r.aprueba ? resumen.promovidos++ : resumen.repiten++
            }
            if (nuevas.length) await estudiantesRepo.insertarMatriculas(nuevas, session)
            await estudiantesRepo.actualizarEstadosMatricula(resultados.map(r => ({
                updateOne: { filter: { _id: r.matricula._id }, update: { estado: r.aprueba ? 'aprobada' : 'reprobada' } }
            })), session)

            // Copia la planta docente (misma asignatura y profesor por curso) si el destino no la tiene
            if (copiarClases) {
                const existentes = new Set((await academicoRepo.clasesDelPeriodo(destino._id, session)).map(c => `${c.curso}-${c.asignatura}`))
                const copias = (await academicoRepo.clasesDelPeriodo(origen._id, session))
                    .filter(c => !existentes.has(`${c.curso}-${c.asignatura}`))
                    .map(({ curso, asignatura, profesor }) => ({ periodo: destino._id, curso, asignatura, profesor }))
                if (copias.length) await academicoRepo.insertarClases(copias, session)
                resumen.clasesCopiadas = copias.length
            }
        })
        return resumen
    }
})
