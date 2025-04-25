
import cursos from "../models/cursos.js";
import notas from "../models/notas.js";
import mongoose from "mongoose";

const subirNotasEstudiantes = async (req, res) => {
    // Paso 1: Obtener los datos
    const { nota, motivo } = req.body;
    const { estudianteBDD, materiaBDD } = req;
    // Paso 2: Manipular la BDD
    const notasEstudiante = await notas.findOne({ estudiante: estudianteBDD._id, materia: materiaBDD._id });
    if (!notasEstudiante) {
        const nuevaNota = new notas({ estudiante: estudianteBDD._id, materia: materiaBDD._id });
        const subirNota = await nuevaNota.agregarNota(nota, motivo);
        if (subirNota?.error) return res.status(400).json({ error: subirNota.error });
    } else {
        const subirNota = await notasEstudiante.agregarNota(nota, motivo);
        if (subirNota?.error) return res.status(400).json({ error: subirNota.error });
    }
    req.estudianteBDD = null;
    req.materiaBDD = null;
    res.status(200).json({ msg: 'Nota registrada correctamente' });
};

const modificarNotasEstudiantes = async (req, res) => {
    // Paso 1: Obtener los datos
    const { nota, motivo } = req.body;
    const { notasEstudiante } = req;
    // Paso 2: Manipular la BDD
    const actualizarNota = await notasEstudiante.actualizarNota(nota, motivo);
    if (actualizarNota?.error) return res.status(400).json({ error: actualizarNota.error });
    req.estudianteBDD = null;
    req.materiaBDD = null;
    req.notasEstudiante = null;
    res.status(200).json({ msg: 'Nota actualizada correctamente' });
}

const observacionesEstudiantes = async (req, res) => {
    // Paso 1: Obtener los datos
    const { observacion } = req.body;
    const { estudianteBDD, profesorBDD } = req;
    // Paso 2: Manipular la BDD
    const date = new Date();
    const fecha = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    const nuevaObservacion = { fecha, observacion, profesor: profesorBDD._id };
    await estudianteBDD.registrarObservacion(nuevaObservacion);
    req.estudianteBDD = null;
    req.profesorBDD = null;
    res.status(200).json({ msg: 'Observación registrada correctamente' });
}

const visualizarEstudiantesCurso = async (req, res) => {
    //Paso 1: Obtener los datos
    const { materiaBDD } = req;
    const { id } = req.userBDD;
    //Paso 2: Manipular la BDD
    const estudiantes = await cursoBDD.buscarEstudiantesPorMateriaYProfesor(id, materiaBDD._id);
    if (estudiantes?.error) return res.status(400).json({ error: estudiantes.error });
    res.status(200).json({ estudiantes });
}

const visualizarCursosAsociados = async (req, res) => {
    //Paso 1: Obtener los datos
    const { id } = req.userBDD;
    //Paso 2: Manipular la BDD
    const cursosAsociados = await cursos.aggregate([
        {
            $lookup: {
                from: 'materias',
                localField: 'materias',
                foreignField: '_id',
                as: 'materiasDetalle'
            }
        },
        { $match: { 'materiasDetalle.profesor': new mongoose.Types.ObjectId(id) } },
        {
            $project: {
                nombre: 1
            }
        }
    ])
    if (!cursosAsociados || cursosAsociados.length === 0) return res.status(404).json({ error: 'No hay cursos asociados' });
    res.status(200).json({ cursosAsociados });
}

const visualizarMateriasAsignadas = async (req, res) => {
    //Paso 1: Obtener los datos
    const { id } = req.userBDD;
    const { cursoId } = req.params;
    //Paso 2: Manipular la BDD
    const materiasAsignadas = await cursos.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(cursoId) } },
        {
            $lookup: {
                from: 'materias',
                localField: 'materias',
                foreignField: '_id',
                as: 'materiasDetalle'
            }
        },
        {
            $project: {
                _id: 0,
                'materiasDetalle.nombre': 1,
                'materiasDetalle._id': 1
            }
        }
    ]);
    if (!materiasAsignadas || materiasAsignadas.length === 0) return res.status(404).json({ error: 'No hay materias asignadas' });
    res.status(200).json({ materiasAsignadas })
}

const visualizarEstudiantesPorMateria = async (req, res) => {
    // Paso 1: Obtener los datos
    const { materiaId } = req.params;

    // Paso 2: Realizar validaciones
    try {
        const estudiantesPorMateria = await cursos.aggregate([
            {
                $lookup: {
                    from: 'estudiantes',
                    localField: 'estudiantes',
                    foreignField: '_id',
                    as: 'estudiantesDetalle'
                }
            },
            {
                $lookup: {
                    from: 'materias',
                    localField: 'materias',
                    foreignField: '_id',
                    as: 'materiasDetalle'
                }
            },
            {
                $unwind: '$estudiantesDetalle'
            },
            {
                $unwind: '$materiasDetalle'
            },
            {
                $match: {
                    'materiasDetalle._id': new mongoose.Types.ObjectId(materiaId)
                }
            },
            {
                $lookup: {
                    from: 'notas',
                    let: { estudianteId: '$estudiantesDetalle._id', materiaID: '$materiasDetalle._id' },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ['$estudiante', '$$estudianteId'] }, { $eq: ['$materia', '$$materiaID'] }] } } },
                        { $unwind: '$notas' },
                        { $project: { 'notas.nota': 1, 'notas.motivo': 1, 'notas.fecha': 1, _id: 0 } }
                    ],
                    as: 'notasDetalle'
                }
            },
            {
                $project: {
                    _id: 0,
                    'materiasDetalle.nombre': 1,
                    'estudiantesDetalle.nombre': 1,
                    'estudiantesDetalle.apellido': 1,
                    'notasDetalle': 1
                }
            }
        ]);

        if (!estudiantesPorMateria || estudiantesPorMateria.length === 0) {
            return res.status(404).json({ error: 'No se encontraron estudiantes para la materia especificada' });
        }

        // Paso 3: Manipular la BDD
        res.status(200).json({ estudiantesPorMateria });
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener los estudiantes de la materia' });
    }
};

export {
    subirNotasEstudiantes,
    modificarNotasEstudiantes,
    visualizarCursosAsociados,
    observacionesEstudiantes,
    visualizarEstudiantesCurso,
    visualizarMateriasAsignadas,
    visualizarEstudiantesPorMateria
}