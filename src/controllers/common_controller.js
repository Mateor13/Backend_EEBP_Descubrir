import representante from "../models/representante.js";
import profesor from "../models/profesor.js";
import administradores from "../models/administradores.js";
import aniosLectivo from "../models/anioLectivo.js";
import { generarJWT } from "../middlewares/JWT.js";
import { sendMailToChangeEmail, sendMailToRecoveryPassword, sendMailToRecoveryPasswordProfesor, sendMailToRecoveryPasswordRepresentante } from "../config/nodemailer.js";

// Determinar los modelos, roles, select y funciones de correo
const roles = [
    { model: representante, rol: "representante",correo: sendMailToRecoveryPasswordRepresentante, selected: '-_id -password -token -estudiantes -confirmEmail -estado -__v -createdAt -updatedAt' },
    { model: profesor, rol: "profesor", correo: sendMailToRecoveryPasswordProfesor, selected: '-_id -password -token -confirmEmail -admin -cursos -estado -__v -createdAt -updatedAt' },
    { model: administradores, rol: "administrador", correo: sendMailToRecoveryPassword, selected: '-_id -password -token -confirmEmail -estado -__v -createdAt -updatedAt' }
]

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
    const { password, confirmPassword } = req.body
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
    const { password, newpassword, confirmpassword } = req.body
    const { id } = req.userBDD
    //Paso 2: Realizar validaciones
    if (Object.keys(req.body).includes(' ')) return res.status(400).json({ error: 'No se permiten campos con espacios' })
    if (!password || !newpassword || !confirmpassword) return res.status(400).json({ error: 'Faltan campos por llenar' })
    if (newpassword !== confirmpassword) return res.status(400).json({ error: 'Las contraseñas no coinciden' })
    if (newpassword.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    if (password === newpassword) return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la actual' })
    const representanteBDD = await representante.findById(id)
    if (representanteBDD) {
        const verificarPassword = await representanteBDD.compararPassword(password)
        if (!verificarPassword) return res.status(400).json({ error: 'La Contraseña actual es incorrecta' })
        await representanteBDD.encriptarPassword(newpassword)
        await representanteBDD.save()
        return res.status(200).json({ mensaje: 'Contraseña actualizada' })
    }
    const profesorBDD = await profesor.findById(id)
    if (profesorBDD) {
        const verificarPassword = await profesorBDD.compararPassword(password)
        if (!verificarPassword) return res.status(400).json({ error: 'La Contraseña actual es incorrecta' })
        await profesorBDD.encriptarPassword(newpassword)
        await profesorBDD.save()
        return res.status(200).json({ mensaje: 'Contraseña actualizada' })
    }
    const adminBDD = await administradores.findById(id)
    if (adminBDD) {
        const verificarPassword = await adminBDD.compararPassword(password)
        if (!verificarPassword) return res.status(400).json({ error: 'La Contraseña actual es incorrecta' })
        await adminBDD.encriptarPassword(newpassword)
        await adminBDD.save()
        return res.status(200).json({ mensaje: 'Contraseña actualizada' })
    }
    return res.status(400).json({ error: 'Usuario no registrado' })
}

const cambiarDatos = async (req, res) => {
    //Paso 1: Extraer los datos
    const { nombre, apellido, email, telefono, direccion } = req.body
    const { id } = req.userBDD
    //Paso 2: Realizar validaciones
    if (Object.keys(req.body).includes(' ')) return res.status(400).json({ error: 'No se permiten campos con espacios' })
    if (!nombre || !apellido || !email) return res.status(400).json({ error: 'Faltan campos por llenar' })
    if (!validarEmail(email)) return res.status(400).json({ error: 'El email no es válido' })
    const representanteBDD = await representante.findById(id)
    if (representanteBDD) {
        if (!telefono || !direccion) return res.status(400).json({ error: 'Faltan campos por llenar' })
        if (telefono.length !== 10) return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos' })
        if (representanteBDD.email !== email) {
            const existeEmail = await representante.findOne({ email })
            if (existeEmail) return res.status(400).json({ error: 'El email ya está registrado' })
            await sendMailToChangeEmail(representanteBDD.email, email)
        }
        if (representanteBDD.telefono !== telefono) {
            const existeTelefono = await representante.findOne({ telefono })
            if (existeTelefono) return res.status(400).json({ error: 'El teléfono ya está registrado' })
        }
        const adminBDD = await administradores.findOne({ email })
        if (adminBDD) return res.status(400).json({ error: 'El email ya está registrado' })
        const profesorBDD = await profesor.findOne({ email })
        if (profesorBDD) return res.status(400).json({ error: 'El email ya está registrado' })
        if (representanteBDD.telefono !== telefono) {
            const existeTelefono = await representante.findOne({ telefono })
            if (existeTelefono) return res.status(400).json({ error: 'El teléfono ya está registrado' })
        }
        representanteBDD.nombre = nombre
        representanteBDD.apellido = apellido
        representanteBDD.email = email
        representanteBDD.telefono = telefono
        representanteBDD.direccion = direccion
        await representanteBDD.save()
        return res.status(200).json({ mensaje: 'Los datos se han actualizado correctamente' })
    }
    const profesorBDD = await profesor.findById(id)
    if (profesorBDD) {
        if (!telefono || !direccion) return res.status(400).json({ error: 'Faltan campos por llenar' })
        if (telefono.length !== 10) return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos' })
        if (profesorBDD.email !== email) {
            const existeEmail = await profesor.findOne({ email })
            if (existeEmail) return res.status(400).json({ error: 'El email ya está registrado' })
            await sendMailToChangeEmail(email, profesorBDD.email)
        }
        const adminBDD = await administradores.findOne({ email })
        if (adminBDD) return res.status(400).json({ error: 'El email ya está registrado' })
        const representanteBDD = await representante.findOne({ email })
        if (representanteBDD) return res.status(400).json({ error: 'El email ya está registrado' })
        if (profesorBDD.telefono !== telefono) {
            const existeTelefono = await profesor.findOne({ telefono })
            if (existeTelefono) return res.status(400).json({ error: 'El teléfono ya está registrado' })
        }
        profesorBDD.nombre = nombre
        profesorBDD.apellido = apellido
        profesorBDD.email = email
        profesorBDD.telefono = telefono
        profesorBDD.direccion = direccion
        await profesorBDD.save()
        return res.status(200).json({ mensaje: 'Los datos se han actualizado correctamente' })
    }
    const adminBDD = await administradores.findById(id)
    if (adminBDD) {
        if (adminBDD.email !== email) {
            const existeEmail = await administradores.findOne({ email })
            if (existeEmail) return res.status(400).json({ error: 'El email ya está registrado' })
            await sendMailToChangeEmail(email, adminBDD.email)
        }
        const profesorBDD = await profesor.findOne({ email })
        if (profesorBDD) return res.status(400).json({ error: 'El email ya está registrado' })
        const representanteBDD = await representante.findOne({ email })
        if (representanteBDD) return res.status(400).json({ error: 'El email ya está registrado' })
        adminBDD.nombre = nombre
        adminBDD.apellido = apellido
        adminBDD.email = email
        await adminBDD.save()
        return res.status(200).json({ mensaje: 'Los datos se han actualizado correctamente' })
    }
    return res.status(400).json({ error: 'Usuario no registrado' })
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