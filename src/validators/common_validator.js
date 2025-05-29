import { check, validationResult } from "express-validator";
import aniosLectivo from "../models/anioLectivo.js";
import representante from "../models/representante.js";
import profesor from "../models/profesor.js";
import administradores from "../models/administradores.js";

// Validador para login de cualquier usuario (admin, profesor, representante)
const loginValidator = [
    check(['email', 'password'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('email')
        .isEmail()
        .withMessage('El email no es válido'),
    check('password')
        .custom(async (value, { req }) => {
            const { email } = req.body;
            const roles = [
                { model: representante, rol: 'representante' },
                { model: profesor, rol: 'profesor' },
                { model: administradores, rol: 'administrador' }
            ];
            for (const { model, rol } of roles) {
                const userBDD = await model.findOne({ email });
                if (userBDD) {
                    if (!userBDD.confirmEmail) throw new Error('Por favor confirme su cuenta');
                    if (!userBDD.estado) throw new Error('Su cuenta ha sido desactivada, por favor contacte al administrador');
                    const verificarPassword = await userBDD.compararPassword(value);
                    if (!verificarPassword) throw new Error('Credenciales incorrectas');
                    req.usuarioBDD = userBDD;
                    req.rol = rol;
                    return true;
                }
            }
            throw new Error('Credenciales incorrectas');
        }),
    check('anioLectivo')
        .notEmpty()
        .withMessage('El año lectivo es obligatorio')
        .custom(async (value, { req }) => {
            const anioLectivoBDD = await aniosLectivo.findOne({ _id: value });
            if (!anioLectivoBDD) throw new Error('El año lectivo no existe');
            req.anioLectivoBDD = anioLectivoBDD;
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para confirmar cuenta mediante token
const confirmarCuentaValidator = [
    check('token')
        .custom((_, { req }) => {
            if (!req.params.token) throw new Error('El token es obligatorio');
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para solicitar recuperación de contraseña
const recuperarPasswordValidator = [
    check('email')
        .notEmpty()
        .withMessage('El email es obligatorio')
        .isEmail()
        .withMessage('El email no es válido'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para comprobar token de recuperación de contraseña
const comprobarTokenPasswordValidator = [
    check('token')
        .custom((_, { req }) => {
            if (!req.params.token) throw new Error('El token es obligatorio');
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para verificar que el usuario está autenticado y cargado en req.userBDD
const perfilValidator = [
    check('userBDD').custom(async (_, { req }) => {
        if (!req.userBDD) throw new Error('Falló al procesar los datos');
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para establecer una nueva contraseña usando token
const nuevaContrasenaValidator = [
    check('token')
        .custom((_, { req }) => {
            if (!req.params.token) throw new Error('El token es obligatorio');
            return true;
        }),
    check(['password', 'confirmPassword'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    check('confirmPassword')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .custom((value, { req }) => {
            if (value !== req.body.password) throw new Error('Las contraseñas no coinciden');
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para cambiar la contraseña desde el perfil autenticado
const cambiarPasswordValidator = [
    check(['password', 'newPassword', 'confirmPassword'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    check('confirmPassword')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    check('newPassword')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .custom((newPassword, { req }) => {
            if (newPassword === req.body.password) throw new Error('La nueva contraseña debe ser diferente a la actual');
            if (newPassword !== req.body.confirmPassword) throw new Error('Las contraseñas no coinciden');
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

// Validador para cambiar datos personales (email, teléfono, dirección, nombre, apellido)
const cambiarDatosValidator = [
    check(['email', 'telefono', 'direccion'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('telefono')
        .custom((value) => {
            if (!/^\d{10}$/.test(value)) throw new Error('El teléfono debe tener exactamente 10 dígitos y solo contener números');
            return true;
        }),
    check('direccion')
        .custom((value, { req }) => {
            if (value.length < 5 || value.length > 100) throw new Error('La dirección debe tener entre 5 y 100 caracteres');
            return true;
        }),
    check('email')
        .isEmail()
        .withMessage('El email no es válido'),
    check(['nombre', 'apellido'])
        .isAlpha('es-ES', { ignore: ' ' })
        .withMessage('El nombre y apellido solo pueden contener letras'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
];

export {
    loginValidator,
    confirmarCuentaValidator,
    recuperarPasswordValidator,
    comprobarTokenPasswordValidator,
    perfilValidator,
    nuevaContrasenaValidator,
    cambiarPasswordValidator,
    cambiarDatosValidator
}