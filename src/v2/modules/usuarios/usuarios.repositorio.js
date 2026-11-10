import { Usuario } from '../../infra/db/modelos.js'

// Único lugar que sabe CÓMO se guardan los usuarios. Los servicios solo llaman a estas funciones.
export const crearUsuariosRepositorio = () => ({
    buscarPorId: (id) => Usuario.findById(id).lean(),
    buscarPorIdConSecretos: (id) => Usuario.findById(id).select('+passwordHash'),
    buscarPorEmailConSecretos: (email) => Usuario.findOne({ email }).select('+passwordHash'),
    buscarPorEmail: (email) => Usuario.findOne({ email }),
    buscarPorTokenConfirmacion: (hash) => Usuario.findOne({ 'tokenConfirmacion.hash': hash }).select('+tokenConfirmacion'),
    buscarPorTokenRecuperacion: (hash) => Usuario.findOne({ 'tokenRecuperacion.hash': hash }).select('+tokenRecuperacion +passwordHash'),
    existeConDatos: ({ email, cedula, excluirId }) => Usuario.exists({
        $or: [{ email }, { cedula }].filter(c => Object.values(c)[0] !== undefined),
        ...(excluirId && { _id: { $ne: excluirId } })
    }),
    crear: (datos) => Usuario.create(datos),
    actualizar: (id, cambios) => Usuario.findByIdAndUpdate(id, cambios, { returnDocument: 'after', runValidators: true }).lean(),
    listar: ({ rol, activo = true }) => Usuario.find({ activo, ...(rol && { roles: rol }) }).sort({ apellido: 1, nombre: 1 }).lean(),
    contarAdminsActivos: () => Usuario.countDocuments({ roles: 'admin', activo: true }),
    eliminar: (id) => Usuario.deleteOne({ _id: id })
})
