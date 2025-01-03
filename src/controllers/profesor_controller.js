import Profesor from "../models/profesor.js"
import { envioCredenciales, sendMailToProfesor, sendMailToRecoveryPasswordProfesor, estudianteRegistrado } from '../config/nodemailer.js';
import { generarJWT } from '../helpers/JWT.js';
import estudiantes from "../models/estudiantes.js";
import representantes from "../models/representante.js";
import materias from "../models/materias.js";
import asistencia from "../models/asistencia.js";
import observaciones from "../models/observaciones.js";


const validarEmail = (email) => {
    const regExp = new RegExp(/\S+@\S+\.\S+/)
    return regExp.test(email)
}

const validarCurso = (curso) => {
    const regExp = new RegExp(/^[0-7][A-E]$/)
    return regExp.test(curso)
}
const validarFecha = (fecha) => {
    const regExp = new RegExp(/^\d{4} - \d{2} - \d{2}$/);
    return regExp.test(fecha);
};

const registrarProfesor = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, email, password, direccion, telefono} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const profBDD = await Profesor.findOne({email});
    if (profBDD) return res.status(400).json({error: 'El email ya esta registrado'})
    if (password.length < 6) return res.status(400).json({error: 'La contraseña debe tener al menos 6 caracteres'});
    //Paso 3: Manipular la BDD
    const nuevoProfesor = new Profesor({nombre, apellido, email, direccion, telefono, admin: req.userBDD.id});
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

const registrarRepresentante = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, correo, telefono, cedula} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const representanteBDD = await representantes.findOne({cedula});
    if (representanteBDD) return res.status(400).json({error: 'El representante ya esta registrado'});
    if (!validarEmail(correo)) return res.status(400).json({error:'El email es inválido'});
    if (telefono.length !== 10) return res.status(400).json({error: 'El telefono debe tener 10 caracteres'});
    if (cedula.length !== 10) return res.status(400).json({error: 'La cedula debe tener 10 caracteres'});
    //Paso 3: Manipular la BDD
    const nuevoRepresentante = new representantes({nombre, apellido, correo, telefono, cedula, profesor: req.userBDD.id});
    const password = await nuevoRepresentante.generarPassword();
    await envioCredenciales(nombre, apellido, correo, password);
    await nuevoRepresentante.save();
    res.status(201).json({msg: 'Representante registrado correctamente'});
}

const registrarEstudiantes = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, cedula, curso, cedulaRepresentante} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const representanteBDD = await representantes.findOne({cedula: cedulaRepresentante});
    if (!representanteBDD) return res.status(400).json({error: 'El representante no esta registrado'});
    const estudianteBDD = await estudiantes.findOne({cedula}) 
    if (estudianteBDD) return res.status(400).json({error: 'El estudiante ya esta registrado'});
    if (cedula.length !== 10) return res.status(400).json({error: 'La cedula debe tener 10 caracteres'});
    if(!validarCurso(curso)) return res.status(400).json({error: 'El curso no es válido'});
    if (cedulaRepresentante.length !== 10) return res.status(400).json({error: 'La cedula del representante debe tener 10 caracteres'});
    //Paso 3: Manipular la BDD
    const nuevoEstudiante = new estudiantes({nombre, apellido, cedula, curso, profesor: req.userBDD.id});
    await nuevoEstudiante.asignarRepresentante(representanteBDD._id);
    await estudianteRegistrado(representanteBDD.correo, cedula, nombre, apellido);
    const nuevasMaterias = new materias({estudiante: nuevoEstudiante._id, profesor: req.userBDD.id, cedula: cedula, nombreEstudiante: `${nombre} ${apellido}`});
    const nuevaAsistencia = new asistencia({estudiante: nuevoEstudiante._id, profesor: req.userBDD.id, cedula: cedula, nombreEstudiante: `${nombre} ${apellido}`});
    const nuevaObservacion = new observaciones({estudiante: nuevoEstudiante._id, profesor: req.userBDD.id, cedula: cedula, nombreEstudiante: `${nombre} ${apellido}`});
    await nuevoEstudiante.save();
    await nuevasMaterias.save();
    await nuevaAsistencia.save();
    await nuevaObservacion.save();
    res.status(201).json({msg: 'Estudiante registrado correctamente'});
}

const asignarRepresentante = async (req, res) => {
    //Paso 1: Obtener los datos
    const {cedulaEstudiante, cedulaRepresentante} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (cedulaEstudiante.length !== 10) return res.status(400).json({error: 'La cedula del estudiante debe tener 10 caracteres'});
    if (cedulaRepresentante.length !== 10) return res.status(400).json({error: 'La cedula del representante debe tener 10 caracteres'});
    const representanteBDD = await representantes.findOne({cedula: cedulaRepresentante});
    if (!representanteBDD) return res.status(400).json({error: 'El representante no esta registrado'});
    const estudianteBDD = await estudiantes.findOne({cedula: cedulaEstudiante});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no esta registrado'});
    //Paso 3: Manipular la BDD
    const asignar = await estudianteBDD.asignarRepresentante(representanteBDD._id);
    if (asignar?.error) return res.status(400).json({error: asignar.error});
    await estudianteRegistrado(representanteBDD.correo, cedulaEstudiante, estudianteBDD.nombre, estudianteBDD.apellido);
    res.status(200).json({msg: 'Representante asignado correctamente'});
}

const registroAsistenciaEstudiantes = async (req, res) => {
    //Paso 1: Obtener Datos
    const {cedula, presente, justificacion, atraso} = req.body;
    //Paso 2: Realizar validaciones
    if(!cedula) return res.status(400).json({error: 'Especificar cédula estudiante'});
    const estudianteBDD = await asistencia.findOne({cedula});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no registrado en esta materia'});
    //Paso 3: Manipular la BDD
    const fecha = new Date();
    const nuevaAsistencia = {fecha, presente, justificacion, atraso};
    const registroAsistencia = await estudianteBDD.marcarAsistencia(nuevaAsistencia);
    if (registroAsistencia?.error) return res.status(400).json({error: registroAsistencia.error});
    estudianteBDD.save();
    res.status(200).json({msg: 'Asistencia registrada correctamente'});
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
    observacionesEstudiantes,
    registrarRepresentante,
    asignarRepresentante,
    justificacionesEstudiantes
}