import representante from "../models/representante.js";
import profesor from "../models/profesor.js";
import administradores from "../models/administradores.js";
import aniosLectivo from "../models/anioLectivo.js";
import { generarJWT } from "../middlewares/JWT.js";
import { sendMailToChangeEmail, sendMailToRecoveryPassword, sendMailToRecoveryPasswordProfesor, sendMailToRecoveryPasswordRepresentante } from "../config/nodemailer.js";

// Determinar los modelos, roles, select y funciones de correo
const roles = [
    { model: representante, rol: "representante", correo: sendMailToRecoveryPasswordRepresentante, selected: '-_id -password -token -estudiantes -confirmEmail -estado -__v -createdAt -updatedAt' },
    { model: profesor, rol: "profesor", correo: sendMailToRecoveryPasswordProfesor, selected: '-_id -password -token -confirmEmail -admin -cursos -estado -__v -createdAt -updatedAt' },
    { model: administradores, rol: "administrador", correo: sendMailToRecoveryPassword, selected: '-_id -password -token -confirmEmail -estado -__v -createdAt -updatedAt' }
]

const rolActual = (rol) => {
    const rolModelo = roles.find(r => r.rol === rol)
    return rolModelo.model
}

const login = async (req, res) => {
    //Paso 1: Extraer los datos
    const { email, password, anioLectivo } = req.body
    //Paso 2: Realizar validaciones
    const anioLectivoBDD = await aniosLectivo.findOne({ periodo: anioLectivo })
    for (const { model, rol } of roles) {
        const userBDD = await model.findOne({ email });
        if (userBDD) {
            const token = generarJWT(userBDD._id, rol, anioLectivoBDD.estado)
            return res.status(200).json({ mensaje: `Bienvenido ${userBDD.nombre} ${userBDD.apellido}`, token })
        }
    }
}

const confirmarCuenta = async (req, res) => {
    // Paso 1: Extraer los datos 
    const { token } = req.params;
    // Paso 2: Buscar en la base de datos
    for (const { model } of roles) {
        const userBDD = await model.findOne({ token });
        if (userBDD) {
            // Paso 3: Manipular los datos
            userBDD.confirmEmail = true;
            userBDD.token = null;
            await userBDD.save();
            return res.status(200).json({ mensaje: 'Su cuenta se ha confirmado exitosamente, ya puede iniciar sesión' });
        }
        return res.status(400).json({ error: 'El token no es válido' });
    }
}

const recuperarPassword = async (req, res) => {
    //Paso 1: Extraer los datos
    const { email } = req.body

    //Paso 2: Buscar en la base de datos
    for (const { model, correo } of roles) {
        const userBDD = await model.findOne({ email });
        if (userBDD) {
            // Paso 3: Manipular los datos
            const token = await userBDD.generarToken();
            await correo(email, token);
            await userBDD.save();
            return res.status(200).json({ mensaje: 'Para recuperar su contraseña, se le ha enviado un correo' });
        }
    }
    return res.status(400).json({ error: 'No se ha encontrado el email ingresado' })
}

const comprobarTokenPassword = async (req, res) => {
    //Paso 1: Extraer los datos
    const { token } = req.params
    //Paso 2: Buscar en la base de datos
    for (const { model } of roles) {
        const userBDD = await model.findOne({ token });
        if (userBDD) {
            return res.status(200).json({ mensaje: 'Este token es válido' });
        }
        return res.status(400).json({ error: 'Este token no es válido' });
    }
}

const perfil = async (req, res) => {
    //Paso 1: Extraer los datos
    const { id } = req.userBDD
    //Paso 2: Buscar en la base de datos
    for (const { model, selected } of roles) {
        const userBDD = await model.findById(id).select(selected);
        if (userBDD) {
            return res.status(200).json(userBDD);
        }
        return res.status(400).json({ error: 'Fallo en la carga de datos' });
    }
}

const nuevaContrasena = async (req, res) => {
    //Paso 1: Extraer los datos
    const { password } = req.body
    const { token } = req.params
    //Paso 2: Buscar en la base de datos
    for (const { model } of roles) {
        const userBDD = await model.findOne({ token });
        if (userBDD) {
            // Paso 3: Manipular los datos
            userBDD.token = null
            await userBDD.encriptarPassword(password)
            await userBDD.save()
            return res.status(200).json({ mensaje: 'Contraseña actualizada' });
        }
    }
    return res.status(400).json({ error: 'El token no es válido' })
}

const cambiarPassword = async (req, res) => {
    //Paso 1: Extraer los datos
    const { password, newpassword } = req.body
    const { id } = req.userBDD
    //Paso 2: Buscar en la base de datos
    for (const { model } of roles) {
        const userBDD = await model.findById(id);
        if (userBDD) {
            const verificarPassword = await userBDD.compararPassword(password);
            if (!verificarPassword) return res.status(400).json({ error: 'La Contraseña actual es incorrecta' });
            await userBDD.encriptarPassword(newpassword);
            await userBDD.save();
            return res.status(200).json({ mensaje: 'Contraseña actualizada' });
        }
    }
    return res.status(400).json({ error: 'Error al actualizar el usuario' });
}

const cambiarDatos = async (req, res) => {
    //Paso 1: Extraer los datos
    const { nombre, apellido, email, telefono, direccion } = req.body
    const { id, rol } = req.userBDD
    //Paso 2: Buscar y cambiar en la base de datos
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
        if (rol === 'representante' || rol === 'profesor') {
            if (userBDD.telefono !== telefono) {
                for (const { model } of roles) {
                    const existeTelefono = await model.findOne({ telefono })
                    if (existeTelefono) return res.status(400).json({ error: 'El teléfono ya está registrado' })
                }
                userBDD.telefono = telefono
            }
            userBDD.direccion = direccion
        }
        userBDD.nombre = nombre
        userBDD.apellido = apellido
        userBDD.email = email
        await userBDD.save()
        return res.status(200).json({ mensaje: 'Los datos se han actualizado correctamente' })
    }
}

export {
    login,
    confirmarCuenta,
    recuperarPassword,
    comprobarTokenPassword,
    nuevaContrasena,
    cambiarPassword,
    cambiarDatos,
    perfil
}