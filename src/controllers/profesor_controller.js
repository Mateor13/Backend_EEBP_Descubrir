import cursoAsignado from "../models/cursoAsignado.js";
import cursos from "../models/cursos.js";
import materias from "../models/materias.js";
import Notas from "../models/notas.js";
import axios from 'axios';

// Subir una imagen a Imgur y devolver la URL
const subirFotoEvidencia = async (req, res) => {
    const { tipo } = req.body;
    const { materiaBDD, cursoBDD } = req;
    const anioLectivo = req.userBDD.anio;
    const url = req.urlImgur;
    const tipoMap = {
        deberes: 'Deber',
        talleres: 'Taller',
        pruebas: 'Prueba',
        examenes: 'Examen'
    };
    try {
        // 1. Obtener el mayor número de evidencias del tipo para todos los estudiantes del curso
        let maxCantidad = 0;
        for (const estudianteId of cursoBDD.estudiantes) {
            let notasEstudiante = await Notas.findOne({ estudiante: estudianteId, materia: materiaBDD._id, anioLectivo });
            const cantidad = (notasEstudiante?.evaluaciones?.[tipo]?.length || 0);
            if (cantidad > maxCantidad) maxCantidad = cantidad;
        }
        // El número de evidencia será +1
        const descripcion = `${tipoMap[tipo] || tipo} ${maxCantidad + 1}`;
        const errores = [];
        // 2. Guardar la evidencia para todos los estudiantes del curso
        for (const estudianteId of cursoBDD.estudiantes) {
            let notasEstudiante = await Notas.findOne({ estudiante: estudianteId, materia: materiaBDD._id, anioLectivo });
            if (!notasEstudiante) {
                notasEstudiante = new Notas({ estudiante: estudianteId, materia: materiaBDD._id, anioLectivo });
            }
            const resultado = await notasEstudiante.guardarEvidencia(tipo, descripcion, url);
            if (resultado?.error) {
                errores.push(`Error en estudiante ${estudianteId}: ${resultado.error}`);
                continue;
            }
            await notasEstudiante.save();
        }
        if (errores.length > 0) {
            return res.status(400).json({ error: errores.join(', ') });
        }
        res.status(200).json({ msg: 'Foto de evidencia registrada correctamente', descripcion });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar la foto de evidencia' });
    }
};

// Registra una nota para un estudiante en una materia y año lectivo
const subirNotasEstudiantes = async (req, res) => {
    const { notas, tipo } = req.body;
    const { materiaBDD } = req;
    const anioLectivo = req.userBDD.anio;
    const tipoMap = {
        deberes: 'Deber',
        talleres: 'Taller',
        pruebas: 'Prueba',
        examenes: 'Examen'
    };
    try {
        // 1. Obtener el mayor número de evaluaciones del tipo para todos los estudiantes
        let maxCantidad = 0;
        for (const estudianteId of Object.keys(notas)) {
            let notasEstudiante = await Notas.findOne({ estudiante: estudianteId, materia: materiaBDD._id, anioLectivo });
            const cantidad = (notasEstudiante?.evaluaciones?.[tipo]?.length || 0);
            if (cantidad > maxCantidad) maxCantidad = cantidad;
        }
        const descripcion = `${tipoMap[tipo] || tipo} ${maxCantidad}`;
        // 2. Registrar la nota para todos los estudiantes con la misma descripción
        const errores = [];
        for (const [estudianteId, nota] of Object.entries(notas)) {
            let notasEstudiante = await Notas.findOne({ estudiante: estudianteId, materia: materiaBDD._id, anioLectivo });
            if (!notasEstudiante) {
                notasEstudiante = new Notas({ estudiante: estudianteId, materia: materiaBDD._id, anioLectivo });
            }
            const resultado = await notasEstudiante.agregarNota(tipo, nota, descripcion);
            if (resultado?.error) {
                errores.push(`Error en estudiante ${estudianteId}: ${resultado.error}`);
            } else {
                await notasEstudiante.save();
            }
        }
        if (errores.length > 0) return res.status(400).json({ error: errores.join(', ') });
        res.status(200).json({ msg: 'Notas registradas correctamente', descripcion });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar notas' });
    }
};

// Modifica una nota existente de un estudiante
const modificarNotasEstudiantes = async (req, res) => {
    const { notas, tipo, descripcion } = req.body;
    const { materiaBDD } = req;
    const anioLectivo = req.userBDD.anio;
    try {
        // Registrar la nota para todos los estudiantes con la misma descripción
        const errores = [];
        for (const [estudianteId, nota] of Object.entries(notas)) {
            let notasEstudiante = await Notas.findOne({ estudiante: estudianteId, materia: materiaBDD._id, anioLectivo });
            if (!notasEstudiante) {
                errores.push(`El estudiante con ID ${estudianteId} no tiene notas registradas`);
                continue;
            }
            const resultado = await notasEstudiante.actualizarNota(tipo, nota, descripcion);
            if (resultado?.error) {
                errores.push(`Error en estudiante ${estudianteId}: ${resultado.error}`);
            } else {
                await notasEstudiante.save();
            }
        }
        if (errores.length > 0) return res.status(400).json({ error: errores.join(', ') });
        res.status(200).json({ msg: 'Notas registradas correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar notas' });
    }
}

// Registra una observación para un estudiante por parte del profesor
const observacionesEstudiantes = async (req, res) => {
    const { observacion } = req.body;
    const { observacionBDD, profesorBDD } = req;
    const date = new Date();
    const fecha = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    const nuevaObservacion = { fecha, observacion, profesor: profesorBDD._id };
    await observacionBDD.registrarObservacion(nuevaObservacion);
    res.status(200).json({ msg: 'Observación registrada correctamente' });
}

// Visualiza los estudiantes de un curso para una materia y profesor
const visualizarEstudiantesCurso = async (req, res) => {
    const { cursoBDD } = req;
    const listado = await cursoAsignado.findOne({ curso: cursoBDD._id }).populate('estudiantes', 'nombre apellido cedula estado');
    if (listado?.estudiantes.length === 0) return res.status(404).json({ error: 'No hay estudiantes en este curso' });
    const estudiantes = listado.estudiantes.filter(estudiante => estudiante.estado === true);
    if (estudiantes.length === 0) return res.status(404).json({ error: 'No hay estudiantes activos en este curso' });
    res.status(200).json({ estudiantes });
}

// Visualiza los cursos asociados a un profesor
const visualizarCursosAsociados = async (req, res) => {
    const { id } = req.userBDD;
    // 1. Buscar las materias que dicta el profesor
    const materiasProfesor = await materias.find({ profesor: id });
    if (!materiasProfesor.length) {
        return res.status(404).json({ error: 'No hay materias asociadas a este profesor' });
    }
    // 2. Buscar los cursos que tienen esas materias
    const cursosAsociados = await cursos.find({ materias: { $in: materiasProfesor.map(m => m._id) } })
        .populate('materias', 'nombre _id');
    if (!cursosAsociados.length) {
        return res.status(404).json({ error: 'No hay cursos asociados' });
    }
    const respuesta = cursosAsociados.map(curso => ({
        id: curso._id,
        nombre: curso.nombre
    }));
    res.status(200).json({ cursosAsociados: respuesta });
}

// Visualiza las materias asignadas a un curso específico
const visualizarMateriasAsignadas = async (req, res) => {
    const { cursoBDD } = req;
    const { id } = req.userBDD;
    const materiasAsignadas = cursoBDD.materias.filter(materia =>
        materia.profesor._id.toString() === id.toString()
    );
    if (!materiasAsignadas.length) {
        return res.status(404).json({ error: 'No hay materias asignadas a este curso' });
    }
    res.status(200).json({
        materias: materiasAsignadas.map(materia => ({
            id: materia._id,
            nombre: materia.nombre
        }))
    });
}

// Ver los solo por tipos de evaluaciones
const visualizarTiposEstudiantes = async (req, res) => {
    const { tipo } = req.params;
    const { materiaBDD } = req;
    const { anio } = req.userBDD;
    const notasEstudiante = await Notas.find({ materia: materiaBDD._id, anioLectivo: anio });
    if (!notasEstudiante.length) {
        return res.status(404).json({ error: 'No hay notas registradas para este estudiante' });
    }
    // Usar un Set para evitar descripciones repetidas
    const descripcionesSet = new Set();
    notasEstudiante.forEach(nota => {
        (nota.evaluaciones[tipo] || []).forEach(evaluacion => {
            descripcionesSet.add(evaluacion.descripcion);
        });
    });
    // Convertir el Set a array
    const descripciones = Array.from(descripcionesSet);
    res.status(200).json({ descripciones });
}

// Ver los estudiantes por tipo de evaluaciones y descripción
const visualizarEstudiantesDescripcion = async (req, res) => {
    const { tipo } = req.params;
    const { materiaBDD } = req;
    const { descripcion } = req.body;
    const { anio } = req.userBDD;
    // Poblamos el estudiante para obtener sus datos
    const notasEstudiante = await Notas.find({ materia: materiaBDD._id, anioLectivo: anio })
        .populate('estudiante', 'nombre apellido cedula');
    if (!notasEstudiante.length) {
        return res.status(404).json({ error: 'No hay notas registradas para este estudiante' });
    }
    const estudiantes = [];
    for (const nota of notasEstudiante) {
        const evaluacion = nota.evaluaciones[tipo]?.find(e => e.descripcion === descripcion);
        if (evaluacion && nota.estudiante) {
            estudiantes.push({
                id: nota.estudiante._id,
                nombre: nota.estudiante.nombre,
                apellido: nota.estudiante.apellido,
                cedula: nota.estudiante.cedula,
                nota: evaluacion.nota
            });
        }
    }
    res.status(200).json({ estudiantes });
}

export {
    subirNotasEstudiantes,
    modificarNotasEstudiantes,
    visualizarCursosAsociados,
    observacionesEstudiantes,
    visualizarEstudiantesCurso,
    visualizarMateriasAsignadas,
    visualizarTiposEstudiantes,
    visualizarEstudiantesDescripcion,
    subirFotoEvidencia
}