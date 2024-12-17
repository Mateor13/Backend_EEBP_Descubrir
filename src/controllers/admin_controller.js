import { sendMailToRecoveryPassword, sendMailToUser } from '../config/nodemailer.js';
import { generarJWT } from '../helpers/JWT.js';
import Administrador from '../models/administrador.js';


const registrarAdmin = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, email, password} = req.body;
    //Paso 2: Realizar validaciones
    const nuevoAdmin = new Administrador({nombre, apellido, email, password});
    if (Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!(await nuevoAdmin.validarEmail(email))) return res.status(400).json({error: 'El email no es válido'});
    const adminBDD = await Administrador.findOne({email});
    if (adminBDD) return res.status(400).json({error: 'El email ya esta registrado'})
    if (password.length < 6) return res.status(400).json({error: 'La contraseña debe tener al menos 6 caracteres'});
    //Paso 3: Manipular la BDD
    nuevoAdmin.password = await nuevoAdmin.encriptarPassword(password);
    const token = await nuevoAdmin.generarToken();
    nuevoAdmin.token = token;
    await sendMailToUser(email, token);
    await nuevoAdmin.save();
    res.status(201).json({msg: 'Administrador registrado, verifique el email para confirmar su cuenta'});
}

const confirmarCuenta = async (req, res) => {
    //Paso 1: Obtener el token
    const {token} = req.params;
    //Paso 2: Realizar validaciones
    if (!token) return res.status(400).json({error: 'El token es obligatorio'});
    const adminBDD = await Administrador.findOne({token});
    if (!adminBDD) return res.status(400).json({error: 'La cuenta ya ha sido confirmada o el token no es válido'});
    //Paso 3: Manipular la BDD
    adminBDD.confirmEmail = true;
    adminBDD.token = null;
    await adminBDD.save();
    res.status(200).json({msg: 'Cuenta confirmada correctamente'});
}

const loginAdmin = async (req, res) => {
    //Paso 1: Obtener los datos
    const {email, password} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const adminBDD = await Administrador.findOne({email}).select('-estado');
    if (!adminBDD) return res.status(400).json({error: 'El email no esta registrado'});
    const validarPassword = await adminBDD.compararPassword(password);
    if (!validarPassword) return res.status(400).json({error: 'La contraseña es incorrecta'});
    if (adminBDD?.confirmEmail === false) return res.status(400).json({error: 'Confirma tu cuenta para poder ingresar'});
    //Paso 3: Generar JWT
    const jwt = generarJWT(adminBDD._id, "administrador");
    res.status(200).json({msg: 'Bienvenido al sistema', token:jwt});
}

const recuperarPassword = async (req, res) => {
    //Paso 1: Obtener los datos
    const {email} = req.body
    //Paso 2: Realizar validaciones
    if(Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if(!validarEmail(email)) return res.status(400).json({error: 'El email no es válido'});
    const adminBDD = await Administrador.findOne({email})
    if(!adminBDD) return res.status(400).json({error: 'El email no esta registrado'});
    const token = await adminBDD.generarToken();
    //Paso 3: Manipular la BDD
    adminBDD.token = token;
    await sendMailToRecoveryPassword(email, token);
    await adminBDD.save();
    res.status(200).json({msg: 'Revise su email para recuperar su contraseña, para reestablecer su contraseña'});
}

const comprobarTokenPassword = async (req, res) => {
    //Paso 1: Obtener el token
    const {token} = req.params;
    //Paso 2: Realizar validaciones
    if(!token) return res.status(400).json({error: 'El token es obligatorio'});
    const adminBDD = await Administrador.findOne({token})
    if(adminBDD?.token !== token) return res.status(400).json({error: 'El token no es válido'});
    //Paso 3: Manipular la BDD
    await adminBDD.save();
    res.status(200).json({msg: 'Token válido, ya puede reestablecer su contraseña'});
}

const nuevoPassword = async (req, res) => {
    //Paso 1: Obtener los datos
    const {password, confirmpassword} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (password !== confirmpassword) return res.status(400).json({error: 'Las contraseñas no coinciden'});
    const adminBDD = await Administrador.findOne({token: req.params.token});
    if (adminBDD?.token !== req.params.token) return res.status(400).json({error: 'El token no es válido'});
    //Paso 3: Manipular la BDD
    adminBDD.token = null
    adminBDD.password = await adminBDD.encriptarPassword(password);
    await adminBDD.save();
    res.status(200).json({msg: 'Contraseña actualizada correctamente'});
}

const cambiarPassword = async (req, res) => {
    //Paso 1: Obtener los datos
    const {password, newpassword, confirmpassword} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (newpassword !== confirmpassword) return res.status(400).json({error: 'Las contraseñas no coinciden'});
    const adminiBDD = await Administrador.findById(req.adminBDD.id);
    const validarPassword = await adminiBDD.compararPassword(password);
    if (!validarPassword) return res.status(400).json({error: 'La contraseña actual es incorrecta'});
    if (newpassword.length < 6) return res.status(400).json({error: 'La contraseña debe tener al menos 6 caracteres'});
    if (password === newpassword) return res.status(400).json({error: 'La nueva contraseña debe ser diferente a la actual'});
    //Paso 3: Manipular la BDD
    adminiBDD.password = await adminiBDD.encriptarPassword(newpassword);
    await adminiBDD.save();
    res.status(200).json({msg: 'Contraseña actualizada correctamente'});
}

const cambiarDatos = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, email} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const adminBDD = await Administrador.findById(req.adminBDD.id);
    if (!(await adminBDD.validarEmail(email))) return res.status(400).json({error: 'El email no es válido'});
    if (adminBDD.email !== email) {
        const existeEmail = await Administrador.findOne({email});
        if (existeEmail) return res.status(400).json({error: 'El email ya esta registrado'});
    }
    //Paso 3: Manipular la BDD
    adminBDD.nombre = nombre;
    adminBDD.apellido = apellido;
    adminBDD.email = email;
    await adminBDD.save();
    res.status(200).json({msg: 'Datos actualizados correctamente'});
}

export {
    registrarAdmin,
    confirmarCuenta,
    loginAdmin,
    recuperarPassword,
    comprobarTokenPassword,
    nuevoPassword,
    cambiarPassword,
    cambiarDatos
}