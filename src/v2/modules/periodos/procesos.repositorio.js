import { ProcesoPromocion } from '../../infra/db/modelos.js'

export const crearProcesosRepositorio = () => ({
    buscarPorOrigen: (origenId) => ProcesoPromocion.findOne({ origen: origenId }).lean(),
    guardar: (origenId, datos) => ProcesoPromocion.findOneAndUpdate(
        { origen: origenId }, { $set: datos }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    ).lean(),
    // Toma el candado solo si está libre o vencido (operación atómica en MongoDB)
    bloquear: (origenId, hasta, ahora = new Date()) => ProcesoPromocion.findOneAndUpdate(
        { origen: origenId, estado: 'en_progreso', $or: [{ bloqueadoHasta: null }, { bloqueadoHasta: { $lt: ahora } }] },
        { $set: { bloqueadoHasta: hasta } }, { returnDocument: 'after' }
    ).lean(),
    liberar: (origenId) => ProcesoPromocion.updateOne({ origen: origenId }, { $set: { bloqueadoHasta: null } }),
    // Se ejecuta en la MISMA transacción que las matrículas del curso: el avance nunca queda desfasado
    marcarCursoProcesado: (procesoId, cursoId, incrementos, session) => ProcesoPromocion.updateOne(
        { _id: procesoId }, { $pull: { cursosPendientes: cursoId }, $inc: incrementos }, { session }
    ),
    completar: (procesoId) => ProcesoPromocion.findOneAndUpdate(
        { _id: procesoId, cursosPendientes: { $size: 0 } },
        { $set: { estado: 'completado', finalizado: new Date(), bloqueadoHasta: null } }, { returnDocument: 'after' }
    ).lean()
})
