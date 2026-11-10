import { Estudiante, Matricula } from '../../infra/db/modelos.js'

export const crearEstudiantesRepositorio = () => ({
    buscarPorId: (id) => Estudiante.findById(id).lean(),
    buscarDetallado: (id) => Estudiante.findById(id).populate('representantes', 'nombre apellido email telefono').lean(),
    existeCedula: (cedula, excluirId) => Estudiante.exists({ cedula, ...(excluirId && { _id: { $ne: excluirId } }) }),
    crear: (datos, session) => Estudiante.create([datos], { session }).then(([e]) => e),
    actualizar: (id, cambios) => Estudiante.findByIdAndUpdate(id, cambios, { new: true, runValidators: true }).lean(),
    agregarRepresentante: (id, representanteId) => Estudiante.findByIdAndUpdate(id, { $addToSet: { representantes: representanteId } }, { new: true }).lean(),
    quitarRepresentante: (id, representanteId) => Estudiante.findByIdAndUpdate(id, { $pull: { representantes: representanteId } }, { new: true }).lean(),
    deRepresentante: (representanteId) => Estudiante.find({ representantes: representanteId, activo: true }).sort({ apellido: 1 }).lean(),
    esRepresentante: (estudianteId, usuarioId) => Estudiante.exists({ _id: estudianteId, representantes: usuarioId }),

    // Matrículas
    buscarMatricula: (id) => Matricula.findById(id).lean(),
    matriculaDe: (estudianteId, periodoId) => Matricula.findOne({ estudiante: estudianteId, periodo: periodoId }).populate('curso').lean(),
    crearMatricula: (datos, session) => Matricula.create([datos], { session }).then(([m]) => m),
    actualizarMatricula: (id, cambios, session) => Matricula.findByIdAndUpdate(id, cambios, { new: true, runValidators: true, session }).lean(),
    matriculasDelCurso: (cursoId, periodoId) => Matricula.find({ curso: cursoId, periodo: periodoId, estado: { $ne: 'retirada' } })
        .populate({ path: 'estudiante', match: { activo: true }, select: 'nombre apellido cedula' }).lean()
        .then(ms => ms.filter(m => m.estudiante).sort((a, b) => a.estudiante.apellido.localeCompare(b.estudiante.apellido))),
    idsEstudiantesDelCurso: (cursoId, periodoId) => Matricula.distinct('estudiante', { curso: cursoId, periodo: periodoId, estado: 'activa' }),
    // Matrículas vigentes (no retiradas) de un periodo, con curso y estado del estudiante
    matriculasVigentesDelPeriodo: (periodoId, session) => Matricula.find({ periodo: periodoId, estado: { $ne: 'retirada' } })
        .populate('curso').populate('estudiante', 'activo').session(session ?? null).lean(),
    insertarMatriculas: (matriculas, session) => Matricula.insertMany(matriculas, { session }),
    actualizarEstadosMatricula: (operaciones, session) => Matricula.bulkWrite(operaciones, { session })
})
