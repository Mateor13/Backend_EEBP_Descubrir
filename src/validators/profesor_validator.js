import { check, validationResult } from 'express-validator';
import Profesor from '../models/profesor.js';
import Cursos from '../models/cursos.js';
import Materias from '../models/materias.js';
import Estudiantes from '../models/estudiantes.js';
import Observaciones from '../models/observaciones.js';
import CursosAsignados from '../models/cursoAsignado.js';
import anioLectivo from '../models/anioLectivo.js';

// Validador para subir notas de estudiantes por parte del profesor
const subirNotasEstudiantesValidator = [
    check('materiaId')
        .notEmpty()
        .withMessage('La materia es obligatoria')
        .isMongoId()
        .withMessage('El id de la materia debe tener un formato válido'),
    check('tipo')
        .notEmpty()
        .withMessage('El tipo de evaluación es obligatorio')
        .isIn(['deberes', 'talleres', 'examenes', 'pruebas']),
    check('notas')
        .custom(async (notas, { req }) => {
            const { anio } = req.userBDD;
            await anioLectivo.findById(anio).then((anioBDD) => {
                if (!anioBDD) throw new Error('El año lectivo no existe');
                if (anioBDD.estado === false) throw new Error('El año lectivo no está activo');
            });
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
        .withMessage('La materia es obligatoria')
        .isMongoId()
        .withMessage('El id de la materia debe tener un formato válido'),
    check('tipo')
        .notEmpty()
        .withMessage('El tipo de evaluación es obligatorio')
        .isIn(['deberes', 'talleres', 'examenes', 'pruebas']),
    check('descripcion')
        .notEmpty()
        .withMessage('La descripción es obligatoria'),
    check('notas')
        .custom(async (notas, { req }) => {
            const { anio } = req.userBDD;
            await anioLectivo.findById(anio).then((anioBDD) => {
                if (!anioBDD) throw new Error('El año lectivo no existe');
                if (anioBDD.estado === false) throw new Error('El año lectivo no está activo');
            });
            const { materiaId } = req.params;
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

// Validador para subir evidencias de estudiantes
const subirEvidenciasEstudiantesValidator = [
    check('cursoId')
        .notEmpty()
        .withMessage('El curso es obligatorio')
        .bail()
        .isMongoId()
        .withMessage('El id del curso debe tener un formato válido')
        .custom(async (cursoId, { req }) => {
            const { anio } = req.userBDD;
            await anioLectivo.findById(anio).then((anioBDD) => {
                if (!anioBDD) throw new Error('El año lectivo no existe');
                if (anioBDD.estado === false) throw new Error('El año lectivo no está activo');
            });
            const cursoBDD = await CursosAsignados.findOne({ curso: cursoId, anioLectivo: anio });
            if (!cursoBDD) throw new Error('El curso no existe');
            req.cursoBDD = cursoBDD;
            return true;
        }),
    check('materiaId')
        .notEmpty()
        .withMessage('La materia es obligatoria')
        .isMongoId()
        .withMessage('El id de la materia debe tener un formato válido')
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
    check('imagen')
    .custom((_, { req }) => {
        if (!req.file) {
            throw new Error('La imagen es obligatoria');
        }
        // Validar el tipo de archivo
        const mimeTypesValidos = ['image/jpeg', 'image/png', 'image/gif'];
        if (!mimeTypesValidos.includes(req.file.mimetype)) {
            throw new Error('El formato de la imagen no es válido. Solo se permiten JPEG, PNG o GIF');
        }
        // Validar el tamaño del archivo
        const maxSize = 20 * 1024 * 1024; // 20 MB
        if (req.file.size > maxSize) {
            throw new Error('El tamaño de la imagen excede el límite de 20 MB');
        }
        return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para registrar observaciones sobre estudiantes
const observacionesEstudiantesValidator = [
    check('anio')
        .custom(async (_, { req }) => {
            const { anio } = req.userBDD;
            await anioLectivo.findById(anio).then((anioBDD) => {
                if (!anioBDD) throw new Error('El año lectivo no existe');
                if (anioBDD.estado === false) throw new Error('El año lectivo no está activo');
            });
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
    check('cursoId')
        .notEmpty()
        .withMessage('El curso es obligatorio')
        .isMongoId()
        .withMessage('El id del curso debe tener un formato válido')
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
        .isMongoId()
        .withMessage('El id del curso debe tener un formato válido')
        .custom(async (cursoId, { req }) => {
            const cursoBDD = await Cursos.findById(cursoId)
            if (!cursoBDD) throw new Error('El curso no existe');
            const cursoAsignado = await CursosAsignados.findOne({ curso: cursoId, anioLectivo: req.userBDD.anio }).populate('materias', '_id nombre profesor').populate('materias.profesor', '_id nombre apellido');
            req.cursoAsignadoBDD = cursoAsignado;
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
        .isMongoId()
        .withMessage('El id de la materia debe tener un formato válido')
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
        .isMongoId()
        .withMessage('El id de la materia debe tener un formato válido')
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
        .isMongoId()
        .withMessage('El id de la materia debe tener un formato válido')
        .custom(async (materiaId, { req }) => {
            const materiaBDD = await Materias.findById(materiaId);
            if (!materiaBDD) throw new Error('La materia no existe');
            req.materiaBDD = materiaBDD;
            return true;
        }),
    check('cursoId')
        .notEmpty()
        .withMessage('El curso es obligatorio')
        .isMongoId()
        .withMessage('El id del curso debe tener un formato válido')
        .custom(async (cursoId, { req }) => {
            const cursoBDD = await CursosAsignados.findOne({ curso: cursoId, anioLectivo: req.userBDD.anio }).populate('estudiantes', '_id nombre apellido cedula');
            if (!cursoBDD) throw new Error('El curso no existe');
            req.cursoBDD = cursoBDD;
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
    subirEvidenciasEstudiantesValidator
};