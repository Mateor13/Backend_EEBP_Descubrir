import { Evaluacion, Calificacion } from '../../infra/db/modelos.js'

export const crearCalificacionesRepositorio = () => ({
    // Evaluaciones
    crearEvaluacion: (datos) => Evaluacion.create(datos),
    buscarEvaluacion: (id) => Evaluacion.findById(id).lean(),
    actualizarEvaluacion: (id, cambios) => Evaluacion.findByIdAndUpdate(id, cambios, { new: true, runValidators: true }).lean(),
    eliminarEvaluacion: (id, session) => Evaluacion.deleteOne({ _id: id }, { session }),
    evaluacionesDeClase: (claseId, tipo) => Evaluacion.find({ clase: claseId, ...(tipo && { tipo }) }).sort({ fecha: 1, createdAt: 1 }).lean(),
    evaluacionesDeClases: (claseIds) => Evaluacion.find({ clase: { $in: claseIds } }).sort({ fecha: 1 }).lean(),

    // Calificaciones
    calificacionesDeEvaluacion: (evaluacionId) => Calificacion.find({ evaluacion: evaluacionId }).lean(),
    calificacionesDeEstudiantes: (estudianteIds, evaluacionIds) => Calificacion.find({ estudiante: { $in: estudianteIds }, evaluacion: { $in: evaluacionIds } }).lean(),
    // Un único bulkWrite con upsert: registrar o corregir notas es la misma operación
    guardarCalificaciones: (evaluacionId, calificaciones, usuarioId) => Calificacion.bulkWrite(
        calificaciones.map(({ estudiante, nota }) => ({
            updateOne: {
                filter: { evaluacion: evaluacionId, estudiante },
                update: { $set: { nota, registradaPor: usuarioId } },
                upsert: true
            }
        }))
    ),
    eliminarCalificacionesDeEvaluacion: (evaluacionId, session) => Calificacion.deleteMany({ evaluacion: evaluacionId }, { session })
})
