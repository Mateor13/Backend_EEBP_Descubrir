import { Observacion } from '../../infra/db/modelos.js'

export const crearObservacionesRepositorio = () => ({
    crear: (datos) => Observacion.create(datos),
    delEstudiante: (estudianteId, periodoId) => Observacion.find({ estudiante: estudianteId, periodo: periodoId })
        .sort({ fecha: -1 }).populate('autor', 'nombre apellido').lean()
})
