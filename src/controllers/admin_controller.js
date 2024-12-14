import { sendMailToUser } from '../config/nodemailer.js';
import Administrador from '../models/admin_model.js';
import mongoose from 'mongoose'

const registrarAdmin = async (req, res) => {
    const {nombre, apellido, email, password} = req.body;
    const nuevoAdmin = new Administrador({nombre, apellido, email, password});
    if (!nombre || !apellido || !email || !password) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const adminBDD = await Administrador.findOne({email});
    if (adminBDD) return res.status(400).json({error: 'El email ya esta registrado'})
    if (password.length < 6) return res.status(400).json({error: 'La contraseña debe tener al menos 6 caracteres'});
    nuevoAdmin.password = await nuevoAdmin.encriptarPassword(password);
    const token = await nuevoAdmin.generarToken();
    await nuevoAdmin.save();
    await sendMailToUser(email, token);
    res.status(201).json({mensaje: 'Administrador registrado, verifique el email para confirmar su cuenta'});
}

const confirmarCuenta = async (req, res) => {
    const {token} = req.params;
    if (!token) return res.status(400).json({error: 'El token es obligatorio'});
    const adminBDD = await Administrador.findOne({token})
    if (!adminBDD) return res.status(400).json({error: 'El token no es válido'});
    adminBDD.confirmEmail = true;
    adminBDD.token = null;
    await adminBDD.save();
    res.status(200).json({mensaje: 'Cuenta confirmada correctamente'});
}

const loginAdmin = async (req, res) => {
    const {email, password} = req.body;
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const adminBDD = await Administrador.findOne({email}).select('-estado');
    if (!adminBDD) return res.status(400).json({error: 'El email no esta registrado'});
    const validarPassword = await adminBDD.compararPassword(password);
    if (!validarPassword) return res.status(400).json({error: 'La contraseña es incorrecta'});
    if (adminDBB?.confirmEmail === false) return res.status(400).json({error: 'Confirma tu cuenta para poder ingresar'});
    res.status(200).json({mensaje: 'Bienvenido al sistema'});
}
export {
    registrarAdmin,
    confirmarCuenta,
    loginAdmin
}