import { check, validationResult } from 'express-validator';
import Estudiantes from '../models/estudiantes.js';
import Materias from '../models/materias.js';

// Validador para verificar que el id del estudiante existe en la base de datos
const validarIdEstudiante = [
    check('idEstudiante')
        .notEmpty()
        .withMessage('El id del estudiante es obligatorio')
        .isMongoId()
        .withMessage('El id del estudiante debe ser un id válido')
        .custom(async (idEstudiante) => {
            // Busca el estudiante por id
            const estudiante = await Estudiantes.findById(idEstudiante);
            if (!estudiante) throw new Error('El estudiante no existe');
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
        .custom(async (idEstudiante) => {
            // Busca el estudiante por id
            const estudiante = await Estudiantes.findById(idEstudiante);
            if (!estudiante) throw new Error('El estudiante no existe');
            return true;
        }),
    check('idMateria')
        .notEmpty()
        .withMessage('El id de la materia es obligatorio')
        .isMongoId()
        .withMessage('El id de la materia debe ser un id válido')
        .custom(async (idMateria) => {
            // Busca la materia por id
            const materia = await Materias.findById(idMateria);
            if (!materia) throw new Error('La materia no existe');
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