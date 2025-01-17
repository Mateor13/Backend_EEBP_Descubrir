import Representante from "../models/representante.js";
import { generarJWT } from "../helpers/JWT.js";
import { sendMailToRecoveryPasswordRepresentante } from "../config/nodemailer.js";

const validarEmail = (email) => {
    const regExp = new RegExp(/\S+@\S+\.\S+/)
    return regExp.test(email)
}

const validarCurso = (curso) => {
    const regExp = new RegExp(/^[0-7][A-E]$/)
    return regExp.test(curso)
}
const validarFecha = (fecha) => {
    const regExp = new RegExp(/^\d{4}\/\d\/\d{2}$/);
    return regExp.test(fecha);
};

const loginRepresentante = async (req, res) => {
    // Paso 1: Toma de datos
    const { email, password } = req.body;
    // Paso 2: Validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (!email) return res.status(400).json({ error: 'Especifique el email' });
    if (!password) return res.status(400).json({ error: 'Especifique una contraseña' });
    const representanteBDD = await Representante.findOne({ email });
    if (!representanteBDD) return res.status(404).json({ error: 'El email no está registrado' });
    const validarPassword = await representanteBDD.compararPassword(password);
    if (!validarPassword) return res.status(400).json({ error: 'Contraseña inválida' });
    // Paso 3: Manipular BDD
    const jwt = generarJWT(representanteBDD._id, 'representante');
    res.status(200).json({ msg: `Bienvenid@ estimad@ ${representanteBDD.nombre} ${representanteBDD.apellido}`, token: jwt });
};

const confirmarCuenta = async (req, res) => {
    //Paso 1: Obtener el token
    const {token} = req.params;
    //Paso 2: Realizar validaciones
    if (!token) return res.status(400).json({error: 'El token es obligatorio'});
    const repreBDD = await Representante.findOne({token});
    if (!repreBDD) return res.status(400).json({error: 'La cuenta ya ha sido confirmada o el token no es válido'});
    //Paso 3: Manipular la BDD
    repreBDD.confirmEmail = true;
    repreBDD.token = null;
    await repreBDD.save();
    res.status(200).json({msg: 'Cuenta confirmada correctamente'});
}

const recuperarContrasena = async (req, res) => {
    //Paso 1: Toma de datos
    const {email} = req.body
    //Paso 2: Validaciones
    if(Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'})
    if (!email) return res.status(400).json({error: 'Especifique el email'})
    const representanteBDD = Representante.findOne({email})
    if (!representanteBDD) return res.status(404).json({error: 'El email no está registrado'})
    //Paso 3: Manipular BDD
    const token = representanteBDD.generarToken()
    await sendMailToRecoveryPasswordRepresentante(email, token)
    res.status(200).json({msg: 'Se ha enviado un correo para recuperar la contraseña'})
}

const comprobarTokenPassword = async (req, res) => {
    //Paso 1: Obtener el token
    const {token} = req.params;
    //Paso 2: Realizar validaciones
    if (!token) return res.status(400).json({error: 'El token es obligatorio'});
    const repreBDD = await Representante.findOne({token});
    if (repreBDD?.token !== token) return res.status(400).json({error: 'El token no es válido'});
    //Paso 3: Manipular la BDD
    await repreBDD.save();
    res.status(200).json({msg: 'Token válido, ya puede reestablecer su contraseña'});
}

const nuevaContrasenaRepresentante = async (req, res) => {
    //Paso 1: Obtener el token
    const {token} = req.params;
    const {password, confirmPassword} = req.body;
    //Paso 2: Realizar validaciones
    if (!token) return res.status(400).json({error: 'El token es obligatorio'});
    if (Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!(password.equals(confirmPassword))) return res.status(400).json({error: 'Las contraseñas no coinciden'});
    if (password.length < 8) return res.status(400).json({error: 'La contraseña debe tener al menos 8 caracteres'});
    const repreBDD = await Representante.findOne({token})
    if (repreBDD?.token !== token) return res.status(400).json({error: 'El token no es válido'});
    //Paso 3: Manipular la BDD
    repreBDD.token = null;
    repreBDD.encriptarPassword(password);
    await repreBDD.save();
    res.status(200).json({msg: 'Contraseña actualizada correctamente'});
}

const cambiarPassword = async (req, res) => {
    //Paso 1: Toma de datos
    const {password, newPassword, newPasswordConfirm} = req.body;
    const {id} = req.userBDD;
    //Paso 2: Validaciones
    if (Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!(newPassword.equals(newPasswordConfirm))) return res.status(400).json({error: 'Las contraseñas no coinciden'});
    if (newPassword.length < 8) return res.status(400).json({error: 'La contraseña debe tener al menos 8 caracteres'});
    const representanteBDD = await Representante.findById(id);
    if (!representanteBDD) return res.status(404).json({error: 'El representante no está registrado'});
    const validarPassword = await representanteBDD.compararPassword(password);
    if (!validarPassword) return res.status(400).json({error: 'Contraseña inválida'});
    //Paso 3: Manipular BDD
    representanteBDD.encriptarPassword(newPassword);
    await representanteBDD.save();
    res.status(200).json({msg: 'Contraseña actualizada correctamente'});
}

const cambiarDatos = async (req, res) => {
    //Paso 1: Toma de datos
    const {nombre, apellido, email, telefono, direccion} = req.body;
    const {id} = req.userBDD;
    //Paso 2: Validaciones
    if (Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const representanteBDD = await Representante.findById(id);
    if (!representanteBDD) return res.status(404).json({error: 'El representante no está registrado'});
    if (telefono.length !== 10) return res.status(400).json({error: 'El teléfono debe tener 10 dígitos'});
    if (validarEmail(email)) return res.status(400).json({error: 'El email no es válido'});
    if (representanteBDD.email !== email) {
        const existeEmail = await Representante.findOne({email});
        if (existeEmail) return res.status(400).json({error: 'El email ya está registrado'});
    }
    if (representanteBDD.telefono !== telefono) {
        const existeTelefono = await Representante.findOne({telefono});
        if (existeTelefono) return res.status(400).json({error: 'El teléfono ya está registrado'});
    }
    //Paso 3: Manipular BDD
    representanteBDD.nombre = nombre;
    representanteBDD.apellido = apellido;
    representanteBDD.email = email;
    representanteBDD.telefono = telefono;
    representanteBDD.direccion = direccion;
    await representanteBDD.save();
    res.status(200).json({msg: 'Datos actualizados correctamente'});
}

export {
    loginRepresentante,
    confirmarCuenta,
    recuperarContrasena,
    comprobarTokenPassword,
    nuevaContrasenaRepresentante,
    cambiarPassword,
    cambiarDatos
};