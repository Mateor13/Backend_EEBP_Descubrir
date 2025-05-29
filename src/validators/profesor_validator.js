import { check, validationResult } from 'express-validator';
import Profesor from '../models/profesor.js';
import Cursos from '../models/cursos.js';
import Materias from '../models/materias.js';
import Estudiantes from '../models/estudiantes.js';
import Observaciones from '../models/observaciones.js';
import Notas from '../models/notas.js';
import axios from 'axios';
import CursosAsignados from '../models/cursoAsignado.js';

// Validador para subir notas de estudiantes por parte del profesor
const subirNotasEstudiantesValidator = [
    check('materiaId')
        .notEmpty()
        .withMessage('La materia es obligatoria'),
    check('tipo')
        .notEmpty()
        .withMessage('El tipo de evaluación es obligatorio')
        .isIn(['deberes', 'talleres', 'examenes', 'pruebas']),
    check('notas')
        .custom(async (notas, { req }) => {
            const { materiaId } = req.params;
            if (!materiaId) throw new Error('La materia es obligatoria');
            // Validar que la materia exista y esté asignada al profesor
            const materiaBDD = await Materias.findById(materiaId);
            if (!materiaBDD) throw new Error('La materia no existe o no está asignada a usted');
            req.materiaBDD = materiaBDD;
            // Validar cada estudiante y sus datos
            for (const [estudianteId, nota] of Object.entries(notas)) {
                // Validar existencia del estudiante
                const estudiante = await Estudiantes.findById(estudianteId);
                if (!estudiante) throw new Error(`El estudiante con ID ${estudianteId} no existe`);
                // Validar campos de la nota
                if (typeof nota !== 'number' || nota < 0 || nota > 10) {
                    throw new Error(`La nota de ${estudiante.nombre} debe ser un número entre 0 y 10`);
                }
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para modificar notas de estudiantes por parte del profesor
const modificarNotasEstudiantesValidator = [
    check('materiaId')
        .notEmpty()
        .withMessage('La materia es obligatoria'),
    check('tipo')
        .notEmpty()
        .withMessage('El tipo de evaluación es obligatorio')
        .isIn(['deberes', 'talleres', 'examenes', 'pruebas']),
    check('descripcion')
        .notEmpty()
        .withMessage('La descripción es obligatoria'),
    check('notas')
        .custom(async (notas, { req }) => {
            const { materiaId } = req.params;
            if (!materiaId) throw new Error('La materia es obligatoria');
            // Validar que la materia exista y esté asignada al profesor
            const materiaBDD = await Materias.findById(materiaId);
            if (!materiaBDD) throw new Error('La materia no existe o no está asignada a usted');
            req.materiaBDD = materiaBDD;
            // Validar cada estudiante y sus datos
            for (const [estudianteId, nota] of Object.entries(notas)) {
                // Validar existencia del estudiante
                const estudiante = await Estudiantes.findById(estudianteId);
                if (!estudiante) throw new Error(`El estudiante con ID ${estudianteId} no existe`);
                // Validar campos de la nota
                if (typeof nota !== 'number' || nota < 0 || nota > 10) {
                    throw new Error(`La nota de ${estudiante.nombre} debe ser un número entre 0 y 10`);
                }
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

const subirEvidenciaImgur = async (req, res, next) => {
  try {
    const imagen = req.file;
    if (!imagen) {
      return res.status(400).json({ error: 'No se envió ninguna imagen' });
    }
    const response = await axios.post(
      'https://api.imgur.com/3/image',
      {
        image: imagen.buffer.toString('base64'),
        type: 'base64'
      },
      {
        headers: {
          Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`
        }
      }
    );
    req.urlImgur = response.data.data.link;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error subiendo la imagen' });
  }
};

// Validador para subir evidencias de estudiantes
const subirEvidenciasEstudiantesValidator = [
    check('cursoId')
        .notEmpty()
        .withMessage('El curso es obligatorio')
        .custom(async (cursoId, { req }) => {
            const cursoBDD = await CursosAsignados.findOne({curso: cursoId, anioLectivo: req.userBDD.anio});
            if (!cursoBDD) throw new Error('El curso no existe');
            req.cursoBDD = cursoBDD;
            return true;
        }),
    check('materiaId')
        .notEmpty()
        .withMessage('La materia es obligatoria')
        .custom(async (materiaId, { req }) => {
            const materiaBDD = await Materias.findById(materiaId);
            if (!materiaBDD) throw new Error('La materia no existe o no está asignada a usted');
            req.materiaBDD = materiaBDD;
            return true;
        }),
    check('tipo')
        .notEmpty()
        .withMessage('El tipo de evaluación es obligatorio')
        .isIn(['deberes', 'talleres', 'examenes', 'pruebas']),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para registrar observaciones sobre estudiantes
const observacionesEstudiantesValidator = [
    check('anio')
        .custom((_, { req }) => {
            if (!req.userBDD.anio) throw new Error('Este año lectivo ya ha finalizado');
            return true;
        }),
    check(['cedula', 'observacion'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('cedula')
        .matches(/^[0-9]{10}$/)
        .withMessage('La cédula debe contener 10 dígitos')
        .custom(async (cedula, { req }) => {
            const estudiante = await Estudiantes.findOne({ cedula });
            if (!estudiante) throw new Error('El estudiante no existe');
            const observacion = await Observaciones.findOne({ estudiante: estudiante._id, anioLectivo: req.userBDD.anio });
            if (!observacion) throw new Error('El estudiante no tiene observaciones registradas');
            req.observacionBDD = observacion;
            return true;
        }),
    check('observacion')
        .isString()
        .withMessage('La observación debe ser un texto'),
    check('profesor')
        .custom(async (_, { req }) => {
            const { id } = req.userBDD;
            const profesorBDD = await Profesor.findById(id);
            if (!profesorBDD) throw new Error('El profesor no existe');
            req.profesorBDD = profesorBDD;
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para visualizar estudiantes de un curso y materia
const visualizarEstudiantesCursoValidator = [
    check(['cursoId'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('cursoId')
        .isMongoId()
        .withMessage('El curso debe tener un formato válido')
        .custom(async (cursoId, { req }) => {
            const cursoBDD = await Cursos.findById(cursoId);
            if (!cursoBDD) throw new Error('El curso no existe');
            req.cursoBDD = cursoBDD;
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para visualizar materias asignadas a un curso
const visualizarMateriasAsignadasValidator = [
    check('cursoId')
        .notEmpty()
        .withMessage('El curso es obligatorio')
        .custom(async (cursoId, { req }) => {
            const cursoBDD = await Cursos.findById(cursoId).populate('materias', '_id nombre profesor').populate('materias.profesor', '_id nombre apellido');
            if (!cursoBDD) throw new Error('El curso no existe');
            req.cursoBDD = cursoBDD;
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para visualizar estudiantes por materia
const visualizarEstudiantesPorMateriaValidator = [
    check('materiaId')
        .notEmpty()
        .withMessage('La materia es obligatoria')
        .custom(async (materiaId, { req }) => {
            const materiaBDD = await Materias.findById(materiaId).populate('profesor', '_id nombre apellido');
            if (!materiaBDD) throw new Error('La materia no existe');
            req.materiaBDD = materiaBDD;
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

const visualizarTiposNotasEstudiantesValidator = [
    check('tipo')
        .notEmpty()
        .withMessage('El tipo de evaluación es obligatorio')
        .isIn(['deberes', 'talleres', 'examenes', 'pruebas']),
    check('materiaId')
        .notEmpty()
        .withMessage('La materia es obligatoria')
        .custom(async (materiaId, { req }) => {
            const materiaBDD = await Materias.findById(materiaId);
            if (!materiaBDD) throw new Error('La materia no existe');
            req.materiaBDD = materiaBDD;
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

const visualizarEstudiantesPorTipoValidator = [
    check('tipo')
        .notEmpty()
        .withMessage('El tipo de evaluación es obligatorio')
        .isIn(['deberes', 'talleres', 'examenes', 'pruebas']),
    check('materiaId')
        .notEmpty()
        .withMessage('La materia es obligatoria')
        .custom(async (materiaId, { req }) => {
            const materiaBDD = await Materias.findById(materiaId);
            if (!materiaBDD) throw new Error('La materia no existe');
            req.materiaBDD = materiaBDD;
            return true;
        }),
    check('descripcion')
        .notEmpty()
        .withMessage('La descripción es obligatoria'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

export {
    subirNotasEstudiantesValidator,
    modificarNotasEstudiantesValidator,
    observacionesEstudiantesValidator,
    visualizarEstudiantesCursoValidator,
    visualizarMateriasAsignadasValidator,
    visualizarEstudiantesPorMateriaValidator,
    visualizarTiposNotasEstudiantesValidator,
    visualizarEstudiantesPorTipoValidator,
    subirEvidenciaImgur,
    subirEvidenciasEstudiantesValidator
};