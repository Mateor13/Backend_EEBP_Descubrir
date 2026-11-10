import { check, validationResult } from 'express-validator';
import Estudiantes from '../models/estudiantes.js';
import Materias from '../models/materias.js';
import Representante from '../models/representante.js';
import CursoAsignado from '../models/cursoAsignado.js';

// Verifica que el estudiante esté asociado al representante autenticado.
// Antes solo se comprobaba que el estudiante existiera: cualquier representante podía ver
// notas, asistencia y observaciones de cualquier alumno cambiando el id en la URL.
const verificarEstudianteDelRepresentante = async (idEstudiante, req) => {
    const representante = await Representante.exists({ _id: req.userBDD.id, estudiantes: idEstudiante, estado: true });
    if (!representante) throw new Error('El estudiante no existe o no está asociado a usted');
};

// Validador para verificar que el id del estudiante existe en la base de datos
const validarIdEstudiante = [
    check('idEstudiante')
        .notEmpty()
        .withMessage('El id del estudiante es obligatorio')
        .isMongoId()
        .withMessage('El id del estudiante debe ser un id válido')
        .bail()
        .custom(async (idEstudiante, { req }) => {
            // Busca el estudiante por id
            const estudiante = await Estudiantes.findById(idEstudiante);
            if (!estudiante) throw new Error('El estudiante no existe');
            await verificarEstudianteDelRepresentante(idEstudiante, req);
            return true;
        }),
    // Middleware para devolver el primer error de validación encontrado
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
];

const validarIdEstudianteIdMateria = [
    check('idEstudiante')
        .notEmpty()
        .withMessage('El id del estudiante es obligatorio')
        .isMongoId()
        .withMessage('El id del estudiante debe ser un id válido')
        .bail()
        .custom(async (idEstudiante, { req }) => {
            // Busca el estudiante por id
            const estudiante = await Estudiantes.findById(idEstudiante);
            if (!estudiante) throw new Error('El estudiante no existe');
            await verificarEstudianteDelRepresentante(idEstudiante, req);
            return true;
        }),
    check('idMateria')
        .notEmpty()
        .withMessage('El id de la materia es obligatorio')
        .isMongoId()
        .withMessage('El id de la materia debe ser un id válido')
        .bail()
        .custom(async (idMateria, { req }) => {
            // Busca la materia por id
            const materia = await Materias.findById(idMateria);
            if (!materia) throw new Error('La materia no existe');
            // La materia debe dictarse en el curso del estudiante
            const curso = await CursoAsignado.exists({ estudiantes: req.params.idEstudiante, materias: idMateria, anioLectivo: req.userBDD.anio });
            if (!curso) throw new Error('La materia no corresponde al estudiante');
            return true;
        }),
    // Middleware para devolver el primer error de validación encontrado
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

export {
    validarIdEstudiante,
    validarIdEstudianteIdMateria
}