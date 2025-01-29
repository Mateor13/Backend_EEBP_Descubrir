import representante from "../models/representante.js";
import profesor from "../models/profesor.js";
import administradores from "../models/administradores.js";
import { generarJWT } from "../helpers/JWT.js";
import { sendMailToRecoveryPassword, sendMailToRecoveryPasswordProfesor, sendMailToRecoveryPasswordRepresentante } from "../config/nodemailer.js";

const validarEmail = (email) => {
    const regExp = new RegExp(/\S+@\S+\.\S+/)
    return regExp.test(email)
}

const login = async (req, res) => {
    //Paso 1: Extraer los datos
    const { email, password } = req.body
    //Paso 2: Realizar validaciones
    if (Object.keys(req.body).includes(' ')) return res.status(400).json({ error: 'No se permiten campos con espacios' })
    if (!email || !password) return res.status(400).json({ error: 'Faltan campos por llenar' })
    const representanteBDD = await representante.findOne({email});
    if (representanteBDD) {
        if (!representanteBDD.confirmEmail) return res.status(400).json({ error: 'Por favor confirme su cuenta'})
        const verificarPassword = await representanteBDD.compararPassword(password)
        if (!verificarPassword) return res.status(400).json({ error: 'Contraseña incorrecta' })
        const token = generarJWT(representanteBDD._id, 'representante')
        return res.status(200).json({ mensaje: `Bienvenido representante ${representanteBDD.nombre} ${representanteBDD.apellido}`, token })
    }
    const profesorBDD = await profesor.findOne({email});
    if (profesorBDD) {
        if (!profesorBDD.confirmEmail) return res.status(400).json({ error: 'Por favor confirme su cuenta'})
        const verificarPassword = await profesorBDD.compararPassword(password)
        if (!verificarPassword) return res.status(400).json({ error: 'Contraseña incorrecta' })
        const token = generarJWT(profesorBDD._id, 'profesor')
        return res.status(200).json({ mensaje: `Bienvenido profesor/a ${profesorBDD.nombre} ${profesorBDD.apellido}`, token })
    }
    const adminBDD = await administradores.findOne({email})
    if (adminBDD) {
        if (!adminBDD.confirmEmail) return res.status(400).json({ error: 'Por favor confirme su cuenta'})
        const verificarPassword = await adminBDD.compararPassword(password)
        if (!verificarPassword) return res.status(400).json({ error: 'Contraseña incorrecta' })
        const token = generarJWT(adminBDD._id, 'administrador')
        return res.status(200).json({ mensaje: `Bienvenido administrador/a ${adminBDD.nombre} ${adminBDD.apellido}`, token })
    }
    return res.status(400).json({ error: 'Email no registrado' })
}

const confirmarCuenta = async (req, res) => {
    //Paso 1: Extraer los datos
    const { token } = req.params
    //Paso 2: Realizar validaciones
    if (!token) return res.status(400).json({ error: 'Faltan campos por llenar' })
    const representanteBDD = await representante.findOne({token});
    if (representanteBDD) {
        representanteBDD.confirmEmail = true
        representanteBDD.token = null
        await representanteBDD.save()
        return res.status(200).json({ mensaje: 'Cuenta confirmada' })
    }
    const profesorBDD = await profesor.findOne({token});
    if (profesorBDD) {
        profesorBDD.confirmEmail = true
        profesorBDD.token = null
        await profesorBDD.save()
        return res.status(200).json({ mensaje: 'Cuenta confirmada' })
    }
    const adminBDD = await administradores.findOne({token})
    if (adminBDD) {
        adminBDD.confirmEmail = true
        adminBDD.token = null
        await adminBDD.save()
        return res.status(200).json({ mensaje: 'Cuenta confirmada' })
    }
    return res.status(400).json({ error: 'Token no registrado' })
}

const recuperarPassword = async (req, res) => {
    //Paso 1: Extraer los datos
    const { email } = req.body
    //Paso 2: Realizar validaciones
    if (Object.keys(req.body).includes('')) return res.status(400).json({ error: 'No se permiten campos vacios' })
    if (!email) return res.status(400).json({ error: 'Faltan campos por llenar' })
    const representanteBDD = await representante.findOne({email})
    if (representanteBDD) {
        const token = await representanteBDD.generarToken()
        await sendMailToRecoveryPasswordRepresentante(email, token)
        await representanteBDD.save()
        return res.status(200).json({ mensaje: 'Correo enviado' })
    }
    const profesorBDD = await profesor.findOne({email})
    if (profesorBDD) {
        const token = await profesorBDD.generarToken()
        await sendMailToRecoveryPasswordProfesor(email, token)
        await profesorBDD.save()
        return res.status(200).json({ mensaje: 'Correo enviado' })
    }
    const adminBDD = await administradores.findOne({email})
    if (adminBDD) {
        const token = await adminBDD.generarToken()
        await sendMailToRecoveryPassword(email, token)
        await adminBDD.save()
        return res.status(200).json({ mensaje: 'Correo enviado' })
    }
    return res.status(400).json({ error: 'Email no registrado' })
}

const comprobarTokenPassword = async (req, res) => {
    //Paso 1: Extraer los datos
    const { token } = req.params
    //Paso 2: Realizar validaciones
    if (!token) return res.status(400).json({ error: 'Faltan campos por llenar' })
    const representanteBDD = await representante.findOne({token})
    if (representanteBDD) {
        if (representanteBDD.token !== token) return res.status(400).json({ error: 'Token no válido' })
        return res.status(200).json({ mensaje: 'Token válido' })
    }
    const profesorBDD = await profesor.findOne({token})
    if (profesorBDD) {
        if (profesorBDD.token !== token) return res.status(400).json({ error: 'Token no válido' })
        return res.status(200).json({ mensaje: 'Token válido' })
    }
    const adminBDD = await administradores.findOne({token})
    if (adminBDD) {
        if (adminBDD.token !== token) return res.status(400).json({ error: 'Token no válido' })
        return res.status(200).json({ mensaje: 'Token válido' })
    }
    return res.status(400).json({ error: 'Token no registrado' })
}

const nuevaContrasena = async (req, res) => {
    //Paso 1: Extraer los datos
    const { password, confirmPassword } = req.body
    const { token } = req.params
    //Paso 2: Realizar validaciones
    if (Object.keys(req.body).includes('')) return res.status(400).json({ error: 'No se permiten campos con espacios' })    
    if (!password || !confirmPassword) return res.status(400).json({ error: 'Faltan campos por llenar' })
    if (password !== confirmPassword) return res.status(400).json({ error: 'Las contraseñas no coinciden' })
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' }    )
    const representanteBDD = await representante.findOne({token})
    if (representanteBDD) {
        if (representanteBDD.token !== token) return res.status(400).json({ error: 'Token no válido' })
        representanteBDD.token = null
        await representanteBDD.encriptarPassword(password)
        await representanteBDD.save()
        return res.status(200).json({ mensaje: 'Contraseña actualizada' })
    }
    const profesorBDD = await profesor.findOne({token})
    if (profesorBDD) {
        if (profesorBDD.token !== token) return res.status(400).json({ error: 'Token no válido' })
        profesorBDD.token = null
        await profesorBDD.encriptarPassword(password)
        await profesorBDD.save()
        return res.status(200).json({ mensaje: 'Contraseña actualizada' })
    }
    const adminBDD = await administradores.findOne({token})
    if (adminBDD) {
        if (adminBDD.token !== token) return res.status(400).json({ error: 'Token no válido' })
        adminBDD.token = null
        await adminBDD.encriptarPassword(password)
        await adminBDD.save()
        return res.status(200).json({ mensaje: 'Contraseña actualizada' })
    }
    return res.status(400).json({ error: 'Token no registrado' })
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
        return res.status(200).json({ mensaje: 'Datos actualizados' })
    }
    const profesorBDD = await profesor.findById(id)
    if (profesorBDD){
        if (!telefono || !direccion) return res.status(400).json({ error: 'Faltan campos por llenar' })
        if (telefono.length !== 10) return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos' })
        if (profesorBDD.email !== email) {
            const existeEmail = await profesor.findOne({ email })
            if (existeEmail) return res.status(400).json({ error: 'El email ya está registrado' })
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
        return res.status(200).json({ mensaje: 'Datos actualizados' })
    }
    const adminBDD = await administradores.findById(id)
    if (adminBDD){
        if (adminBDD.email !== email) {
            const existeEmail = await administradores.findOne({ email })
            if (existeEmail) return res.status(400).json({ error: 'El email ya está registrado' })
        }
        const profesorBDD = await profesor.findOne({ email })
        if (profesorBDD) return res.status(400).json({ error: 'El email ya está registrado' })
        const representanteBDD = await representante.findOne({ email })
        if (representanteBDD) return res.status(400).json({ error: 'El email ya está registrado' })
        adminBDD.nombre = nombre
        adminBDD.apellido = apellido
        adminBDD.email = email
        await adminBDD.save()
        return res.status(200).json({ mensaje: 'Datos actualizados' })
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
    cambiarDatos
}