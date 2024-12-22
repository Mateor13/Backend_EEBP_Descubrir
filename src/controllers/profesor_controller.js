import Profesor from "../models/profesor.js"
import { sendMailToProfesor, sendMailToRecoveryPasswordProfesor } from '../config/nodemailer.js';
import { generarJWT } from '../helpers/JWT.js';
import estudiantes from "../models/estudiantes.js";


const registrarProfesor = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, email, password, direccion, telefono} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const profBDD = await Profesor.findOne({email});
    if (profBDD) return res.status(400).json({error: 'El email ya esta registrado'})
    if (password.length < 6) return res.status(400).json({error: 'La contraseña debe tener al menos 6 caracteres'});
    //Paso 3: Manipular la BDD
    const nuevoProfesor = new Profesor({nombre, apellido, email, direccion, telefono});
    nuevoProfesor.password = await nuevoProfesor.encriptarPassword(password);
    const token = await nuevoProfesor.generarToken();
    await sendMailToProfesor(email, token);
    await nuevoProfesor.save();
    res.status(201).json({msg: 'Profesor registrado, verifique el email para confirmar su cuenta'});
}

const confirmarCuenta = async (req, res) => {
    //Paso 1: Obtener el token
    const {token} = req.params;
    //Paso 2: Realizar validaciones
    if (!token) return res.status(400).json({error: 'El token es obligatorio'});
    const profBDD = await Profesor.findOne({token});
    if (!profBDD) return res.status(400).json({error: 'La cuenta ya ha sido confirmada o el token no es válido'});
    //Paso 3: Manipular la BDD
    profBDD.confirmEmail = true;
    profBDD.token = null;
    await profBDD.save();
    res.status(200).json({msg: 'Cuenta confirmada correctamente'});
}

const loginProfesor = async (req, res) => {
    //Paso 1: Obtener los datos
    const {email, password} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const profBDD = await Profesor.findOne({email}).select('-estado');
    if (!profBDD) return res.status(400).json({error: 'El email no esta registrado'});
    const validarPassword = await profBDD.compararPassword(password);
    if (!validarPassword) return res.status(400).json({error: 'La contraseña es incorrecta'});
    if (profBDD?.confirmEmail === false) return res.status(400).json({error: 'Confirma tu cuenta para poder ingresar'});
    //Paso 3: Generar JWT
    const jwt = generarJWT(profBDD._id, "profesor");
    res.status(200).json({msg: 'Bienvenido al sistema', token:jwt});
}

const recuperarPassword = async (req, res) => {
    //Paso 1: Obtener los datos
    const {email} = req.body
    //Paso 2: Realizar validaciones
    if(Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const profBDD = await Profesor.findOne({email})
    if(!profBDD) return res.status(400).json({error: 'El email no esta registrado'});
    const token = await profBDD.generarToken();
    //Paso 3: Manipular la BDD
    profBDD.token = token;
    await sendMailToRecoveryPasswordProfesor(email, token);
    await profBDD.save();
    res.status(200).json({msg: 'Revise su email para recuperar su contraseña, para reestablecer su contraseña'});
}

const comprobarTokenPassword = async (req, res) => {
    //Paso 1: Obtener el token
    const {token} = req.params;
    //Paso 2: Realizar validaciones
    if(!token) return res.status(400).json({error: 'El token es obligatorio'});
    const profBDD = await Profesor.findOne({token})
    if(profBDD?.token !== token) return res.status(400).json({error: 'El token no es válido'});
    //Paso 3: Manipular la BDD
    await profBDD.save();
    res.status(200).json({msg: 'Token válido, ya puede reestablecer su contraseña'});
}

const nuevoPassword = async (req, res) => {
    //Paso 1: Obtener los datos
    const {password, confirmpassword} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (password !== confirmpassword) return res.status(400).json({error: 'Las contraseñas no coinciden'});
    const profBDD = await Profesor.findOne({token: req.params.token});
    if (profBDD?.token !== req.params.token) return res.status(400).json({error: 'El token no es válido'});
    //Paso 3: Manipular la BDD
    profBDD.token = null
    profBDD.password = await profBDD.encriptarPassword(password);
    await profBDD.save();
    res.status(200).json({msg: 'Contraseña actualizada correctamente'});
}

const cambiarPassword = async (req, res) => {
    //Paso 1: Obtener los datos
    const {password, newpassword, confirmpassword} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (newpassword !== confirmpassword) return res.status(400).json({error: 'Las contraseñas no coinciden'});
    const profBDD = await Profesor.findById(req.adminBDD.id);
    const validarPassword = await profBDD.compararPassword(password);
    if (!validarPassword) return res.status(400).json({error: 'La contraseña actual es incorrecta'});
    if (newpassword.length < 6) return res.status(400).json({error: 'La contraseña debe tener al menos 6 caracteres'});
    if (password === newpassword) return res.status(400).json({error: 'La nueva contraseña debe ser diferente a la actual'});
    //Paso 3: Manipular la BDD
    profBDD.password = await adminiBDD.encriptarPassword(newpassword);
    await profBDD.save();
    res.status(200).json({msg: 'Contraseña actualizada correctamente'});
}

const cambiarDatos = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, email} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const profBDD = await Profesor.findById(req.adminBDD.id);
    if (!(await profBDD.validarEmail(email))) return res.status(400).json({error: 'El email no es válido'});
    if (profBDD.email !== email) {
        const existeEmail = await Profesor.findOne({email});
        if (existeEmail) return res.status(400).json({error: 'El email ya esta registrado'});
    }
    //Paso 3: Manipular la BDD
    profBDD.nombre = nombre;
    profBDD.apellido = apellido;
    profBDD.email = email;
    await profBDD.save();
    res.status(200).json({msg: 'Datos actualizados correctamente'});
}

const registrarEstudiantes = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, cedula, nombreRepresentante, telefonoRepresentante} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const nuevoEstudiante = new estudiantes({nombre, apellido, cedula, nombreRepresentante, telefonoRepresentante});
    const estudianteBDD = await estudiantes.findOne({cedula});
    if (estudianteBDD) return res.status(400).json({error: 'El estudiante ya esta registrado'});
    if (cedula.length !== 10) return res.status(400).json({error: 'La cedula debe tener 10 caracteres'});
    if (telefonoRepresentante.length !== 10) return res.status(400).json({error: 'El telefono debe tener 10 caracteres'});
    //Paso 3: Manipular la BDD
    await nuevoEstudiante.save();
    res.status(201).json({msg: 'Estudiante registrado correctamente'});
}

const registroAsistenciaEstudiantes = async (req, res) => {
    //Paso 1: Obtener Datos
    const {estudianteId, presente, justificacion} = req.body;
    //Paso 2: Realizar validaciones
    if(!estudianteId) return res.status(400).json({error: 'Especificar ID'});
    const estudianteBDD = await estudiantes.findOne({_id: estudianteId});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no registrado en esta materia'});
    //Paso 3: Manipular la BDD
    const fecha = new Date();
    const asistencia = {fecha, presente, justificacion};
    await estudianteBDD.registrarAsistencia(asistencia);
    estudianteBDD.save();
    res.status(200).json({msg: 'Asistencia registrada correctamente'});
}

const subirNotasEstudiantes  = async (req, res) => {
    //Paso 1: Obtener los datos
    const {estudianteId, nota, materia, motivo} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!estudianteId) return res.status(400).json({error: 'Especificar ID'});
    if (!materia) return res.status(400).json({error: 'Especificar materia'});
    if (!nota) return res.status(400).json({error: 'Especificar nota'});
    if (!motivo) return res.status(400).json({error: 'Especificar motivo'});
    const estudianteBDD = await estudiantes.findOne({_id: estudianteId});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no registrado en esta materia'});
    if (nota <= 0 || nota >= 10) return res.status(400).json({error: 'La nota debe estar entre 0 y 10'});
    //Paso 3: Manipular la BDD
    const asignacion = {nota, motivo};
    const subirNota = await estudianteBDD.registrarNota(materia, asignacion);
    if (subirNota.error) return res.status(400).json(subirNota.error);
    estudianteBDD.save();
    res.status(200).json({msg: 'Nota registrada correctamente'});
}

const modificarNotasEstudiantes = async (req, res) => {
    //Pasos 1: Obtener los datos
    const {estudianteId, materia, idTrabajo, nuevaNota} = req.body;
    //Pasos 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!estudianteId) return res.status(400).json({error: 'Especificar ID'});
    if (!materia) return res.status(400).json({error: 'Especificar materia'});
    if (!idTrabajo) return res.status(400).json({error: 'Especificar ID de la nota'});
    if (!nuevaNota) return res.status(400).json({error: 'Especificar nueva nota'});
    const estudianteBDD = await estudiantes.findOne({_id: estudianteId});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no registrado en esta materia'});
    if (nuevaNota <= 0 || nuevaNota >= 10) return res.status(400).json({error: 'La nota debe estar entre 0 y 10'});
    //Paso 3: Manipular la BDD
    const actualizarNota = await estudianteBDD.actualizarNota(materia, idTrabajo, nuevaNota);
    if (actualizarNota.error) return res.status(400).json(actualizarNota.error);
    estudianteBDD.save();
    res.status(200).json({msg: 'Nota actualizada correctamente'});
}

const observacionesEstudiantes  = async (req, res) => {
    //Paso 1: Obtener los datos
    const {estudianteId, observacion} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!estudianteId) return res.status(400).json({error: 'Especificar ID'});
    if (!observacion) return res.status(400).json({error: 'Especificar observacion'});
    const estudianteBDD = await estudiantes.findOne({_id: estudianteId});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no registrado en esta materia'});
    //Paso 3: Manipular la BDD
    const fecha = new Date();
    const nuevaObservacion = {fecha, observacion};
    await estudianteBDD.registrarObservacion(nuevaObservacion);
    estudianteBDD.save();
    res.status(200).json({msg: 'Observación registrada correctamente'});
}


export  {
    registrarProfesor,
    confirmarCuenta,
    loginProfesor,
    recuperarPassword,
    comprobarTokenPassword,
    nuevoPassword,
    cambiarDatos,
    cambiarPassword,
    registrarEstudiantes,
    registroAsistenciaEstudiantes,
    subirNotasEstudiantes,
    modificarNotasEstudiantes,
    observacionesEstudiantes
}