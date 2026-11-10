import { Curso, Asignatura, Clase } from '../../infra/db/modelos.js'

export const crearAcademicoRepositorio = () => ({
    // Cursos
    listarCursos: () => Curso.find().sort({ nivel: 1, paralelo: 1 }),
    buscarCurso: (id) => Curso.findById(id),
    buscarCursoPorNivel: (nivel, paralelo, session) => Curso.findOne({ nivel, paralelo }).session(session ?? null),
    obtenerOCrearCurso: (nivel, paralelo, session) => Curso.findOneAndUpdate(
        { nivel, paralelo }, { $setOnInsert: { nivel, paralelo } }, { upsert: true, returnDocument: 'after', session }
    ),
    buscarCursos: (ids) => Curso.find({ _id: { $in: ids } }).lean(),
    // Crea de una sola vez (bulk) los cursos que falten: [{ nivel, paralelo }]
    asegurarCursos: (pares) => Curso.bulkWrite(pares.map(({ nivel, paralelo }) => ({
        updateOne: { filter: { nivel, paralelo }, update: { $setOnInsert: { nivel, paralelo } }, upsert: true }
    }))),
    // Asignaturas
    listarAsignaturas: () => Asignatura.find({ activo: true }).sort({ nombre: 1 }).lean(),
    buscarAsignatura: (id) => Asignatura.findById(id).lean(),
    crearAsignatura: (datos) => Asignatura.create(datos),
    actualizarAsignatura: (id, cambios) => Asignatura.findByIdAndUpdate(id, cambios, { returnDocument: 'after', runValidators: true }).lean(),
    // Clases
    buscarClase: (id) => Clase.findById(id).lean(),
    buscarClaseDetallada: (id) => Clase.findById(id).populate('curso').populate('asignatura', 'nombre').populate('profesor', 'nombre apellido').lean(),
    listarClases: (filtro) => Clase.find({ activo: true, ...filtro })
        .populate('curso').populate('asignatura', 'nombre').populate('profesor', 'nombre apellido'),
    existeClaseDeProfesorEnCurso: (profesorId, cursoId, periodoId) => Clase.exists({ profesor: profesorId, curso: cursoId, periodo: periodoId, activo: true }),
    cursosDeProfesor: (profesorId, periodoId) => Clase.distinct('curso', { profesor: profesorId, periodo: periodoId, activo: true }),
    crearClase: (datos) => Clase.create(datos),
    actualizarClase: (id, cambios) => Clase.findByIdAndUpdate(id, cambios, { returnDocument: 'after', runValidators: true }).lean(),
    clasesDelCurso: (cursoId, periodoId) => Clase.find({ curso: cursoId, periodo: periodoId, activo: true }, { _id: 1 }).lean(),
    clasesDelPeriodo: (periodoId, session) => Clase.find({ periodo: periodoId, activo: true }).session(session ?? null).lean(),
    insertarClases: (clases, session) => Clase.insertMany(clases, { session, ordered: false })
})
