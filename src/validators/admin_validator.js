import { check, validationResult } from 'express-validator';
import Administrador from '../models/administradores.js';
import Profesor from '../models/profesor.js';
import Representante from '../models/representante.js';
import Curso from '../models/cursos.js';
import Estudiante from '../models/estudiantes.js';
import AnioLectivo from '../models/anioLectivo.js';
import Materia from '../models/materias.js';
import CursoAsignado from '../models/cursoAsignado.js';

// Listas de roles para validaciones cruzadas
const todosRoles = [
    { model: Administrador },
    { model: Profesor },
    { model: Representante },
    { model: Estudiante }
]

// Lista de roles para validaciones cruzadas sin estudiantes
const todosRolesSinEstudiantes = [
    { model: Administrador },
    { model: Profesor },
    { model: Representante }
]

const rolesEstudianteAdministrador = [
    { model: Estudiante },
    { model: Administrador }
]

// Validador para registro de administradores
const registroAdminValidator = [
    // Validación de campos obligatorios
    check(['nombre', 'apellido', 'email', 'telefono', 'cedula', 'direccion'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de email
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email) => {
            for (const { model } of todosRolesSinEstudiantes) {
                const usuarioBDD = await model.findOne({ email });
                if (usuarioBDD) throw new Error('El email ya está registrado');
            }
            return true;
        }),
    // Validación de nombre y apellido
    check('nombre')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('apellido')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    // Validación de teléfono
    check('telefono')
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos y solo números')
        .custom(async (telefono) => {
            for (const { model } of todosRolesSinEstudiantes) {
                const usuarioBDD = await model.findOne({ telefono });
                if (usuarioBDD) throw new Error('El teléfono ya está registrado');
            }
            return true;
        }),
    // Validación de cédula
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            for (const { model } of todosRoles) {
                const usuarioBDD = await model.findOne({ cedula });
                if (usuarioBDD) throw new Error('La cédula ya está registrada');
            }
            return true;
        }),
    // Validación de dirección
    check('direccion')
        .isLength({ min: 5, max: 100 })
        .withMessage('La dirección debe tener entre 5 y 100 caracteres')
        .custom((value) => {
            if (/^(\d)\1{4,}$/.test(value)) throw new Error('La dirección no puede ser solo números repetidos');
            if (/^([a-zA-Z])\1{4,}$/.test(value)) throw new Error('La dirección no puede ser un solo carácter repetido');
            if (/^\d+$/.test(value)) throw new Error('La dirección no puede ser solo números');
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
];

// Validador para registro de profesores
const registroProfesorValidator = [
    // Validación de campos obligatorios
    check(['nombre', 'apellido', 'email', 'direccion', 'telefono', 'cedula'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de email
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email) => {
            for (const { model } of todosRolesSinEstudiantes) {
                const usuarioBDD = await model.findOne({ email });
                if (usuarioBDD) throw new Error('El email ya está registrado');
            }
            return true;
        }),
    // Validación de nombre y apellido
    check('nombre')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('apellido')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    // Validación de teléfono
    check('telefono')
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos y solo números')
        .custom(async (telefono) => {
            for (const { model } of todosRolesSinEstudiantes) {
                const usuarioBDD = await model.findOne({ telefono });
                if (usuarioBDD) throw new Error('El teléfono ya está registrado');
            }
            return true;
        }),
    // Validación de cédula
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            for (const { model } of todosRoles) {
                const usuarioBDD = await model.findOne({ cedula });
                if (usuarioBDD) throw new Error('La cédula ya está registrada');
            }
            return true;
        }),
    // Validación de dirección
    check('direccion')
        .isLength({ min: 5, max: 100 })
        .withMessage('La dirección debe tener entre 5 y 100 caracteres')
        .custom((value) => {
            if (/^(\d)\1{4,}$/.test(value)) throw new Error('La dirección no puede ser solo números repetidos');
            if (/^([a-zA-Z])\1{4,}$/.test(value)) throw new Error('La dirección no puede ser un solo carácter repetido');
            if (/^\d+$/.test(value)) throw new Error('La dirección no puede ser solo números');
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
];

// Validador para registro de representantes
const registroRepresentanteValidator = [
    // Validación de campos obligatorios
    check(['nombre', 'apellido', 'email', 'direccion', 'telefono', 'cedula'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de email
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email) => {
            for (const { model } of todosRolesSinEstudiantes) {
                const usuarioBDD = await model.findOne({ email });
                if (usuarioBDD) throw new Error('El email ya está registrado');
            }
            return true;
        }),
    // Validación de nombre y apellido
    check('nombre')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('apellido')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    // Validación de teléfono
    check('telefono')
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos y solo números')
        .custom(async (telefono) => {
            for (const { model } of todosRolesSinEstudiantes) {
                const usuarioBDD = await model.findOne({ telefono });
                if (usuarioBDD) throw new Error('El teléfono ya está registrado');
            }
            return true;
        }),
    // Validación de cédula
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            for (const { model } of todosRoles) {
                const usuarioBDD = await model.findOne({ cedula });
                if (usuarioBDD) throw new Error('La cédula ya está registrada');
            }
            return true;
        }),
    // Validación de dirección
    check('direccion')
        .isLength({ min: 5, max: 100 })
        .withMessage('La dirección debe tener entre 5 y 100 caracteres')
        .custom((value) => {
            if (/^(\d)\1{4,}$/.test(value)) throw new Error('La dirección no puede ser solo números repetidos');
            if (/^([a-zA-Z])\1{4,}$/.test(value)) throw new Error('La dirección no puede ser un solo carácter repetido');
            if (/^\d+$/.test(value)) throw new Error('La dirección no puede ser solo números');
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para registro de cursos
const registroCursoValidator = [
    // Validación de campos obligatorios
    check(['nivel', 'paralelo'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de nivel
    check('nivel')
        .isInt({ min: 1, max: 7 })
        .withMessage('El nivel debe ser un número entre 1 y 7'),
    // Validación de paralelo
    check('paralelo')
        .isIn(['A', 'B', 'C', 'D', 'E'])
        .withMessage('El paralelo debe ser una letra entre A y E')
        .custom(async (value, { req }) => {
            console.log(req.body.nivel, value)
            const cursoBDD = await Curso.findOne({ nivel: req.body.nivel, paralelo: value });
            if (cursoBDD) throw new Error('El curso ya está registrado');
            const anioLectivoBDD = await AnioLectivo.findOne({ estado: true });
            if (!anioLectivoBDD) throw new Error('No hay un año lectivo activo');
            console.log(anioLectivoBDD)
            req.anioLectivoBDD = anioLectivoBDD;
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para registro de materias
const registroMateriaValidator = [
    // Validación de campos obligatorios
    check(['nombre', 'curso', 'cedulaProfesor'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de nombre de la materia
    check('nombre')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre de la materia solo puede contener letras'),
    // Validación de curso
    check('curso')
        .custom(async (curso, { req }) => {
            const cursoBDD = await Curso.findById(curso);
            if (!cursoBDD) throw new Error('El curso no está registrado');
            req.cursoBDD = cursoBDD;
            const materiasRegistradas = await cursoBDD.buscarMateriasRegistradas(req.body.nombre);
            if (materiasRegistradas.length > 0) throw new Error('Ya existe una materia registrada en este curso');
            return true;
        }),
    // Validación de cédula del profesor
    check('cedulaProfesor')
        .custom(async (cedulaProfesor, { req }) => {
            const profesorBDD = await Profesor.findOne({ cedula: cedulaProfesor });
            if (!profesorBDD) throw new Error('El profesor no está registrado');
            req.profesorBDD = profesorBDD;
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para registro de estudiantes
const registroEstudianteValidator = [
    // Validación de campos obligatorios
    check(['nombre', 'apellido', 'cedula', 'paralelo', 'nivel', 'cedulaRepresentante'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de nombre y apellido
    check(['nombre', 'apellido'])
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    // Validación de cédula
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            for (const { model } of todosRoles) {
                const usuarioBDD = await model.findOne({ cedula });
                if (usuarioBDD) throw new Error('La cédula ya está registrada');
            }
            return true;
        }),
    // Validación de paralelo
    check('paralelo')
        .isIn(['A', 'B', 'C', 'D', 'E'])
        .withMessage('El paralelo debe ser una letra entre A y E'),
    // Validación de nivel
    check('nivel')
        .isInt({ min: 1, max: 7 })
        .withMessage('El nivel debe ser un número entre 1 y 7'),
    // Validación de curso
    check('curso')
        .custom(async (_, { req }) => {
            const cursoBDD = await Curso.findOne({ nivel: req.body.nivel, paralelo: req.body.paralelo });
            if (!cursoBDD) throw new Error('El curso no está registrado');
            const cursoAsignadoBDD = await CursoAsignado.findOne({ curso: cursoBDD._id, anioLectivo: req.userBDD.anio });
            console.log(cursoBDD._id, req.userBDD.anio)
            if (!cursoAsignadoBDD) throw new Error('No se puede registrar el estudiante porque el curso no está asignado a un año lectivo');
            req.cursoAsignadoBDD = cursoAsignadoBDD;
            return true;
        }),
    // Validación de cédula del representante
    check('cedulaRepresentante')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedulaRepresentante, { req }) => {
            const representanteBDD = await Representante.findOne({ cedula: cedulaRepresentante });
            if (!representanteBDD) throw new Error('El representante no está registrado');
            req.representanteBDD = representanteBDD;
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para asignar representante a estudiante
const asignarRepresentanteValidator = [
    // Validación de campos obligatorios
    check(['cedulaEstudiante', 'cedulaRepresentante'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de cédula del estudiante
    check('cedulaEstudiante')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedulaEstudiante, { req }) => {
            const estudianteBDD = await Estudiante.findOne({ cedula: cedulaEstudiante });
            if (!estudianteBDD) throw new Error('El estudiante no está registrado');
            req.estudianteBDD = estudianteBDD;
            return true;
        }),
    // Validación de cédula del representante
    check('cedulaRepresentante')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedulaRepresentante, { req }) => {
            const representanteBDD = await Representante.findOne({ cedula: cedulaRepresentante });
            if (!representanteBDD) throw new Error('El representante no está registrado');
            req.representanteBDD = representanteBDD;
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para asignar estudiante a curso
const asignarEstudianteACursoValidator = [
    // Validación de campos obligatorios
    check(['idEstudiante', 'idCurso'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de id del estudiante
    check('idEstudiante')
        .custom(async (idEstudiante, { req }) => {
            const estudianteBDD = await Estudiante.findById(idEstudiante);
            if (!estudianteBDD) throw new Error('El estudiante no está registrado');
            req.estudianteBDD = estudianteBDD;
            return true;
        }),
    // Validación de id del curso
    check('idCurso')
        .custom(async (idCurso, { req }) => {
            const cursoBDD = await Curso.findById(idCurso);
            if (!cursoBDD) throw new Error('El curso no está registrado');
            req.cursoBDD = cursoBDD;
            return true;
        }),
    // Validación de año lectivo
    check('anioLectivo')
        .custom(async (_, { req }) => {
            const anioLectivoBDD = await AnioLectivo.findOne({ estado: true });
            if (!anioLectivoBDD) throw new Error('No hay un año lectivo activo');
            req.anioLectivo = anioLectivoBDD;
            const yaAsignado = await CursoAsignado.findOne({
                anioLectivo: anioLectivoBDD._id,
                estudiantes: req.estudianteBDD._id
            });
            if (yaAsignado) throw new Error('El estudiante ya ha sido asignado a un curso en este año lectivo');
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para asignar ponderaciones
const asignarPonderacionesValidator = [
    // Validación de campos obligatorios
    check(['deberes', 'talleres', 'examenes', 'pruebas'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios')
        .isNumeric()
        .withMessage('Las ponderaciones deben ser números decimales o enteros'),
    // Validación de ponderaciones
    check('ponderaciones')
        .custom(async (_, { req }) => {
            const total = parseFloat(req.body.deberes) + parseFloat(req.body.talleres) + parseFloat(req.body.examenes) + parseFloat(req.body.pruebas);
            if (total !== 100) throw new Error('La suma de las ponderaciones debe ser igual a 100');
            req.ponderaciones = {
                deberes: parseFloat(req.body.deberes),
                talleres: parseFloat(req.body.talleres),
                examenes: parseFloat(req.body.examenes),
                pruebas: parseFloat(req.body.pruebas)
            };
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para registro de asistencia de estudiantes
const registroAsistenciaEstudiantesValidator = [
    // Validación de campos obligatorios
    check(['curso', 'asistencias'])
        .notEmpty()
        .withMessage('Especificar el curso es obligatorio'),
    // Validación de curso
    check('curso')
        .custom(async (curso, { req }) => {
            const cursoBDD = await Curso.findById(curso);
            if (!cursoBDD) throw new Error('El curso no está registrado');
            const cursoAsignadoBDD = await CursoAsignado.findOne({ curso: cursoBDD._id, anioLectivo: req.userBDD.anio });
            if (!cursoAsignadoBDD) throw new Error('El curso no está asignado a un año lectivo');
            req.cursoAsignadoBDD = cursoAsignadoBDD;
            return true;
        }),
    // Validación de asistencias
    check('asistencias')
        .custom((asistencias) => {
            if (!asistencias || typeof asistencias !== 'object') throw new Error('Especificar las asistencias');
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Modificar usuarios
const modificarUsuarioValidator = [
    // Validación de campos obligatorios
    check(['nombre', 'apellido', 'email', 'telefono', 'cedula', 'direccion', 'id'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de email
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email, { req }) => {
            for (const { model } of todosRolesSinEstudiantes) {
                const usuarioBDD = await model.findOne({ email });
                if (usuarioBDD) throw new Error('El email ya está registrado');
            }
            return true;
        }),
    // Validación de nombre y apellido
    check('nombre')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('apellido')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    // Validación de teléfono
    check('telefono')
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos y solo números')
        .custom(async (telefono, { req }) => {
            for (const { model } of todosRolesSinEstudiantes) {
                const usuarioBDD = await model.findOne({ telefono });
                if (usuarioBDD) throw new Error('El teléfono ya está registrado');
            }
            return true;
        }),
    // Validación de cédula
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula, { req }) => {
            for (const { model } of todosRoles) {
                const usuarioBDD = await model.findOne({ cedula });
                if (usuarioBDD) throw new Error('La cédula ya está registrada');
            }
            return true;
        }),
    // Validación de dirección
    check('direccion')
        .isLength({ min: 5, max: 100 })
        .withMessage('La dirección debe tener entre 5 y 100 caracteres')
        .custom((value) => {
            if (/^(\d)\1{4,}$/.test(value)) throw new Error('La dirección no puede ser solo números repetidos');
            if (/^([a-zA-Z])\1{4,}$/.test(value)) throw new Error('La dirección no puede ser un solo carácter repetido');
            if (/^\d+$/.test(value)) throw new Error('La dirección no puede ser solo números');
            return true;
        }),
    // Validación de id
    check('id')
        .custom(async (id, { req }) => {
            const usuarioBDD = await Representante.findById(id);
            if (!usuarioBDD) throw new Error('El usuario no está registrado');
            req.usuarioBDD = usuarioBDD;
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


// Validador para modificar estudiantes
const modificarEstudianteValidator = [
    // Validación de campos obligatorios
    check(['nombre', 'apellido', 'cedula', 'id'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de nombre y apellido
    check(['nombre', 'apellido'])
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    // Validación de cédula
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            for (const { model } of todosRoles) {
                const usuarioBDD = await model.findOne({ cedula });
                if (usuarioBDD) throw new Error('La cédula ya está registrada');
            }
            return true;
        }),
    // Validación de id
    check('id')
        .custom(async (id, { req }) => {
            const usuarioBDD = await Estudiante.findById(id);
            if (!usuarioBDD) throw new Error('El usuario no está registrado');
            req.estudianteBDD = usuarioBDD;
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

// Validador para justificar inasistencia de estudiante
const justificarInasistenciaValidator = [
    // Validación de campos obligatorios
    check(['cedula', 'fecha', 'justificacion'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    // Validación de cédula
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula, { req }) => {
            const estudianteBDD = await asistencia.findOne({ cedula });
            if (!estudianteBDD) throw new Error('El estudiante no está registrado');
            req.estudianteBDD = estudianteBDD;
            return true;
        }),
    // Validación de fecha
    check('fecha')
        .custom((fecha) => {
            const regExp = new RegExp(/^\d{4}\/\d{1,2}\/\d{1,2}$/);
            if (!regExp.test(fecha)) throw new Error('La fecha no es válida');
            const [year, month, day] = fecha.split('/').map(Number);
            const date = new Date(`${year}-${month}-${day}`);
            if (month < 1 || month > 12) throw new Error('El mes no es válido');
            if (day < 1 || day > 31) throw new Error('El día no es válido');
            if (month === 4 || month === 6 || month === 9 || month === 11) {
                if (day > 30) throw new Error('Este mes no tiene más de 30 días');
            }
            if (month === 2 && day > 29) throw new Error('Febrero no tiene más de 29 días');
            const actualDate = new Date();
            if (date > actualDate) throw new Error('La fecha no puede ser mayor a la actual');
            return true;
        }),
    // Validación de justificación
    check('justificacion')
        .trim()
        .isLength({ min: 5, max: 300 }).withMessage('La descripción debe tener entre 5 y 300 caracteres')
        .custom((value) => {
            if (/^(\d)\1{4,}$/.test(value)) throw new Error('La descripción no puede ser solo números repetidos');
            if (/^([a-zA-Z])\1{4,}$/.test(value)) throw new Error('La descripción no puede ser un solo carácter repetido');
            if (/^\d+$/.test(value)) throw new Error('La descripción no puede ser solo números');
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para terminar año lectivo
const terminarAnioLectivoValidator = [
    // Validación de año lectivo activo
    check('anio').custom(async (_, { req }) => {
        const anioLectivoBDD = await AnioLectivo.findOne({ estado: true });
        if (!anioLectivoBDD) throw new Error('No hay un año lectivo activo');
        req.anioLectivoBDD = anioLectivoBDD;
        return true;
    }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para registrar fecha de fin de año lectivo
const registrarFechaFinValidator = [
    // Validación de fecha de fin
    check('fechaFin')
        .notEmpty()
        .withMessage('La fecha de fin es obligatoria')
        .custom((fecha) => {
            const regExp = new RegExp(/^\d{4}\/\d{1,2}\/\d{1,2}$/);
            if (!regExp.test(fecha)) throw new Error('La fecha no es válida');
            const [year, month, day] = fecha.split('/').map(Number);
            const date = new Date(`${year}-${month}-${day}`);
            if (month < 1 || month > 12) throw new Error('El mes no es válido');
            if (day < 1 || day > 31) throw new Error('El día no es válido');
            if (month === 4 || month === 6 || month === 9 || month === 11) {
                if (day > 30) throw new Error('Este mes no tiene más de 30 días');
            }
            if (month === 2 && day > 29) throw new Error('Febrero no tiene más de 29 días');
            const actualDate = new Date();
            if (date > actualDate) throw new Error('La fecha no puede ser mayor a la actual');
            return true;
        }),
    // Validación de año lectivo activo
    check('anioLectivo')
        .custom(async (_, { req }) => {
            const anioLectivoBDD = await AnioLectivo.findOne({ estado: true });
            if (!anioLectivoBDD) throw new Error('No hay un año lectivo activo');
            req.anioLectivoBDD = anioLectivoBDD;
            return true;
        }
        ),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para eliminar profesor
const eliminarProfesorValidator = [
    // Validación de id del profesor
    check('id')
        .notEmpty()
        .withMessage('El id del profesor es obligatorio')
        .custom(async (id, { req }) => {
            const profesorBDD = await Profesor.findById(id);
            if (!profesorBDD) throw new Error('El profesor no está registrado');
            req.profesorBDD = profesorBDD;
            const materiasBDD = await Materia.find({ profesor: id });
            if (materiasBDD.length > 0) throw new Error('No se puede eliminar el profesor porque está asociado a un curso, asigne otro profesor primero');
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }

]

const eliminarRepresentanteValidator = [
    // Validación de id del representante
    check('id')
        .notEmpty()
        .withMessage('El id del representante es obligatorio')
        .custom(async (id, { req }) => {
            const representanteBDD = await Representante.findById(id);
            if (!representanteBDD) throw new Error('El representante no está registrado');
            if (representanteBDD.estudiantes.length > 0) throw new Error('No se puede eliminar el representante porque está asociado a un estudiante');
            req.representanteBDD = representanteBDD;
            return true;
        }),
]

// Validador para reemplazar profesor
const reemplazarProfesorValidator = [
    // Validación de ids de profesores
    check(['idProfesor', 'idProfesorNuevo'])
        .notEmpty()
        .withMessage('El id del profesor es obligatorio'),
    // Validación de id del nuevo profesor
    check('idProfesorNuevo')
        .custom(async (idProfesorNuevo, { req }) => {
            const profesorBDD = await Profesor.findById(idProfesorNuevo);
            if (!profesorBDD) throw new Error('El nuevo profesor no está registrado');
            req.nuevoProfesorBDD = profesorBDD;
            if (idProfesorNuevo === req.body.idProfesor) throw new Error('No se puede asignar el mismo profesor');
            return true;
        }),
    // Validación de id del profesor actual
    check('idProfesor')
        .custom(async (idProfesor, { req }) => {
            const profesorBDD = await Profesor.findById(idProfesor);
            if (!profesorBDD) throw new Error('El profesor no está registrado');
            req.profesorBDD = profesorBDD;
            const materiasBDD = await Materia.find({ profesor: idProfesor });
            if (materiasBDD.length === 0) throw new Error('El profesor no está asociado a ningún curso');
            req.materiasBDD = materiasBDD;
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para eliminar estudiante
const eliminarEstAdminValidator = [
    // Validación de id del estudiante
    check('id')
        .notEmpty()
        .withMessage('El id del estudiante es obligatorio')
        .custom(async (id, { req }) => {
            for (const { model } of rolesEstudianteAdministrador) {
                const usuarioBDD = await model.findById(id);
                if (!usuarioBDD) throw new Error('El usuario no está registrado');
            }
            req.usuarioBDD = usuarioBDD;
            return true;
        }),
    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

// Validador para reasignar materia a otro profesor
const reasignarMateriaProfesorValidator = [
    // Validación de ids de profesores y materia
    check(['idProfesor', 'idMateria', 'idNuevoProfesor'])
        .notEmpty()
        .withMessage('El id de los profesores y la materia son obligatorios'),
    // Validación de id del profesor actual
    check('idProfesor')
        .custom(async (idProfesor, { req }) => {
            const profesorBDD = await Profesor.findById(idProfesor);
            if (!profesorBDD) throw new Error('El profesor no está registrado');
            req.profesorBDD = profesorBDD;
            return true;
        }),
    // Validación de id del nuevo profesor
    check('idNuevoProfesor')
        .custom(async (idNuevoProfesor, { req }) => {
            const nuevoProfesorBDD = await Profesor.findById(idNuevoProfesor);
            if (!nuevoProfesorBDD) throw new Error('El nuevo profesor no está registrado');
            req.nuevoProfesorBDD = nuevoProfesorBDD;
            return true;
        }),
    // Validación de id de la materia
    check('idMateria')
        .custom(async (idMateria, { req }) => {
            const materiaBDD = await Materia.findById(idMateria);
            if (!materiaBDD) throw new Error('La materia no está registrada');
            req.materiasBDD = materiaBDD;
            if (req.body.idProfesor === req.body.idNuevoProfesor) throw new Error('No se puede asignar el mismo profesor');
            const cursoBDD = await Curso.findOne({ materias: materiaBDD._id });
            if (!cursoBDD) throw new Error('La materia no está asociada a ningún curso');
            req.cursoBDD = cursoBDD;
            return true;
        }),
]

export {
    //Administrador
    // Registro de usuarios y entidades
    registroAdminValidator,
    registroProfesorValidator,
    registroRepresentanteValidator,
    registroCursoValidator,
    registroMateriaValidator,
    registroEstudianteValidator,
    // Asignaciones y modificaciones
    asignarRepresentanteValidator,
    asignarEstudianteACursoValidator,
    asignarPonderacionesValidator,
    //Modificaciones
    registroAsistenciaEstudiantesValidator,
    justificarInasistenciaValidator,
    eliminarProfesorValidator,
    reemplazarProfesorValidator,
    eliminarEstAdminValidator,
    eliminarRepresentanteValidator,
    reasignarMateriaProfesorValidator,
    modificarUsuarioValidator,
    modificarEstudianteValidator,
    //Anio Lectivo
    terminarAnioLectivoValidator,
    registrarFechaFinValidator,
};
