import { check, validationResult } from 'express-validator';
import profesor from '../models/profesor.js';
import cursos from '../models/cursos.js';
import materias from '../models/materias.js';
import estudiantes from '../models/estudiantes.js';

const subirNotasEstudiantesValidator = [
    check('anio')
        .custom((_, { req }) => {
            if (!req.userBDD.anio) {
                throw new Error('Este año lectivo ya ha finalizado');
            }
            return true;
        }),
    check(['cedula', 'nota', 'materia', 'motivo'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('cedula')
        .matches(/^[0-9]{10}$/)
        .withMessage('La cédula debe contener 10 dígitos')
        .custom(async (cedula) => {
            const estudiante = await estudiantes.findOne({ cedula });
            if (!estudiante) {
                throw new Error('El estudiante no existe');
            }
            return true;
        }),
    check('nota')
        .isNumeric()
        .withMessage('La nota debe ser un número')
        .isInt({ min: 0, max: 10 }),
    check('materia')
        .custom(async (materia) => {
            const materiaBDD = await materias.findOne({ _id: materia });
            if (!materiaBDD) {
                throw new Error('La materia no existe');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const modificarNotasEstudiantesValidator = [
    check('anio')
        .custom((_, { req }) => {
            if (!req.userBDD.anio) {
                throw new Error('Este año lectivo ya ha finalizado');
            }
            return true;
        }),
    check(['cedula', 'nota', 'materia', 'motivo'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('cedula')
        .matches(/^[0-9]{10}$/)
        .withMessage('La cédula debe contener 10 dígitos')
        .custom(async (cedula) => {
            const estudiante = await estudiantes.findOne({ cedula });
            if (!estudiante) {
                throw new Error('El estudiante no existe');
            }
            return true;
        }),
    check('nota')
        .isNumeric()
        .withMessage('La nota debe ser un número')
        .isInt({ min: 0, max: 10 }),
    check('materia')
        .custom(async (materia) => {
            const materiaBDD = await materias.findOne({ _id: materia });
            if (!materiaBDD) {
                throw new Error('La materia no existe');
            }
            return true;
        }),
    check('notasEstudiante')
        .custom(async () => {
            const { cedula, materia } = req.body;
            const estudianteBDD = await estudiantes.findOne({ cedula });
            const materiaBDD = await materias.findByIb({ materia });
            const notasEstudiante = await notas.findOne({ estudiante: estudianteBDD._id, materia: materiaBDD._id });
            if (!notasEstudiante) {
                throw new Error('El estudiante no tiene notas registradas');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const observacionesEstudiantesValidator = [
    check('anio')
        .custom((_, { req }) => {
            if (!req.userBDD.anio) {
                throw new Error('Este año lectivo ya ha finalizado');
            }
            return true;
        }),
    check(['cedula', 'observacion'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('cedula')
        .matches(/^[0-9]{10}$/)
        .withMessage('La cédula debe contener 10 dígitos')
        .custom(async (cedula) => {
            const estudiante = await estudiantes.findOne({ cedula });
            if (!estudiante) {
                throw new Error('El estudiante no existe');
            }
            return true;
        }),
    check('observacion')
        .isString()
        .withMessage('La observación debe ser un texto'),
    check('profesor')
        .custom(async () => {
            const { id } = req.userBDD;
            const profesorBDD = await profesor.findById(id);
            if (!profesorBDD) {
                throw new Error('El profesor no existe');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const visualizarEstudiantesCursoValidator = [
    check(['curso', 'materia'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('curso')
        .matches(/^[0-7][A-E]$/)
        .withMessage('El curso debe tener un formato válido')
        .custom(async (curso) => {
            const cursoBDD = await cursos.findOne({ _id: curso });
            if (!cursoBDD) {
                throw new Error('El curso no existe');
            }
            return true;
        }),
    check('materia')
        .custom(async (materia) => {
            const materiaBDD = await materias.findOne({ _id: materia });
            if (!materiaBDD) {
                throw new Error('La materia no existe');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const visualizarMateriasAsignadasValidator = [
    check('cursoId')
        .notEmpty()
        .withMessage('El curso es obligatorio')
        .custom(async (cursoId) => {
            const cursoBDD = await cursos.findOne({ _id: cursoId });
            if (!cursoBDD) {
                throw new Error('El curso no existe');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const visualizarEstudiantesPorMateriaValidator = [
    check('materiaId')
        .notEmpty()
        .withMessage('La materia es obligatoria'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

export {
    subirNotasEstudiantesValidator,
    modificarNotasEstudiantesValidator,
    observacionesEstudiantesValidator,
    visualizarEstudiantesCursoValidator,
    visualizarMateriasAsignadasValidator,
    visualizarEstudiantesPorMateriaValidator
};