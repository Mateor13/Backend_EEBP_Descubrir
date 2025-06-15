import { check, validationResult } from 'express-validator';
import Administrador from '../models/administradores.js';
import Profesor from '../models/profesor.js';
import Representante from '../models/representante.js';
import Curso from '../models/cursos.js';
import Estudiante from '../models/estudiantes.js';
import AnioLectivo from '../models/anioLectivo.js';
import Materia from '../models/materias.js';
import CursoAsignado from '../models/cursoAsignado.js';
import mongoose from 'mongoose';
import anioLectivo from '../models/anioLectivo.js';

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
    { model: Estudiante, rol: 'estudiante' },
    { model: Administrador, rol: 'administrador' }
]

// Validador para registro de administradores
const registroAdminValidator = [
    check('anio')
        .custom(async (_, { req }) => {
            const { anio } = req.userBDD;
            await anioLectivo.findById(anio).then((anioBDD) => {
                if (!anioBDD) throw new Error('El año lectivo no existe');
                if (anioBDD.estado === false) throw new Error('El año lectivo no está activo');
            });
            return true;
        }),
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
    check(['nivel', 'paralelo'])
        .notEmpty().withMessage('Todos los campos son obligatorios'),
    check('nivel')
        .isInt({ min: 1, max: 7 }).withMessage('El nivel debe ser un número entre 1 y 7'),
    check('paralelo')
        .isIn(['A', 'B', 'C', 'D', 'E']).withMessage('El paralelo debe ser una letra entre A y E'),
    // Validación personalizada
    check('paralelo').custom(async (value, { req }) => {
        const anioLectivoBDD = await AnioLectivo.findOne({ estado: true });
        if (!anioLectivoBDD) throw new Error('No hay un año lectivo activo');
        req.anioLectivoBDD = anioLectivoBDD;
        return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
];

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
        .isMongoId()
        .withMessage('El id del curso debe ser válido')
        .custom(async (curso, { req }) => {
            // Buscar el curso y poblar las materias con su nombre
            const cursoBDD = await Curso.findById(curso).populate('materias', 'nombre');
            if (!cursoBDD) throw new Error('El curso no está registrado');
            // Verificar si ya existe una materia con el mismo nombre en el curso
            const existeMateria = cursoBDD.materias.some(
                materia => materia.nombre.trim().toLowerCase() === req.body.nombre.trim().toLowerCase()
            );
            if (existeMateria) throw new Error('Ya existe una materia registrada en este curso');
            req.cursoBDD = cursoBDD;
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
    check(['nombre', 'apellido', 'cedula', 'curso', 'cedulaRepresentante'])
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
    // Validación de curso
    check('curso')
        .isMongoId()
        .withMessage('El id del curso debe ser un identificador de MongoDB válido')
        .custom(async (curso, { req }) => {
            const cursoBDD = await Curso.findById(curso);
            if (!cursoBDD) throw new Error('El curso no está registrado');
            req.cursoBDD = cursoBDD;
            const cursoAsignadoBDD = await CursoAsignado.findOne({ curso: cursoBDD._id, anioLectivo: req.userBDD.anio });
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
        .isMongoId()
        .withMessage('El id del estudiante debe ser válido')
        .custom(async (idEstudiante, { req }) => {
            const estudianteBDD = await Estudiante.findById(idEstudiante);
            if (!estudianteBDD) throw new Error('El estudiante no está registrado');
            req.estudianteBDD = estudianteBDD;
            return true;
        }),
    // Validación de id del curso
    check('idCurso')
        .isMongoId()
        .withMessage('El id del curso debe ser válido')
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
    check('deberes')
        .notEmpty().withMessage('El campo deberes es obligatorio')
        .isNumeric().withMessage('La ponderación de deberes debe ser un número'),
    check('talleres')
        .notEmpty().withMessage('El campo talleres es obligatorio')
        .isNumeric().withMessage('La ponderación de talleres debe ser un número'),
    check('examenes')
        .notEmpty().withMessage('El campo examenes es obligatorio')
        .isNumeric().withMessage('La ponderación de examenes debe ser un número'),
    check('pruebas')
        .notEmpty().withMessage('El campo pruebas es obligatorio')
        .isNumeric().withMessage('La ponderación de pruebas debe ser un número'),
    // Validación de suma de ponderaciones
    check(['deberes', 'talleres', 'examenes', 'pruebas'])
        .custom(async (_, { req }) => {
            const anioLectivoBDD = await AnioLectivo.findOne({ estado: true });
            if (!anioLectivoBDD) throw new Error('No hay un año lectivo activo');
            req.anioLectivoBDD = anioLectivoBDD;
            const total =
                parseFloat(req.body.deberes) +
                parseFloat(req.body.talleres) +
                parseFloat(req.body.examenes) +
                parseFloat(req.body.pruebas);
            if (total !== 100) throw new Error('La suma de las ponderaciones debe ser igual a 100');
            req.ponderaciones = {
                deberes: parseFloat(req.body.deberes),
                talleres: parseFloat(req.body.talleres),
                examenes: parseFloat(req.body.examenes),
                pruebas: parseFloat(req.body.pruebas)
            };
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
];

// Validador para registro de asistencia de estudiantes
const registroAsistenciaEstudiantesValidator = [
    // Validación de campos obligatorios
    check(['curso', 'asistencias'])
        .notEmpty()
        .withMessage('Especificar el curso es obligatorio'),
    // Validación de curso
    check('curso')
        .isMongoId()
        .withMessage('El id del curso debe ser válido')
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
    // Validación de id y obtención del usuario
    check('id')
        .isMongoId()
        .withMessage('El id del usuario debe ser válido')
        .custom(async (id, { req }) => {
            // Buscar el usuario en todos los roles sin estudiantes
            let usuarioBDD = null;
            for (const { model } of todosRolesSinEstudiantes) {
                usuarioBDD = await model.findById(id);
                if (usuarioBDD) {
                    req.usuarioBDD = usuarioBDD;
                    req.usuarioModel = model;
                    break;
                }
            }
            if (!usuarioBDD) throw new Error('El usuario no está registrado');
            return true;
        }),
    // Validación de email
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email, { req }) => {
            // Si el email no cambió, permitir
            if (req.usuarioBDD.email === email) return true;
            // Verificar si el email ya está registrado en otros usuarios
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
            if (req.usuarioBDD.telefono === telefono) return true;
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
            // Buscar en todos los roles (incluye estudiantes)
            if (req.usuarioBDD.cedula === cedula) return true;
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
        .custom(async (cedula, { req }) => {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                throw new Error('El id del estudiante no tiene un formato válido');
            }
            const usuarioBDD = await Estudiante.findById(req.params.id);
            if (!usuarioBDD) throw new Error('El estudiante no está registrado');
            if (usuarioBDD.cedula !== cedula) {
                for (const { model } of todosRoles) {
                    const usuarioBDD = await model.findOne({ cedula });
                    if (usuarioBDD) throw new Error('La cédula ya está registrada');
                }
            }
            req.estudianteBDD = usuarioBDD;
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
            const regExp = new RegExp(/^\d{4}-\d{1,2}\-\d{1,2}$/);
            if (!regExp.test(fecha)) throw new Error('La fecha no es válida');
            const [year, month, day] = fecha.split('-').map(Number);
            const date = new Date(`${year}-${month}-${day}`);
            if (month < 1 || month > 12) throw new Error('El mes no es válido');
            if (day < 1 || day > 31) throw new Error('El día no es válido');
            if (month === 4 || month === 6 || month === 9 || month === 11) {
                if (day > 30) throw new Error('Este mes no tiene más de 30 días');
            }
            if (month === 2 && day > 29) throw new Error('Febrero no tiene más de 29 días');
            const actualDate = new Date();
            if (date <= actualDate) throw new Error('La fecha no puede ser menor o igual a la actual');
            return true;
        }),
    // Validación de año lectivo activo
    check('anioLectivo')
        .custom(async (_, { req }) => {
            const anioLectivoBDD = await AnioLectivo.findOne({ estado: true });
            if (!anioLectivoBDD || anioLectivoBDD.estado === false) throw new Error('El año lectivo no está activo');
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
        .isMongoId()
        .withMessage('El id del profesor debe ser válido')
        .custom(async (id, { req }) => {
            const profesorBDD = await Profesor.findById(id);
            if (!profesorBDD) throw new Error('El profesor no está registrado');
            if (profesorBDD.estado === false) throw new Error('El profesor ya está eliminado');
            const materiasBDD = await Materia.find({ profesor: id });
            if (materiasBDD.length > 0) throw new Error('No se puede eliminar el profesor porque está asociado a un curso, asigne otro profesor primero');
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

const eliminarRepresentanteValidator = [
    // Validación de id del representante
    check('id')
        .notEmpty()
        .withMessage('El id del representante es obligatorio')
        .isMongoId()
        .withMessage('El id del representante debe ser válido')
        .custom(async (id, { req }) => {
            const representanteBDD = await Representante.findById(id);
            if (!representanteBDD) throw new Error('El representante no está registrado');
            if (representanteBDD.estado === false) throw new Error('El representante ya está eliminado');
            if (representanteBDD.estudiantes.length > 0) throw new Error('No se puede eliminar el representante porque está asociado a un estudiante');
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

const eliminarCursoValidator = [
    // Validación de id del curso
    check('id')
        .notEmpty()
        .withMessage('El id del curso es obligatorio')
        .isMongoId()
        .withMessage('El id del curso debe ser válido')
        .custom(async (id, { req }) => {
            const cursoBDD = await Curso.findById(id);
            if (!cursoBDD) throw new Error('El curso no está registrado');
            const cursoAsignadoBDD = await CursoAsignado.findOne({ curso: id, anioLectivo: req.userBDD.anio }).populate('curso', 'nivel paralelo');
            if (!cursoAsignadoBDD) throw new Error('El curso no está asignado en este año lectivo');
            if (cursoAsignadoBDD.estudiantes.length > 0) throw new Error('No se puede eliminar el curso porque tiene estudiantes asignados');
            if (cursoAsignadoBDD.estado === false) throw new Error('El curso ya está eliminado');
            req.cursoBDD = cursoAsignadoBDD;
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

// Validador para eliminar materia
const eliminarMateriaValidator = [
    // Validación de id de la materia
    check('id')
        .notEmpty()
        .withMessage('El id de la materia es obligatorio')
        .isMongoId()
        .withMessage('El id de la materia debe ser válido')
        .custom(async (id, { req }) => {
            const materiaBDD = await Materia.findById(id);
            if (!materiaBDD) throw new Error('La materia no está registrada');
            if (materiaBDD.estado === false) throw new Error('La materia ya está eliminada');
            req.materiaBDD = materiaBDD;
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
    check('id')
        .notEmpty().withMessage('El id es obligatorio')
        .isMongoId().withMessage('El id debe ser válido')
        .custom(async (id, { req }) => {
            for (const { model, rol } of rolesEstudianteAdministrador) {
                if (model === Administrador) {
                    if (await model.countDocuments({ estado: true }) === 1) {
                        throw new Error('No se puede eliminar el último administrador');
                    }
                }
                const usuarioBDD = await model.findById(id);
                if (usuarioBDD) {
                    if (usuarioBDD.estado === false) {
                        throw new Error(`El ${rol} ya está eliminado`);
                    }
                    req.usuarioBDD = usuarioBDD;
                    return true;
                }
            }
            throw new Error('El usuario no está registrado');
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
];

// Validador para modificar materia
const modificarMateriaValidator = [
    // Validación de campos obligatorios
    check('idMateria')
        .notEmpty()
        .withMessage('El id de la materia es obligatorio')
        .isMongoId()
        .withMessage('El id de la materia debe ser válido'),
    check('idProfesorNuevo')
        .notEmpty()
        .withMessage('El id del nuevo profesor es obligatorio')
        .isMongoId()
        .withMessage('El id del nuevo profesor debe ser válido'),
    check('nombre')
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre de la materia solo puede contener letras'),
    // Validación de id de la materia y lógica de nombre/profesor
    check('idMateria')
        .custom(async (idMateria, { req }) => {
            const materiaBDD = await Materia.findById(idMateria).populate('profesor', 'nombre _id');
            if (!materiaBDD) throw new Error('La materia no está registrada');
            req.materiaBDD = materiaBDD;

            // Validar nombre solo si cambia
            if (req.body.nombre.trim().toLowerCase() !== materiaBDD.nombre.trim().toLowerCase()) {
                // Buscar el curso al que pertenece la materia
                const cursoBDD = await Curso.findOne({ materias: materiaBDD._id }).populate('materias', 'nombre');
                if (!cursoBDD) throw new Error('La materia no está asociada a ningún curso');
                const existe = cursoBDD.materias.some(
                    m => m.nombre.trim().toLowerCase() === req.body.nombre.trim().toLowerCase()
                );
                if (existe) throw new Error('Ya existe una materia registrada con ese nombre');
                req.cursoBDD = cursoBDD;
            } else {
                // Si el nombre no cambia, igual obtenemos el curso
                const cursoBDD = await Curso.findOne({ materias: materiaBDD._id });
                if (!cursoBDD) throw new Error('La materia no está asociada a ningún curso');
                req.cursoBDD = cursoBDD;
            }
            return true;
        }),
    // Validación de id del nuevo profesor
    check('idProfesorNuevo')
        .custom(async (idProfesorNuevo, { req }) => {
            const nuevoProfesorBDD = await Profesor.findById(idProfesorNuevo);
            if (!nuevoProfesorBDD) throw new Error('El nuevo profesor no está registrado');
            req.nuevoProfesorBDD = nuevoProfesorBDD;
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

// Reasignar curso a estudiante
const reasignarCursoEstudianteValidator = [
    // Validación de campos obligatorios
    check('idEstudiante')
        .notEmpty()
        .withMessage('El id del estudiante es obligatorio')
        .isMongoId()
        .withMessage('El id del estudiante debe ser válido'),
    check('idCurso')
        .notEmpty()
        .withMessage('El id del nuevo curso es obligatorio')
        .isMongoId()
        .withMessage('El id del nuevo curso debe ser válido'),
    // Validación de id del estudiante
    check('idEstudiante')
        .custom(async (idEstudiante, { req }) => {
            const estudianteBDD = await Estudiante.findById(idEstudiante);
            if (!estudianteBDD) throw new Error('El estudiante no está registrado');
            if (estudianteBDD.estado === false) throw new Error('El estudiante ya está eliminado');
            const cursoAsignadoBDD = await CursoAsignado.findOne({ estudiantes: idEstudiante, anioLectivo: req.userBDD.anio });
            if (!cursoAsignadoBDD) throw new Error('El estudiante no está asignado a un curso');
            req.cursoAnterior = cursoAsignadoBDD;
            req.estudianteBDD = estudianteBDD;
            return true;
        }),
    // Validación de id del nuevo curso
    check('idCurso')
        .custom(async (idCurso, { req }) => {
            const cursoBDD = await Curso.findById(idCurso);
            if (!cursoBDD) throw new Error('El nuevo curso no está registrado');
            if (cursoBDD.estado === false) throw new Error('El nuevo curso ya está eliminado');
            const cursoAsignadoBDD = await CursoAsignado.findOne({ curso: idCurso, anioLectivo: req.userBDD.anio });
            if (!cursoAsignadoBDD) throw new Error('El nuevo curso no está asignado a un año lectivo');
            req.cursoBDD = cursoAsignadoBDD;
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

const comenzarAnioLectivoValidator = [
    // Validación de año lectivo activo
    check('anio').custom(async (_, { req }) => {
        const anioLectivoBDD = await AnioLectivo.findOne({ estado: true });
        if (anioLectivoBDD) throw new Error('Ya hay un año lectivo activo');
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
    reasignarCursoEstudianteValidator,
    //Modificaciones
    registroAsistenciaEstudiantesValidator,
    justificarInasistenciaValidator,
    eliminarProfesorValidator,
    eliminarEstAdminValidator,
    eliminarRepresentanteValidator,
    eliminarCursoValidator,
    eliminarMateriaValidator,
    modificarMateriaValidator,
    modificarUsuarioValidator,
    modificarEstudianteValidator,
    //Anio Lectivo
    comenzarAnioLectivoValidator,
    terminarAnioLectivoValidator,
    registrarFechaFinValidator,
};
