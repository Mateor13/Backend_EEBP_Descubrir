import Profesor from "../models/profesor.js"
import { envioCredenciales, sendMailToProfesor, sendMailToRecoveryPasswordProfesor, estudianteRegistrado } from '../config/nodemailer.js';
import { generarJWT } from '../helpers/JWT.js';
import estudiantes from "../models/estudiantes.js";
import representantes from "../models/representante.js";
import materias from "../models/materias.js";
import asistencia from "../models/asistencia.js";
import observaciones from "../models/observaciones.js";
import cursos from "../models/cursos.js";

//Funciones de validación
const validarCurso = (curso) => {
    const regExp = new RegExp(/^[0-7][A-E]$/)
    return regExp.test(curso)
}
const validarFecha = (fecha) => {
    const regExp = new RegExp(/^\d{4} - \d{2} - \d{2}$/);
    return regExp.test(fecha);
};

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
    const profBDD = await Profesor.findById(req.userBDD.id);
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
    const profBDD = await Profesor.findById(req.userBDD.id);
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

const subirNotasEstudiantes  = async (req, res) => {
    //Paso 1: Obtener los datos
    const {cedula, nota, materia, motivo} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!cedula) return res.status(400).json({error: 'Especificar cédula estudiante'});
    if (!materia) return res.status(400).json({error: 'Especificar materia'});
    if (!nota) return res.status(400).json({error: 'Especificar nota o que diferente de 0'});
    if (!motivo) return res.status(400).json({error: 'Especificar motivo'});
    const estudianteBDD = await materias.findOne({cedula});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no está registrado'});
    if (nota < 0 || nota > 10.0) return res.status(400).json({error: 'La nota debe estar entre 0.1 y 10'});
    //Paso 3: Manipular la BDD
    const subirNota = await estudianteBDD.agregarNota(materia, motivo, nota);
    if (subirNota?.error) return res.status(400).json({error: subirNota.error});
    estudianteBDD.save();
    res.status(200).json({msg: 'Nota registrada correctamente'});
}

const modificarNotasEstudiantes = async (req, res) => {
    //Pasos 1: Obtener los datos
    const {cedula, materia, motivo, nuevaNota} = req.body;
    //Pasos 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!cedula) return res.status(400).json({error: 'Especificar cedula estudiante'});
    if (!materia) return res.status(400).json({error: 'Especificar materia'});
    if (!motivo) return res.status(400).json({error: 'Especificar el motivo de la nota'});
    if (!nuevaNota) return res.status(400).json({error: 'Especificar nueva nota'});
    if (nuevaNota <= 0 || nuevaNota >= 10) return res.status(400).json({error: 'La nota debe estar entre 0 y 10'});
    const estudianteBDD = await materias.findOne({cedula});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no registrado en esta materia'});
    //Paso 3: Manipular la BDD
    const actualizarNota = await estudianteBDD.actualizarNota(materia, motivo, nuevaNota);
    if (actualizarNota?.error) return res.status(400).json({error: actualizarNota.error});
    estudianteBDD.save();
    res.status(200).json({msg: 'Nota actualizada correctamente'});
}

const observacionesEstudiantes  = async (req, res) => {
    //Paso 1: Obtener los datos
    const {cedula, observacion} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!cedula) return res.status(400).json({error: 'Especificar cédula estudiante'});
    if (!observacion) return res.status(400).json({error: 'Especificar observacion'});
    const estudianteBDD = await observaciones.findOne({cedula});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no registrado en esta materia'});
    //Paso 3: Manipular la BDD
    const profesorBDD = await Profesor.findById(req.userBDD.id);
    const fecha = new Date();
    const nuevaObservacion = {fecha, observacion, autor: profesorBDD.nombre};
    await estudianteBDD.registrarObservacion(nuevaObservacion);
    estudianteBDD.save();
    res.status(200).json({msg: 'Observación registrada correctamente'});
}

const justificacionesEstudiantes = async (req, res) => {
    //Paso 1: Obtener los datos
    const {cedula, fecha, justificacion} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!cedula) return res.status(400).json({error: 'Especificar cédula estudiante'});
    if (!fecha) return res.status(400).json({error: 'Especificar fecha'});
    if (!justificacion) return res.status(400).json({error: 'Especificar justificación'});
    if (!validarFecha(fecha)) return res.status(400).json({error: 'La fecha no es válida, el formato es "aaaa - mm - dd"'});
    const estudianteBDD = await asistencia.findOne({cedula});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no registrado en esta materia'});
    //Paso 3: Manipular la BDD
    const justificar = await estudianteBDD.justificarInasistencia(fecha, justificacion);
    if (justificar?.error) return res.status(400).json({error: justificar.error});
    estudianteBDD.save();
    res.status(200).json({msg: 'Justificación registrada correctamente'});
}

const visualizarEstudiantesCurso = async (req, res) => {
    //Paso 1: Obtener los datos
    const {curso} = req.params;
    //Paso 2: Realizar validaciones
    if (!curso) return res.status(400).json({error: 'Especificar curso'});
    if (!validarCurso(curso)) return res.status(400).json({error: 'El curso no es válido'});
    const cursoBDD = await cursos.findOne({nombre: curso});
    if (!cursoBDD) return res.status(400).json({error: 'El curso no está registrado'});
    //Paso 3: Manipular la BDD
    
    const estudiantes = await estudiantes.find({curso}).populate('representante');
}

export  {
    confirmarCuenta,
    loginProfesor,
    recuperarPassword,
    comprobarTokenPassword,
    nuevoPassword,
    cambiarDatos,
    cambiarPassword,
    subirNotasEstudiantes,
    modificarNotasEstudiantes,
    observacionesEstudiantes,
    justificacionesEstudiantes
}