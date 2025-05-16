import cursoAsignado from "../models/cursoAsignado.js";
import cursos from "../models/cursos.js";
import notas from "../models/notas.js";
import mongoose from "mongoose";

// Registra una nota para un estudiante en una materia y año lectivo
const subirNotasEstudiantes = async (req, res) => {
    const { nota, descripcion, tipo } = req.body;
    const { estudianteBDD, materiaBDD } = req;
    const notasEstudiante = await notas.findOne({ estudiante: estudianteBDD._id, materia: materiaBDD._id, anioLectivo: req.userBDD.anio._id });
    if (!notasEstudiante) {
        const nuevaNota = new notas({ estudiante: estudianteBDD._id, materia: materiaBDD._id });
        const subirNota = await nuevaNota.agregarNota(tipo, nota, descripcion);
        if (subirNota?.error) return res.status(400).json({ error: subirNota.error });
    } else {
        const subirNota = await notasEstudiante.agregarNota(tipo, nota, descripcion);
        if (subirNota?.error) return res.status(400).json({ error: subirNota.error });
    }
    res.status(200).json({ msg: 'Nota registrada correctamente' });
};

// Modifica una nota existente de un estudiante
const modificarNotasEstudiantes = async (req, res) => {
    const { nota, tipo, descripcion } = req.body;
    const { notasEstudiante } = req;
    const actualizarNota = await notasEstudiante.actualizarNota(tipo, nota, descripcion);
    if (actualizarNota?.error) return res.status(400).json({ error: actualizarNota.error });
    res.status(200).json({ msg: 'Nota actualizada correctamente' });
}

// Registra una observación para un estudiante por parte del profesor
const observacionesEstudiantes = async (req, res) => {
    const { observacion } = req.body;
    const { estudianteBDD, profesorBDD } = req;
    const date = new Date();
    const fecha = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    const nuevaObservacion = { fecha, observacion, profesor: profesorBDD._id };
    await estudianteBDD.registrarObservacion(nuevaObservacion);
    res.status(200).json({ msg: 'Observación registrada correctamente' });
}

// Visualiza los estudiantes de un curso para una materia y profesor
const visualizarEstudiantesCurso = async (req, res) => {
    const { materiaBDD } = req;
    const curso = await cursoBDD.findOne( materiaBDD._id);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
    const listado = await cursoAsignado.findOne({ curso: curso._id }).populate('estudiantes', 'nombre apellido cedula estado');
    if (listado?.estudiantes.length === 0) return res.status(404).json({ error: 'No hay estudiantes en este curso' });
    const estudiantes = listado.estudiantes.filter(estudiante => estudiante.estado === true);
    if (estudiantes.length === 0) return res.status(404).json({ error: 'No hay estudiantes activos en este curso' });
    res.status(200).json({ estudiantes });
}

// Visualiza los cursos asociados a un profesor
const visualizarCursosAsociados = async (req, res) => {
    const { id } = req.userBDD;
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

// Visualiza las materias asignadas a un curso específico
const visualizarMateriasAsignadas = async (req, res) => {
    // Obtiene el id del usuario y el id del curso desde los parámetros
    const { cursoId } = req.params;
    // Realiza un aggregate para obtener las materias asignadas al curso
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
                _id: 1,
                'materiasDetalle.nombre': 1,
                'materiasDetalle._id': 1
            }
        }
    ]);
    // Si no hay materias asignadas, retorna error
    if (!materiasAsignadas || materiasAsignadas.length === 0) return res.status(404).json({ error: 'No hay materias asignadas' });
    // Devuelve las materias asignadas encontradas
    res.status(200).json({ materiasAsignadas })
}

export {
    subirNotasEstudiantes,
    modificarNotasEstudiantes,
    visualizarCursosAsociados,
    observacionesEstudiantes,
    visualizarEstudiantesCurso,
    visualizarMateriasAsignadas
}