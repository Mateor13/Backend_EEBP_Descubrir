import { sendMailToRecoveryPassword, sendMailToUser, sendMailToProfesor } from '../config/nodemailer.js';
import { generarJWT } from '../helpers/JWT.js';
import Administrador from '../models/administrador.js';
import Profesor from '../models/profesor.js';
import representantes from '../models/representantes.js';
import cursos from '../models/cursos.js';
import estudiantes from '../models/estudiantes.js';
import materias from '../models/materias.js';

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
    const adminiBDD = await Administrador.findById(req.userBDD.id);
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
    const adminBDD = await Administrador.findById(req.userBDD.id);
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

const registrarProfesor = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, email, password, direccion, telefono, cedula} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!(await Profesor.validarEmail(email))) return res.status(400).json({error: 'El email no es válido'});
    if (password.length < 6) return res.status(400).json({error: 'La contraseña debe tener al menos 6 caracteres'});
    const profBDD = await Profesor.findOne({email});
    if (profBDD) return res.status(400).json({error: 'El email ya esta registrado'})
    if (telefono.length !== 10) return res.status(400).json({error: 'El telefono debe tener 10 caracteres'});
    if (cedula.length !== 10) return res.status(400).json({error: 'La cedula debe tener 10 caracteres'});
    //Paso 3: Manipular la BDD
    const nuevoProfesor = new Profesor({nombre, apellido, email, direccion, telefono, cedula,admin: req.userBDD.id});
    nuevoProfesor.password = await nuevoProfesor.encriptarPassword(password);
    const token = await nuevoProfesor.generarToken();
    await sendMailToProfesor(email, token);
    await nuevoProfesor.save();
    res.status(201).json({msg: 'Profesor registrado, verifique el email para confirmar su cuenta'});
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
    const nuevoRepresentante = new representantes({nombre, apellido, correo, telefono, cedula});
    const password = await nuevoRepresentante.generarPassword();
    await envioCredenciales(nombre, apellido, correo, password);
    await nuevoRepresentante.save();
    res.status(201).json({msg: 'Representante registrado correctamente'});
}

const registrarCurso = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if(!validarCurso(nombre)) return res.status(400).json({error: 'El curso no es válido'});
    const cursoBDD = await cursos.findOne({nombre});
    if (cursoBDD) return res.status(400).json({error: 'El curso ya esta registrado'});
    //Paso 3: Manipular la BDD
    const nuevoCurso = new cursos({nombre});
    await nuevoCurso.save();
    res.status(201).json({msg: 'Curso registrado correctamente'});
}

const registrarMaterias = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, curso, cedulaProfesor} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if(!validarCurso(curso)) return res.status(400).json({error: 'El curso no es válido'});
    const cursoBDD = await cursos.findOne({nombre: curso});
    if (!cursoBDD) return res.status(400).json({error: 'El curso no esta registrado'});
    const profesorBDD = await Profesor.findOne({cedula: cedulaProfesor});
    if (!profesorBDD) return res.status(400).json({error: 'El profesor no esta registrado'});
    console.log(cursoBDD?.materias)
    const materiasRegistradas = await cursoBDD.buscarMateriasRegistradas(nombre);
    if (materiasRegistradas.length > 0) return res.status(400).json({error: 'La materia ya esta registrada en este curso'});  
    //Paso 3: Manipular la BDD
    const nuevaMateria = new materias({nombre, profesores: profesorBDD._id});
    await cursoBDD.agregarMaterias(nuevaMateria._id);
    await nuevaMateria.save();
    await cursoBDD.save();
    res.status(201).json({msg: 'Materia registrada correctamente'});
}

const registrarEstudiantes = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, cedula, curso, cedulaRepresentante} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (cedula.length !== 10) return res.status(400).json({error: 'La cedula debe tener 10 caracteres'});
    if(!validarCurso(curso)) return res.status(400).json({error: 'El curso no es válido'});
    if (cedulaRepresentante.length !== 10) return res.status(400).json({error: 'La cedula del representante debe tener 10 caracteres'});
    const representanteBDD = await representantes.findOne({cedula: cedulaRepresentante}).select('_id correo -password');
    if (!representanteBDD) return res.status(400).json({error: 'El representante no esta registrado'});
    const estudianteBDD = await estudiantes.findOne({cedula})
    if (estudianteBDD) return res.status(400).json({error: 'El estudiante ya esta registrado'});
    
    //Paso 3: Manipular la BDD
    const nuevoEstudiante = new estudiantes({nombre, apellido, cedula, curso});
    const asignarRepre = await nuevoEstudiante.asignarRepresentante(representanteBDD._id);
    if (asignarRepre.error) return res.status(400).json({error: asignarRepre.error});
    await estudianteRegistrado(representanteBDD.correo, cedula, nombre, apellido);
    const nuevaAsistencia = new asistencia({estudiante: nuevoEstudiante._id, cedula: cedula, nombreEstudiante: `${nombre} ${apellido}`});
    const nuevaObservacion = new observaciones({estudiante: nuevoEstudiante._id, cedula: cedula, nombreEstudiante: `${nombre} ${apellido}`});
    await nuevoEstudiante.save();
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

export {
    registrarAdmin,
    confirmarCuenta,
    loginAdmin,
    recuperarPassword,
    comprobarTokenPassword,
    nuevoPassword,
    cambiarPassword,
    cambiarDatos,
    registrarProfesor,
    registrarRepresentante,
    registrarCurso,
    registrarEstudiantes,
    asignarRepresentante,
    registrarMaterias,
    registroAsistenciaEstudiantes
}