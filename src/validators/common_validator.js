import { check, validationResult } from "express-validator";
import aniosLectivo from "../models/anioLectivo.js";
import representante from "../models/representante.js";
import profesor from "../models/profesor.js";
import administradores from "../models/administradores.js";

const loginValidator = [
    check(['email', 'password'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('email')
        .isEmail()
        .withMessage('El email no es válido'),
    check('anioLectivo')
        .notEmpty()
        .withMessage('Debe seleccionar el periodo académico')
        .custom(async (anioLectivo) => {
            const anioLectivoBDD = await aniosLectivo.findOne({ periodo: anioLectivo });
            if (!anioLectivoBDD) {
                throw new Error('El periodo académico no es válido');
            }
        }),
    check('password').custom(async (value, { req }) => {
        const { email } = req.body;

        const roles = [
            { model: representante },
            { model: profesor },
            { model: administradores }
        ];
        for (const { model } of roles) {
            const userBDD = await model.findOne({ email });
            if (userBDD) {
                if (!userBDD.confirmEmail) {
                    throw new Error('Por favor confirme su cuenta');
                }
                const verificarPassword = await userBDD.compararPassword(value);
                if (!verificarPassword) {
                    throw new Error('Credenciales incorrectas');
                }
                return true;
            }
        }
        throw new Error('Credenciales incorrectas');
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const confirmarCuentaValidator = [
    check('token').custom(async (_,{ req }) => {
        const { token } = req.params;
        if (!token) {
            throw new Error('El token es obligatorio');
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

const recuperarPasswordValidator = [
    check('email')
        .notEmpty()
        .withMessage('El email es obligatorio')
        .isEmail()
        .withMessage('El email no es válido'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
]

const comprobarTokenPasswordValidator = [
    check('token').custom(async (_,{ req }) => {
        const { token } = req.params;
        if (!token) {
            throw new Error('El token es obligatorio');
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

const perfilValidator = [
    check('userBDD').custom(async (_,{ req }) => {
        if (!req.userBDD) {
            throw new Error('Falló al procesar los datos');
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

const nuevaContrasenaValidator = [
    check('token')
    .custom(async (value, { req }) => {
        const { token } = req.params;
        if (!token) {
            throw new Error('El token es obligatorio');
        }
    }),
    check(['password', 'confirmPassword'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .custom((password, confirmPassword) => {
            if (password !== confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
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

export {
    loginValidator,
    confirmarCuentaValidator,
    recuperarPasswordValidator,
    comprobarTokenPasswordValidator,
    perfilValidator,
    nuevaContrasenaValidator
}