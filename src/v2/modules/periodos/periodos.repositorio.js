import { Periodo } from '../../infra/db/modelos.js'

export const crearPeriodosRepositorio = () => ({
    buscarPorId: (id) => Periodo.findById(id).lean(),
    buscarActivo: () => Periodo.findOne({ estado: 'activo' }).lean(),
    listar: () => Periodo.find().sort({ inicio: -1 }).lean(),
    crear: (datos) => Periodo.create(datos),
    actualizar: (id, cambios, session) => Periodo.findByIdAndUpdate(id, cambios, { new: true, runValidators: true, session }).lean(),
    cerrarVencidos: (ahora) => Periodo.updateMany(
        { estado: 'activo', fin: { $ne: null, $lte: ahora } },
        { estado: 'cerrado' }
    )
})
