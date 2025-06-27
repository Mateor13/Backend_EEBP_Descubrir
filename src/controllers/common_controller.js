import representante from "../models/representante.js";
import profesor from "../models/profesor.js";
import administradores from "../models/administradores.js";
import aniosLectivo from "../models/anioLectivo.js";
import { generarJWT } from "../middlewares/JWT.js";
import { sendMailToChangeEmail, sendMailToRecoveryPassword, sendMailToRecoveryPasswordProfesor, sendMailToRecoveryPasswordRepresentante } from "../config/nodemailer.js";

// Lista de roles con su modelo, nombre, función de correo y campos a excluir en consultas
const roles = [
    { model: representante, rol: "representante", correo: sendMailToRecoveryPasswordRepresentante, selected: '-_id -password -token -estudiantes -confirmEmail -estado -__v -createdAt -updatedAt' },
    { model: profesor, rol: "profesor", correo: sendMailToRecoveryPasswordProfesor, selected: '-_id -password -token -confirmEmail -admin -cursos -estado -__v -createdAt -updatedAt' },
    { model: administradores, rol: "administrador", correo: sendMailToRecoveryPassword, selected: '-_id -password -token -confirmEmail -estado -__v -createdAt -updatedAt' }
]

// Devuelve el modelo correspondiente al rol recibido
const rolActual = (rol) => {
    const rolModelo = roles.find(r => r.rol === rol)
    return rolModelo.model
}

// Controlador para login: genera token y responde con datos básicos
const login = async (req, res) => {
    const { usuarioBDD, rol, anioLectivoBDD } = req;
    const token = generarJWT(usuarioBDD._id, rol, anioLectivoBDD._id)
    return res.status(200).json({ rol, token })
}

// Lista todos los años lectivos registrados
const listarAniosLectivos = async (req, res) => {
    const anios = await aniosLectivo.find({}).select('-__v -createdAt -updatedAt -ponderaciones -fechaInicio')
    if (!anios || anios.length === 0) return res.status(404).json({ error: 'No se encontraron años lectivos' });
    return res.status(200).json(anios)
}

// Confirma la cuenta de usuario a partir del token recibido
const confirmarCuenta = async (req, res) => {
    const { token } = req.params;
    for (const { model } of roles) {
        const userBDD = await model.findOne({ token });
        if (userBDD) {
            userBDD.confirmEmail = true;
            await userBDD.save();
            return res.status(200).json({ mensaje: 'Su cuenta se ha confirmado exitosamente, ya puede iniciar sesión' });
        }
    }
    return res.status(400).json({ error: 'El token no es válido' });
}

// Envía correo de recuperación de contraseña según el rol
const recuperarPassword = async (req, res) => {
    const { email } = req.body
    for (const { model, correo } of roles) {
        const userBDD = await model.findOne({ email });
        if (userBDD) {
            const token = await userBDD.generarToken();
            await correo(email, token);
            await userBDD.save();
            return res.status(200).json({ mensaje: 'Para recuperar su contraseña, se le ha enviado un correo' });
        }
    }
    return res.status(400).json({ error: 'No se ha encontrado el email ingresado' })
}

// Devuelve el perfil del usuario autenticado (sin datos sensibles)
const perfil = async (req, res) => {
    const { id } = req.userBDD
    for (const { model, selected } of roles) {
        const usuarioBDD = await model.findById(id).select(selected);
        if (usuarioBDD) {
            const userBDD = {
                _id: usuarioBDD._id,
                nombre: usuarioBDD.nombre,
                apellido: usuarioBDD.apellido,
                email: usuarioBDD.email,
                telefono: usuarioBDD.telefono,
                direccion: usuarioBDD.direccion,
                rol: req.userBDD.rol
            }
            return res.status(200).json(userBDD);
        }
    }
    return res.status(400).json({ error: 'Fallo en la carga de datos' });
}

// Permite establecer una nueva contraseña usando un token válido
const nuevaContrasena = async (req, res) => {
    const { password } = req.body
    const { token } = req.params
    for (const { model } of roles) {
        const userBDD = await model.findOne({ token });
        if (userBDD) {
            userBDD.token = null
            await userBDD.encriptarPassword(password)
            await userBDD.save()
            return res.status(200).json({ mensaje: 'Contraseña actualizada' });
        }
    }
    return res.status(400).json({ error: 'El token no es válido' })
}

// Permite cambiar la contraseña desde el perfil autenticado
const cambiarPassword = async (req, res) => {
    const { password, newPassword } = req.body
    const { id, rol } = req.userBDD
    const model = rolActual(rol)
    const userBDD = await model.findById(id);
    if (userBDD) {
        const verificarPassword = await userBDD.compararPassword(password);
        if (!verificarPassword) return res.status(400).json({ error: 'La Contraseña actual es incorrecta' });
        await userBDD.encriptarPassword(newPassword);
        await userBDD.save();
        return res.status(200).json({ mensaje: 'Contraseña actualizada' });
    }
    return res.status(400).json({ error: 'Error al actualizar el usuario' });
}

// Permite cambiar los datos personales del usuario autenticado
const cambiarDatos = async (req, res) => {
    const { nombre, apellido, email, telefono, direccion } = req.body
    const { id, rol } = req.userBDD
    const model = rolActual(rol)
    const userBDD = await model.findById(id)
    if (userBDD) {
        if (userBDD.email !== email) {
            for (const { model } of roles) {
                const existeEmail = await model.findOne({ email })
                if (existeEmail) return res.status(400).json({ error: 'El email ya está registrado' })
            }
            await sendMailToChangeEmail(userBDD.email, email)
        }
        if (userBDD.telefono !== telefono) {
            for (const { model } of roles) {
                const existeTelefono = await model.findOne({ telefono })
                if (existeTelefono) return res.status(400).json({ error: 'El teléfono ya está registrado' })
            }
        }
        userBDD.telefono = telefono
        userBDD.direccion = direccion
        userBDD.nombre = nombre
        userBDD.apellido = apellido
        userBDD.email = email
        await userBDD.save()
        return res.status(200).json({ mensaje: 'Los datos se han actualizado correctamente' })
    }
}

export {
    login,
    listarAniosLectivos,
    confirmarCuenta,
    recuperarPassword,
    nuevaContrasena,
    cambiarPassword,
    cambiarDatos,
    perfil
}