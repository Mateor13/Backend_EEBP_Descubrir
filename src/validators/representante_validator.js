import { check, validationResult } from 'express-validator';
import estudiantes from '../models/estudiantes.js';

const validarIdEstudiante = () => [
    check('idEstudiante')
        .notEmpty()
        .withMessage('El id del estudiante es obligatorio')
        .custom(async (idEstudiante) => {
            const estudiante = await estudiantes.findOne({ _id: idEstudiante });
            if (!estudiante) throw new Error('El estudiante no existe');
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
];

export {
    validarIdEstudiante
}