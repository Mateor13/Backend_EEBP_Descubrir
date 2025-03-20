import { check, validationResult } from 'express-validator';
import Administrador from '../models/administradores.js';
import Profesor from '../models/profesor.js';
import representantes from '../models/representante.js';
import cursos from '../models/cursos.js';
import estudiantes from '../models/estudiantes.js';

const registroAdminValidator = [
    check('anio').custom((_, { req }) => {
        if (!req.userBDD.anio) {
            throw new Error('Este año lectivo ya ha finalizado');
        }
        return true;
    }),
    check(['nombre', 'apellido', 'email', 'password'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email) => {
            const adminBDD = await Administrador.findOne({ email });
            const representanteBDD = await representantes.findOne({ email });
            const profesorBDD = await Profesor.findOne({ email });
            if (adminBDD || representanteBDD || profesorBDD) {
                throw new Error('El email ya está registrado');
            }
        }),
    check('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    check(['nombre', 'apellido'])
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
];

const registroProfesorValidator = [
    check('anio').custom((_, { req }) => {
        if (!req.userBDD.anio) {
            throw new Error('Este año lectivo ya ha finalizado');
        }
    }),
    check(['nombre', 'apellido', 'email', 'direccion', 'telefono', 'cedula', 'password'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email) => {
            const adminBDD = await Administrador.findOne({ email });
            const representanteBDD = await representantes.findOne({ email });
            const profesorBDD = await Profesor.findOne({ email });
            if (adminBDD || representanteBDD || profesorBDD) {
                throw new Error('El email ya está registrado');
            }
        }),
    check('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    check(['nombre', 'apellido'])
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('telefono')
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos y solo números')
        .custom(async (telefono) => {
            const profesorBDD = await Profesor.findOne({ telefono });
            const representanteBDD = await representantes.findOne({ telefono });
            if (profesorBDD || representanteBDD) {
                throw new Error('El teléfono ya está registrado');
            }
        }),
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            const profesorBDD = await Profesor.findOne({ cedula });
            const representanteBDD = await representantes.findOne({ cedula });
            if (profesorBDD || representanteBDD) {
                throw new Error('La cédula ya está registrada');
            }
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
];

const registroRepresentanteValidator = [
    check('anio').custom((_, { req }) => {
        if (!req.userBDD.anio) {
            throw new Error('Este año lectivo ya ha finalizado');
        }
    }),
    check(['nombre', 'apellido', 'email', 'telefono', 'cedula'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email) => {
            const adminBDD = await Administrador.findOne({ email });
            const representanteBDD = await representantes.findOne({ email });
            const profesorBDD = await Profesor.findOne({ email });
            if (adminBDD || representanteBDD || profesorBDD) {
                throw new Error('El email ya está registrado');
            }
        }),
    check(['nombre', 'apellido'])
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('telefono')
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos y solo números')
        .custom(async (telefono) => {
            const profesorBDD = await Profesor.findOne({ telefono });
            const representanteBDD = await representantes.findOne({ telefono });
            if (profesorBDD || representanteBDD) {
                throw new Error('El teléfono ya está registrado');
            }
        }),
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            const profesorBDD = await Profesor.findOne({ cedula });
            const representanteBDD = await representantes.findOne({ cedula });
            if (profesorBDD || representanteBDD) {
                throw new Error('La cédula ya está registrada');
            }
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const registroCursoValidator = [
    check('anio').custom((_, { req }) => {
        if (!req.userBDD.anio) {
            throw new Error('Este año lectivo ya ha finalizado');
        }
    }),
    check('nombre')
        .notEmpty()
        .withMessage('El nombre del curso es obligatorio')
        .custom(async (nombre) => {
            const regExp = new RegExp(/^[1-7][A-E]$/);
            if (!regExp.test(nombre)) {
                throw new Error('El curso no es válido, debe ser un número del 1 al 7 y una letra de la A a la E');
            }
            const cursoBDD = await cursos.findOne({ nombre });
            if (cursoBDD) {
                throw new Error('El curso ya está registrado');
            }
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const registroMateriaValidator = [
    check('anio').custom((_, { req }) => {
        if (!req.userBDD.anio) {
            throw new Error('Este año lectivo ya ha finalizado');
        }
    }),
    check(['nombre', 'curso', 'cedulaProfesor'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('nombre')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre de la materia solo puede contener letras'),
    check('curso')
        .custom(async (curso) => {
            const regExp = new RegExp(/^[0-7][A-E]$/)
            if (!regExp.test(curso)) {
                throw new Error('El curso no es válido, debe ser un número del 1 al 7 y una letra de la A a la E');
            }
            const cursoBDD = await cursos.findOne({ nombre: curso });
            if (!cursoBDD) {
                throw new Error('El curso no está registrado');
            }
        }),
    check('cedulaProfesor')
        .custom(async (cedulaProfesor) => {
            const profesorBDD = await Profesor.findOne({ cedula: cedulaProfesor });
            if (!profesorBDD) {
                throw new Error('El profesor no está registrado');
            }
        }),
    check(['nombre', 'curso'])
        .custom(async ({ nombre, curso }) => {
            const cursoBDD = await cursos.findOne({ nombre: curso });
            const materiasRegistradas = await cursoBDD.buscarMateriasRegistradas(nombre);
            if (materiasRegistradas.length > 0) {
                throw new Error('La materia ya esta registrada en este curso')
            }
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const registroEstudianteValidator = [
    check('anio').custom((_, { req }) => {
        if (!req.userBDD.anio) {
            throw new Error('Este año lectivo ya ha finalizado');
        }
    }),
    check(['nombre', 'apellido', 'cedula', 'curso', 'cedulaRepresentante'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check(['nombre', 'apellido'])
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            const estudianteBDD = await estudiantes.findOne({ cedula });
            const representanteBDD = await representantes.findOne({ cedula })
            const profesorBDD = await Profesor.findOne({ cedula });
            if (estudianteBDD || representanteBDD || profesorBDD) {
                throw new Error('La cédula ya está registrada');
            }
        }),
    check('curso')
        .custom(async (curso) => {
            const regExp = new RegExp(/^[0-7][A-E]$/)
            if (!regExp.test(curso)) {
                throw new Error('El curso no es válido, debe ser un número del 1 al 7 y una letra de la A a la E');
            }
            const cursoBDD = await cursos.findOne({ nombre: curso });
            if (!cursoBDD) {
                throw new Error('El curso no está registrado');
            }
        }),
    check('cedulaRepresentante')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedulaRepresentante) => {
            const representanteBDD = await representantes.findOne({ cedula: cedulaRepresentante });
            if (!representanteBDD) {
                throw new Error('El representante no está registrado');
            }
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const asignarRepresentanteValidator = [
    check('anio').custom((_, { req }) => {
        if (!req.userBDD.anio) {
            throw new Error('Este año lectivo ya ha finalizado');
        }
    }),
    check(['cedulaEstudiante', 'cedulaRepresentante'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('cedulaEstudiante')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedulaEstudiante) => {
            const estudianteBDD = await estudiantes.findOne({ cedula: cedulaEstudiante });
            if (!estudianteBDD) {
                throw new Error('El estudiante no está registrado');
            }
        }),
    check('cedulaRepresentante')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedulaRepresentante) => {
            const representanteBDD = await representantes.findOne({ cedula: cedulaRepresentante });
            if (!representanteBDD) {
                throw new Error('El representante no está registrado');
            }
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const registroAsistenciaEstudiantesValidator = [
    check('anio').custom((_ , { req }) => {
        if (!req.userBDD.anio) {
            throw new Error('Este año lectivo ya ha finalizado');
        }
    }),
    check('curso')
        .notEmpty()
        .withMessage('Especificar el curso es obligatorio')
        .custom(async (curso) => {
            const regExp = new RegExp(/^[0-7][A-E]$/)
            if (!regExp.test(curso)) {
                throw new Error('El curso no es válido, debe ser un número del 1 al 7 y una letra de la A a la E');
            }
            const cursoBDD = await cursos.findOne({ nombre: curso });
            if (!cursoBDD) {
                throw new Error('El curso no está registrado');
            }
        }),
    check('asistencias')
        .custom((asistencias) => {
            if (!asistencias || typeof asistencias !== 'object') {
                throw new Error('Especificar las asistencias');
            }
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const justificarInasistenciaValidator = [
    check('anio').custom((_ , { req }) => {
        if (!req.userBDD.anio) {
            throw new Error('Este año lectivo ya ha finalizado');
        }
    }),
    check(['cedula', 'fecha', 'justificacion'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            const estudianteBDD = await estudiantes.findOne({ cedula });
            if (!estudianteBDD) {
                throw new Error('El estudiante no está registrado');
            }
        }),
    check('fecha')
        .custom((fecha) => {
            const regExp = new RegExp(/^\d{4}\/\d{1,2}\/\d{1,2}$/);
            if (!regExp.test(fecha)) {
                throw new Error('La fecha no es válida');
            }
            const [year, month, day] = fecha.split('/').map(Number);
            const date = new Date(`${year}-${month}-${day}`);
            if (month < 1 || month > 12) {
                throw new Error('El mes no es válido');
            }
            if (day < 1 || day > 31) {
                throw new Error('El día no es válido');
            }
            if (month === 4 || month === 6 || month === 9 || month === 11) {
                if (day > 30) {
                    throw new Error('Este mes no tiene más de 30 días');
                }
            }
            if (month === 2 && day > 29) {
                throw new Error('Febrero no tiene más de 29 días');
            }
            const actualDate = new Date();
            if (date > actualDate) {
                throw new Error('La fecha no puede ser mayor a la actual');
            }
        }),
    check('justificacion')
        .matches(/^[a-zA-Z0-9\s]{10,}$/)
        .withMessage('La justificación debe tener al menos 10 caracteres y solo letras y números'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

export { 
    registroAdminValidator, 
    registroProfesorValidator, 
    registroRepresentanteValidator, 
    registroCursoValidator, 
    registroMateriaValidator, 
    registroEstudianteValidator,
    asignarRepresentanteValidator,
    registroAsistenciaEstudiantesValidator,
    justificarInasistenciaValidator
};
