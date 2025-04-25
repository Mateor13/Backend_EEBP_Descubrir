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
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]


const seleccionarAnioLectivoValidator = [
    check('anioLectivo')
        .custom(async (_, { req }) => {
            const anioLectivoBDD = await aniosLectivo.find().select('-__v -createdAt -updatedAt -cursos');
            if (!anioLectivoBDD || anioLectivoBDD.length === 0) throw new Error('No hay años lectivos registrados');
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
            if (req.body.password !== req.body.confirmPassword) throw new Error('Las contraseñas no coinciden');
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        next();
    }
]

const cambiarDatosValidator = [
    check(['nombre', 'apellido', 'email'])
        .notEmpty()
        .withMessage('Todos los campos son obligatorios'),
    check('telefono')
        .optional()
        .custom((value, { req }) => {
            const { rol } = req.userBDD;
            if (rol === 'representante' || rol === 'profesor') {
                if (!value) throw new Error('Todos los campos son obligatorios');
                if (!/^\d{10}$/.test(value)) throw new Error('El teléfono debe tener exactamente 10 dígitos y solo contener números');
            }
            return true;
        }),
    check('direccion')
        .optional()
        .custom((value, { req }) => {
            const { rol } = req.userBDD;
            if (rol === 'representante' || rol === 'profesor') {
                if (!value) throw new Error('Todos los campos son obligatorios');
                if (value.length < 5 || value.length > 100) throw new Error('La dirección debe tener entre 5 y 100 caracteres');
            }
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
    seleccionarAnioLectivoValidator,
    confirmarCuentaValidator,
    recuperarPasswordValidator,
    comprobarTokenPasswordValidator,
    perfilValidator,
    nuevaContrasenaValidator,
    cambiarPasswordValidator,
    cambiarDatosValidator
}