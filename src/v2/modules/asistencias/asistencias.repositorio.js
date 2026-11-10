import { Asistencia } from '../../infra/db/modelos.js'

export const crearAsistenciasRepositorio = () => ({
    buscarPorId: (id) => Asistencia.findById(id).lean(),
    // Registrar la lista del día es idempotente: si se envía dos veces, se actualiza
    guardarDelDia: ({ periodo, curso, fecha, registros, usuarioId }) => Asistencia.bulkWrite(
        registros.map(({ estudiante, estado }) => ({
            updateOne: {
                filter: { estudiante, fecha },
                update: { $set: { periodo, curso, estado, registradaPor: usuarioId } },
                upsert: true
            }
        }))
    ),
    delCursoEnFecha: (cursoId, fecha) => Asistencia.find({ curso: cursoId, fecha }).lean(),
    delEstudiante: (estudianteId, periodoId) => Asistencia.find({ estudiante: estudianteId, periodo: periodoId }).sort({ fecha: -1 }).lean(),
    actualizar: (id, cambios) => Asistencia.findByIdAndUpdate(id, cambios, { returnDocument: 'after', runValidators: true }).lean()
})
