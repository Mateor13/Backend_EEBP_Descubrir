import { check, validationResult } from 'express-validator';
import Administrador from '../models/administradores.js';
import Profesor from '../models/profesor.js';
import Representante from '../models/representante.js';
import Curso from '../models/cursos.js';
import Estudiante from '../models/estudiantes.js';
import AnioLectivo from '../models/anioLectivo.js';
import Materia from '../models/materias.js';
import CursoAsignado from '../models/cursoAsignado.js';

const todosRoles = [
    { model: Administrador },
    { model: Profesor },
    { model: Representante }
]

const todosRolesSinAdmin = [
    { model: Profesor },
    { model: Representante },
    { model: Estudiante }
]

const todosRolesSinAdminSinEstudiante = [
    { model: Profesor },
    { model: Representante }
]

const registroAdminValidator = [
    check(['nombre', 'apellido', 'email', 'password'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email) => {
            for (const { model } of todosRoles) {
                const usuarioBDD = await model.findOne({ email });
                if (usuarioBDD) throw new Error('El email ya está registrado');
            }
            return true;
        }),
    check('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    check('nombre')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('apellido')
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
    check(['nombre', 'apellido', 'email', 'direccion', 'telefono', 'cedula'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email) => {
            for (const { model } of todosRoles) {
                const usuarioBDD = await model.findOne({ email });
                if (usuarioBDD) throw new Error('El email ya está registrado');
            }
            return true;
        }),
    check('nombre')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('apellido')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('telefono')
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos y solo números')
        .custom(async (telefono) => {
            for (const { model } of todosRolesSinAdminSinEstudiante) {
                const usuarioBDD = await model.findOne({ telefono });
                if (usuarioBDD) throw new Error('El teléfono ya está registrado');
            }
            return true;
        }),
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            for (const { model } of todosRolesSinAdmin) {
                const usuarioBDD = await model.findOne({ cedula });
                if (usuarioBDD) throw new Error('La cédula ya está registrada');
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
];

const registroRepresentanteValidator = [
    check(['nombre', 'apellido', 'email', 'direccion', 'telefono', 'cedula'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('email')
        .isEmail()
        .withMessage('El email no es válido')
        .custom(async (email) => {
            for (const { model } of todosRoles) {
                const usuarioBDD = await model.findOne({ email });
                if (usuarioBDD) throw new Error('El email ya está registrado');
            }
            return true;
        }),
    check('nombre')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('apellido')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    check('telefono')
        .matches(/^\d{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos y solo números')
        .custom(async (telefono) => {
            for (const { model } of todosRolesSinAdminSinEstudiante) {
                const usuarioBDD = await model.findOne({ telefono });
                if (usuarioBDD) throw new Error('El teléfono ya está registrado');
            }
            return true;
        }),
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula) => {
            for (const { model } of todosRolesSinAdmin) {
                const usuarioBDD = await model.findOne({ cedula });
                if (usuarioBDD) throw new Error('La cédula ya está registrada');
            }
            return true;
        }),
    check('direccion')
        .isLength({ min: 5, max: 100 })
        .withMessage('La dirección debe tener entre 5 y 100 caracteres')
        .custom((value) => {
            if (/^(\d)\1{4,}$/.test(value)) throw new Error('La dirección no puede ser solo números repetidos');
            if (/^([a-zA-Z])\1{4,}$/.test(value)) throw new Error('La dirección no puede ser un solo carácter repetido');
            if (/^\d+$/.test(value)) throw new Error('La dirección no puede ser solo números');
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

const registroCursoValidator = [
    check(['nivel', 'paralelo'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('nivel')
        .isInt({ min: 1, max: 7 })
        .withMessage('El nivel debe ser un número entre 1 y 7'),
    check('paralelo')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El paralelo solo puede contener letras')
        .includes(['A', 'B', 'C', 'D', 'E'])
        .withMessage('El paralelo debe ser una letra entre A y E')
        .custom(async (value, { req }) => {
            const cursoBDD = await Curso.findOne({ nivel: req.body.nivel, paralelo: value });
            if (cursoBDD) throw new Error('El curso ya está registrado');
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
]

const registroMateriaValidator = [
    check(['nombre', 'curso', 'cedulaProfesor'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('nombre')
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre de la materia solo puede contener letras'),
    check('curso')
        .custom(async (curso, { req }) => {
            const regExp = new RegExp(/^[0-7][A-E]$/)
            if (!regExp.test(curso)) throw new Error('El curso no es válido, debe ser un número del 1 al 7 y una letra de la A a la E');
            const cursoBDD = await Curso.findOne({ nombre: curso });
            if (!cursoBDD) throw new Error('El curso no está registrado');
            req.cursoBDD = cursoBDD;
            const materiasRegistradas = await cursoBDD.buscarMateriasRegistradas(req.body.nombre);
            if (materiasRegistradas.length > 0) throw new Error('Ya existe una materia registrada en este curso');
            return true;
        }),
    check('cedulaProfesor')
        .custom(async (cedulaProfesor, { req }) => {
            const profesorBDD = await Profesor.findOne({ cedula: cedulaProfesor });
            if (!profesorBDD) throw new Error('El profesor no está registrado');
            req.profesorBDD = profesorBDD;
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

const registroEstudianteValidator = [
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
            for (const { model } of todosRolesSinAdmin) {
                const usuarioBDD = await model.findOne({ cedula });
                if (usuarioBDD) throw new Error('La cédula ya está registrada');
            }
            return true;
        }),
    check('curso')
        .custom(async (curso, { req }) => {
            const regExp = new RegExp(/^[0-7][A-E]$/)
            if (!regExp.test(curso)) throw new Error('El curso no es válido, debe ser un número del 1 al 7 y una letra de la A a la E');
            const cursoBDD = await Curso.findOne({ nombre: curso });
            if (!cursoBDD) throw new Error('El curso no está registrado');
            req.cursoBDD = cursoBDD;
            return true;
        }),
    check('cedulaRepresentante')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedulaRepresentante, { req }) => {
            const representanteBDD = await Representante.findOne({ cedula: cedulaRepresentante });
            if (!representanteBDD) throw new Error('El representante no está registrado');
            req.representanteBDD = representanteBDD;
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

const asignarRepresentanteValidator = [
    check(['cedulaEstudiante', 'cedulaRepresentante'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('cedulaEstudiante')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedulaEstudiante, { req }) => {
            const estudianteBDD = await Estudiante.findOne({ cedula: cedulaEstudiante });
            if (!estudianteBDD) throw new Error('El estudiante no está registrado');
            req.estudianteBDD = estudianteBDD;
            return true;
        }),
    check('cedulaRepresentante')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedulaRepresentante, { req }) => {
            const representanteBDD = await Representante.findOne({ cedula: cedulaRepresentante });
            if (!representanteBDD) throw new Error('El representante no está registrado');
            req.representanteBDD = representanteBDD;
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

const asignarEstudianteACursoValidator = [
    check(['idEstudiante', 'idCurso'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('idEstudiante')
        .custom(async (idEstudiante, { req }) => {
            const estudianteBDD = await Estudiante.findById(idEstudiante);
            if (!estudianteBDD) throw new Error('El estudiante no está registrado');
            req.estudianteBDD = estudianteBDD;
            return true;
        }),
    check('idCurso')
        .custom(async (idCurso, { req }) => {
            const cursoBDD = await Curso.findById(idCurso);
            if (!cursoBDD) throw new Error('El curso no está registrado');
            req.cursoBDD = cursoBDD;
            return true;
        }),
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
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const registroAsistenciaEstudiantesValidator = [
    check('curso')
        .notEmpty()
        .withMessage('Especificar el curso es obligatorio')
        .custom(async (curso, { req }) => {
            const regExp = new RegExp(/^[1-7][A-E]$/)
            if (!regExp.test(curso)) throw new Error('El curso debe ser un número entre 1 y 7 seguido de una letra entre A y E');
            const cursoBDD = await Curso.findOne({ nombre: curso }).populate('estudiantes');
            if (!cursoBDD) throw new Error('El curso no está registrado');
            req.cursoBDD = cursoBDD;
            return true;
        }),
    check('asistencias')
        .custom((asistencias) => {
            if (!asistencias || typeof asistencias !== 'object') throw new Error('Especificar las asistencias');
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

const justificarInasistenciaValidator = [
    check(['cedula', 'fecha', 'justificacion'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('cedula')
        .matches(/^\d{10}$/)
        .withMessage('La cédula debe tener exactamente 10 dígitos y solo números')
        .custom(async (cedula, { req }) => {
            const estudianteBDD = await asistencia.findOne({ cedula });
            if (!estudianteBDD) throw new Error('El estudiante no está registrado');
            req.estudianteBDD = estudianteBDD;
            return true;
        }),
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
    check('justificacion')
        .trim()
        .isLength({ min: 5, max: 300 }).withMessage('La descripción debe tener entre 5 y 300 caracteres')
        .custom((value) => {
            if (/^(\d)\1{4,}$/.test(value)) throw new Error('La descripción no puede ser solo números repetidos');
            if (/^([a-zA-Z])\1{4,}$/.test(value)) throw new Error('La descripción no puede ser un solo carácter repetido');
            if (/^\d+$/.test(value)) throw new Error('La descripción no puede ser solo números');
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

const terminarAnioLectivoValidator = [
    check('anio').custom(async (_, { req }) => {
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
]

const registrarFechaFinValidator = [
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
    check('anioLectivo')
        .custom(async (_, { req }) => {
            const anioLectivoBDD = await AnioLectivo.findOne({ estado: true });
            if (!anioLectivoBDD) throw new Error('No hay un año lectivo activo');
            req.anioLectivoBDD = anioLectivoBDD;
            return true;
        }
        ),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const eliminarProfesorValidator = [
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
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }

]

const reemplazarProfesorValidator = [
    check(['idProfesor', 'idProfesorNuevo'])
        .notEmpty()
        .withMessage('El id del profesor es obligatorio'),
    check('idProfesorNuevo')
        .custom(async (idProfesorNuevo, { req }) => {
            const profesorBDD = await Profesor.findById(idProfesorNuevo);
            if (!profesorBDD) throw new Error('El nuevo profesor no está registrado');
            req.nuevoProfesorBDD = profesorBDD;
            if (idProfesorNuevo === req.body.idProfesor) throw new Error('No se puede asignar el mismo profesor');
            return true;
        }),
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
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const eliminarEstudianteValidator = [
    check('id')
        .notEmpty()
        .withMessage('El id del estudiante es obligatorio')
        .custom(async (id, { req }) => {
            const estudianteBDD = await Estudiante.findById(id);
            if (!estudianteBDD) throw new Error('El estudiante no está registrado');
            req.estudianteBDD = estudianteBDD;
            const cursoBDD = await Curso.findOne({ estudiantes: id });
            if (!cursoBDD) throw new Error('El estudiante no está asociado a ningún curso');
            req.cursoBDD = cursoBDD;
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

const reasignarMateriaProfesorValidator = [
    check(['idProfesor', 'idMateria', 'idNuevoProfesor'])
        .notEmpty()
        .withMessage('El id de los profesores y la materia son obligatorios'),
    check('idProfesor')
        .custom(async (idProfesor, { req }) => {
            const profesorBDD = await Profesor.findById(idProfesor);
            if (!profesorBDD) throw new Error('El profesor no está registrado');
            req.profesorBDD = profesorBDD;
            return true;
        }),
    check('idNuevoProfesor')
        .custom(async (idNuevoProfesor, { req }) => {
            const nuevoProfesorBDD = await Profesor.findById(idNuevoProfesor);
            if (!nuevoProfesorBDD) throw new Error('El nuevo profesor no está registrado');
            req.nuevoProfesorBDD = nuevoProfesorBDD;
            return true;
        }),
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
    //Registros
    registroAdminValidator,
    registroProfesorValidator,
    registroRepresentanteValidator,
    registroCursoValidator,
    registroMateriaValidator,
    registroEstudianteValidator,
    //Asignaciones
    asignarRepresentanteValidator,
    asignarEstudianteACursoValidator,
    //Modificaciones
    registroAsistenciaEstudiantesValidator,
    justificarInasistenciaValidator,
    eliminarProfesorValidator,
    reemplazarProfesorValidator,
    eliminarEstudianteValidator,
    reasignarMateriaProfesorValidator,
    //Anio Lectivo
    terminarAnioLectivoValidator,
    registrarFechaFinValidator
};
