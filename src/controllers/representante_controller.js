import Representante from "../models/representante.js";
import cursoAsignados from "../models/cursoAsignado.js"
import Notas from "../models/notas.js"
import Observaciones from "../models/observaciones.js";
import Asistencia from "../models/asistencia.js";
import anioLectivo from "../models/anioLectivo.js";

// Obtiene los estudiantes asociados al representante autenticado
const verEstudiantes = async (req, res) => {
    const { id, anio } = req.userBDD;
    // 1. Buscar representante y estudiantes
    const representante = await Representante.findById(id)
        .select('nombre apellido estudiantes _id')
        .populate('estudiantes', 'nombre apellido cedula estado');
    if (!representante || representante.estudiantes.length === 0) {
        return res.status(404).json({ error: 'No se encontraron estudiantes' });
    }
    // 2. Buscar el curso de cada estudiante para el año lectivo actual
    const estudiantesConCurso = await Promise.all(
        representante.estudiantes.map(async (est) => {
            const cursoAsignado = await cursoAsignados.findOne({
                estudiantes: est._id,
                anioLectivo: anio
            }).populate('curso', 'nombre');
            return {
                ...est.toObject(),
                curso: cursoAsignado && cursoAsignado.curso ? cursoAsignado.curso : null
            };
        })
    );
    // 3. Retornar representante con estudiantes y su curso
    return res.status(200).json({
        id: representante._id,
        nombre: representante.nombre,
        apellido: representante.apellido,
        estudiantes: estudiantesConCurso.map(est => ({
            id: est._id,
            nombre: est.nombre,
            apellido: est.apellido,
            cedula: est.cedula,
            estado: est.estado,
            curso: est.curso.nombre || null // Nombre del curso o null si no tiene
        }))
    });
}

// Obtiene las materias de un estudiante para el año lectivo actual
const verMateriasEstudiante = async (req, res) => {
    try {
        const { idEstudiante } = req.params;
        const { anio } = req.userBDD;
        const materias = await cursoAsignados.findOne({ estudiantes: idEstudiante, anioLectivo: anio })
            .populate({
                path: 'curso',
                populate: {
                    path: 'materias',
                    select: 'nombre _id'
                }
            });
        if (!materias || !materias.curso || !materias.curso.materias) {
            return res.status(404).json({ error: 'No se encontraron materias para el estudiante' });
        }
        const materiasFiltradas = materias.curso.materias.map(materia => ({
            id: materia._id,
            nombre: materia.nombre
        }));
        return res.status(200).json(materiasFiltradas);
    } catch (error) {
        console.error('Error al obtener materias del estudiante:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// Obtiene las notas de un estudiante en una materia específica
const verNotasEstudiante = async (req, res) => {
    try {
        const { idEstudiante, idMateria } = req.params
        const { anio } = req.userBDD

        const anioLectivoBDD = await anioLectivo.findById(anio)
        // Verificar que el estudiante y la materia existen
        const notas = await Notas.findOne({ estudiante: idEstudiante, materia: idMateria, anioLectivo: anio })
            .populate('materia', 'nombre')
            .populate('estudiante', 'nombre apellido cedula')
        if (!notas) return res.status(404).json({ error: 'No se encontraron notas para el estudiante' })

        const tipoMap = {
            deberes: 'deber',
            talleres: 'taller',
            examenes: 'examen',
            pruebas: 'prueba'
        };

        const evaluaciones = [];
        for (const tipo of ['deberes', 'talleres', 'examenes', 'pruebas']) {
            (notas.evaluaciones[tipo] || []).forEach(ev => {
                evaluaciones.push({
                    tipo: tipoMap[tipo],
                    nota: ev.nota,
                    descripcion: ev.descripcion,
                    fecha: ev.fecha,
                    id: ev._id
                });
            });
        }

        return res.status(200).json({
            estudiante: {
                id: notas.estudiante._id,
                nombre: notas.estudiante.nombre,
                apellido: notas.estudiante.apellido,
                cedula: notas.estudiante.cedula
            },
            materia: {
                id: notas.materia._id,
                nombre: notas.materia.nombre
            },
            anioLectivo: anioLectivoBDD.periodo,
            evaluaciones
        });
    } catch (error) {
        console.error('Error al obtener notas del estudiante:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// Obtiene las observaciones de un estudiante, incluyendo el nombre del profesor
const verObservacionesEstudiante = async (req, res) => {
    try {
        const { anio } = req.userBDD
        const { idEstudiante } = req.params
        const observaciones = await Observaciones.findOne({ estudiante: idEstudiante, anioLectivo: anio })
            .populate('estudiante', 'nombre apellido cedula')
            .populate('observaciones.profesor', 'nombre apellido')
        if (!observaciones) {
            return res.status(404).json({ error: 'No se encontraron observaciones para el estudiante especificado' });
        }

        // Formatear la respuesta
        const respuesta = {
            estudiante: {
                id: observaciones.estudiante._id,
                nombre: observaciones.estudiante.nombre,
                apellido: observaciones.estudiante.apellido,
                cedula: observaciones.estudiante.cedula
            },
            anioLectivo: observaciones.anioLectivo,
            numeroObservaciones: observaciones.observaciones.length,
            observaciones: observaciones.observaciones.map(obs => ({
                fecha: obs.fecha,
                observacion: obs.observacion,
                profesor: obs.profesor ? {
                    id: obs.profesor._id,
                    nombre: obs.profesor.nombre,
                    apellido: obs.profesor.apellido
                } : null
            }))
        };

        res.status(200).json(respuesta);
    } catch (error) {
        console.error('Error al obtener observaciones del estudiante:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// Obtiene la asistencia de un estudiante (faltas y registros)
const verAsistenciaEstudiante = async (req, res) => {
    try {
        const { anio } = req.userBDD
        const { idEstudiante } = req.params
        const anioLectivoBDD = await anioLectivo.findById(anio)
        const asistencia = await Asistencia.findOne({ estudiante: idEstudiante, anioLectivo: anio })
            .populate('estudiante', 'nombre apellido cedula')
        if (!asistencia) return res.status(404).json({ error: 'No se encontraron registros de asistencia para el estudiante' })

        const respuesta = {
            estudiante: {
                id: asistencia.estudiante._id,
                nombre: asistencia.estudiante.nombre,
                apellido: asistencia.estudiante.apellido,
                cedula: asistencia.estudiante.cedula
            },
            anioLectivo: anioLectivoBDD.periodo,
            totalFaltas: asistencia.faltas,
            registrosAsistencia: asistencia.asistencia.map(a => ({
                fecha: a.fecha,
                presente: a.presente,
                justificacion: a.justificacion || ""
            }))
        };

        return res.status(200).json(respuesta)
    } catch (error) {
        console.error('Error al obtener asistencia del estudiante:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

export {
    verEstudiantes,
    verNotasEstudiante,
    verObservacionesEstudiante,
    verAsistenciaEstudiante,
    verMateriasEstudiante
};