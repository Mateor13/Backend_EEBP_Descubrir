import Profesor from "../models/profesor.js"
import {  sendMailToRecoveryPasswordProfesor } from '../config/nodemailer.js';
import { generarJWT } from '../helpers/JWT.js';
import materias from "../models/materias.js";
import observaciones from "../models/observaciones.js";
import cursos from "../models/cursos.js";
import estudiante from "../models/estudiantes.js";
import notas from "../models/notas.js";
import mongoose from "mongoose";

//Funciones de validación
const validarCurso = (curso) => {
    const regExp = new RegExp(/^[0-7][A-E]$/)
    return regExp.test(curso)
}
const validarFecha = (fecha) => {
    const regExp = new RegExp(/^\d{4} - \d{2} - \d{2}$/);
    return regExp.test(fecha);
};


const subirNotasEstudiantes = async (req, res) => {
    // Paso 1: Obtener los datos
    const { cedula, nota, materia, motivo } = req.body;
    const { id } = req.userBDD;

    // Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (nota < 0 || nota > 10.0) return res.status(400).json({ error: 'La nota debe estar entre 0.1 y 10' });

    // Buscar al estudiante por cédula
    const estudianteBDD = await estudiante.findOne({ cedula });
    if (!estudianteBDD) return res.status(400).json({ error: 'El estudiante no está registrado' });

    // Verificar que el estudiante esté registrado en la materia especificada
    const materiaBDD = await materias.findOne({ _id: materia, profesor: id });
    if (!materiaBDD) return res.status(400).json({ error: 'Esta materia no existe o no esta registrada en ella' });
    
    // Verificar que el estudiante esté registrado en el curso
    const Curso = await cursos.findOne({ materias: materia, estudiantes: estudianteBDD._id });
    if (!Curso) return res.status(400).json({ error: 'El estudiante no está registrado en este curso' });
    
    // Paso 3: Manipular la BDD
    //Verificar que el estudiante tenga notas
    const notasEstudiante = await notas.findOne({ estudiante: estudianteBDD._id, materia: materiaBDD._id });
    if (!notasEstudiante) {
        const nuevaNota = new notas({ estudiante: estudianteBDD._id, materia: materiaBDD._id });
        const subirNota = await nuevaNota.agregarNota(nota, motivo);
        if (subirNota?.error) return res.status(400).json({ error: subirNota.error });
        await nuevaNota.save();
    }else{
        const subirNota = await notasEstudiante.agregarNota(nota, motivo);
        if (subirNota?.error) return res.status(400).json({ error: subirNota.error });
        await notasEstudiante.save();
    }
    res.status(200).json({ msg: 'Nota registrada correctamente' });
};

const modificarNotasEstudiantes = async (req, res) => {
    // Paso 1: Obtener los datos
    const { cedula, nota, materia, motivo } = req.body;
    const { id } = req.userBDD;

    // Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (!cedula) return res.status(400).json({ error: 'Especificar cédula estudiante' });
    if (!materia) return res.status(400).json({ error: 'Especificar el id de la materia' });
    if (!nota) return res.status(400).json({ error: 'Especificar nota o que diferente de 0' });
    if (!motivo) return res.status(400).json({ error: 'Especificar motivo' });
    if (nota < 0 || nota > 10.0) return res.status(400).json({ error: 'La nota debe estar entre 0.1 y 10' });

    // Buscar al estudiante por cédula
    const estudianteBDD = await estudiante.findOne({ cedula });
    if (!estudianteBDD) return res.status(400).json({ error: 'El estudiante no está registrado' });

    // Verificar que el estudiante esté registrado en la materia especificada
    const materiaBDD = await materias.findOne({ _id: materia, profesor: id });
    if (!materiaBDD) return res.status(400).json({ error: 'Esta materia no existe o no esta registrada en ella' });
    
    // Verificar que el estudiante esté registrado en el curso
    const Curso = await cursos.findOne({ materias: materia, estudiantes: estudianteBDD._id });
    if (!Curso) return res.status(400).json({ error: 'El estudiante no está registrado en este curso' });
    
    //Verificar que el estudiante tenga notas
    const notasEstudiante = await notas.findOne({ estudiante: estudianteBDD._id, materia: materiaBDD._id });
    if (!notasEstudiante) return res.status(400).json({ error: 'El estudiante no tiene notas registradas' });

    //Paso 3: Manipular la BDD
    const actualizarNota = await notasEstudiante.actualizarNota(nota, motivo);
    if (actualizarNota?.error) return res.status(400).json({error: actualizarNota.error});
    estudianteBDD.save();
    res.status(200).json({msg: 'Nota actualizada correctamente'});
}

const observacionesEstudiantes  = async (req, res) => {
    const { cedula, observacion } = req.body;
    const { id } = req.userBDD;

    // Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (!cedula) return res.status(400).json({ error: 'Especificar cédula estudiante' });
    if (!observacion) return res.status(400).json({ error: 'Especificar observacion' });
    const estudianteBDD = await observaciones.findOne({ cedula });
    if (!estudianteBDD) return res.status(400).json({ error: 'El estudiante no está registrado' });

    // Paso 3: Manipular la BDD
    const profesorBDD = await Profesor.findById(id);
    if (!profesorBDD) return res.status(400).json({ error: 'Profesor no encontrado' });

    const date = new Date();
    const fecha = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    const nuevaObservacion = { fecha, observacion, profesor: profesorBDD._id };

    await estudianteBDD.registrarObservacion(nuevaObservacion);
    res.status(200).json({ msg: 'Observación registrada correctamente' });
}

const visualizarEstudiantesCurso = async (req, res) => {
    //Paso 1: Obtener los datos
    const {curso, materia} = req.body;
    const {id} = req.userBDD;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!validarCurso(curso)) return res.status(400).json({error: 'El curso no es válido'});
    const cursoBDD = await cursos.findOne({nombre: curso});
    if (!cursoBDD) return res.status(400).json({error: 'El curso no está registrado'});
    const estudiantes = await cursoBDD.buscarEstudiantesPorMateriaYProfesor(id, materia);
    if (estudiantes.error) return res.status(400).json({error: estudiantes.error});
    //Paso 3: Manipular la BDD
    res.status(200).json({estudiantes});
}

const visualizarCursosAsociados = async (req, res) => {
    //Paso 1: Obtener los datos
    const {id} = req.userBDD;
    //Paso 2: Manipular la BDD
    const cursosAsociados = await cursos.aggregate([
        {$lookup:{
            from: 'materias',
            localField: 'materias',
            foreignField: '_id',
            as: 'materiasDetalle'
        }},
        {$match: {'materiasDetalle.profesor': new mongoose.Types.ObjectId(id)}},
        {$project: {nombre: 1
        }}
    ])
    if (!cursosAsociados || cursosAsociados.length === 0) return res.status(404).json({error: 'No hay cursos asociados'});
    res.status(200).json({cursosAsociados});
}

const visualizarMateriasAsignadas = async (req, res) => {
    //Paso 1: Obtener los datos
    const {id} = req.userBDD;
    const {cursoId} = req.params;
    //Paso 2: Manipular la BDD
    const materiasAsignadas = await cursos.aggregate([
        {$match: {_id: new mongoose.Types.ObjectId(cursoId)}},
        {$lookup:{
            from: 'materias',
            localField: 'materias',
            foreignField: '_id',
            as: 'materiasDetalle'
        }},
        {$project: {
            _id: 0,
            'materiasDetalle.nombre': 1,
            'materiasDetalle._id': 1
        }}
    ]);
    res.status(200).json({materiasAsignadas})
}

const visualizarEstudiantesPorMateria = async (req, res) => {
    // Paso 1: Obtener los datos
    const { materiaId } = req.params;

    // Paso 2: Realizar validaciones
    if (!materiaId) return res.status(400).json({ error: 'Especificar ID de la materia' });

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
        res.status(500).json({ error: 'Error al obtener los estudiantes de la materia' });
    }
};

export  {
    subirNotasEstudiantes,
    modificarNotasEstudiantes,
    visualizarCursosAsociados,
    observacionesEstudiantes,
    visualizarEstudiantesCurso,
    visualizarMateriasAsignadas,
    visualizarEstudiantesPorMateria
}