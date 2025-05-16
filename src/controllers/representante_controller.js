import Representante from "../models/representante.js";
import cursoAsignados from "../models/cursoAsignado.js"
import Notas from "../models/notas.js"
import Observaciones from "../models/observaciones.js";
import Asistencia from "../models/asistencia.js";

// Obtiene los estudiantes asociados al representante autenticado
const verEstudiantes = async (req, res) => {
    const { id } = req.userBDD
    const representante = await Representante.findById(id).select('nombre apellido estudiantes _id').populate('estudiantes', 'nombre apellido cedula estado');
    if (representante.estudiantes.length === 0) return res.status(404).json({ error: 'No se encontraron estudiantes ' })
    return res.status(200).json(representante)
}

// Obtiene las materias de un estudiante para el año lectivo actual
const verMateriasEstudiante = async (req, res) => {
    const { idEstudiante } = req.params
    const { anio } = req.userBDD
    const materias = await cursoAsignados.findOne({ estudiantes: idEstudiante, anioLectivo: anio })
        .populate('curso.materias', 'nombre _id')
        .populate('curso', 'materias');
    if (!materias || !materias.curso || !materias.curso.materias) {
        return res.status(404).json({ error: 'No se encontraron materias para el estudiante' })
    }
    const materiasFiltradas = materias.curso.materias.map(materia => ({
        id: materia._id,
        nombre: materia.nombre
    }))
    return res.status(200).json(materiasFiltradas)
}

// Obtiene las notas de un estudiante en una materia específica
const verNotasEstudiante = async (req, res) => {
    const { idEstudiante, idMaterias } = req.params
    const notas = await Notas.findOne({ estudiante: idEstudiante, materia: idMaterias, anioLectivo: anio }).populate('materia', 'nombre').populate('estudiante', 'nombre apellido cedula')
    if (!notas) return res.status(404).json({ error: 'No se encontraron notas para el estudiante' })
    return res.status(200).json(notas)
}

// Obtiene las observaciones de un estudiante, incluyendo el nombre del profesor
const verObservacionesEstudiante = async (req, res) => {
    const { anio } = req.userBDD
    const { idEstudiante } = req.params
    const observaciones = await Observaciones.findOne({ estudiante: idEstudiante, anioLectivo: anio }).populate('estudiante', 'nombre apellido cedula').populate('observaciones.profesor', 'nombre apellido')
    if (!observaciones) {
        return res.status(404).json({ error: 'No se encontraron observaciones para el estudiante especificado' });
    }
    res.status(200).json(observaciones);
}

// Obtiene la asistencia de un estudiante (faltas y registros)
const verAsistenciaEstudiante = async (req, res) => {
    const { anio } = req.userBDD
    const { idEstudiante } = req.params
    const asistencia = await Asistencia.findOne({ estudiante: idEstudiante, anioLectivo: anio }).populate('estudiante', 'nombre apellido cedula').populate('asistencias.faltas', 'fecha')
    if (!asistencia) return res.status(404).json({ error: 'No se encontraron registros de asistencia para el estudiante' })
    return res.status(200).json(asistencia)
}

export {
    verEstudiantes,
    verNotasEstudiante,
    verObservacionesEstudiante,
    verAsistenciaEstudiante,
    verMateriasEstudiante
};