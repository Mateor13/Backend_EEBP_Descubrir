import {  sendMailToUser, sendMailToProfesor, envioCredenciales, estudianteRegistrado } from '../config/nodemailer.js';
import Administrador from '../models/administradores.js';
import Profesor from '../models/profesor.js';
import representantes from '../models/representante.js';
import cursos from '../models/cursos.js';
import estudiantes from '../models/estudiantes.js';
import materias from '../models/materias.js';
import asistencia from '../models/asistencia.js';
import Observaciones from '../models/observaciones.js';
import anioLectivo from '../models/anioLectivo.js';

const validarFecha = (fecha) => {
    const regExp = new RegExp(/^\d{4}\/\d{1,2}\/\d{1,2}$/);
    if (!regExp.test(fecha)) {
        return false;
    }
    const [year, month, day] = fecha.split('/').map(Number);
    if (month < 1 || month > 12) {
        return false;
    }
    if (day < 1 || day > 31) {
        return false;
    }
    return true;
};

const registrarAdmin = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, email, password} = req.body;
    //Paso 2: Manipular la BDD
    const nuevoAdmin = new Administrador({nombre, apellido, email, password});
    await nuevoAdmin.encriptarPassword(password);
    const token = await nuevoAdmin.generarToken();
    nuevoAdmin.token = token;
    await sendMailToUser(email, token);
    await nuevoAdmin.save();
    res.status(201).json({msg: 'Administrador registrado, verifique el email para confirmar su cuenta'});
}

const registrarProfesor = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, email, direccion, telefono, cedula} = req.body;
    //Paso 2: Manipular la BDD
    const nuevoProfesor = new Profesor({nombre, apellido, email, direccion, telefono, cedula,admin: req.userBDD.id});
    const password = await nuevoProfesor.generarPassword();
    const token = await nuevoProfesor.generarToken();
    await sendMailToProfesor(email, token, password);
    await nuevoProfesor.save();
    res.status(201).json({msg: 'Profesor registrado, verifique el email para confirmar su cuenta'});
}

const registrarRepresentante = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, email, telefono, cedula} = req.body;
    //Paso 2: Manipular la BDD
    const nuevoRepresentante = new representantes({nombre, apellido, email, telefono, cedula});
    const password = await nuevoRepresentante.generarPassword();
    const token = await nuevoRepresentante.generarToken();
    await envioCredenciales(nombre, apellido, email, password, token);
    await nuevoRepresentante.save();
    res.status(201).json({msg: 'Representante registrado correctamente'});
}

const registrarCurso = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre} = req.body;
    //Paso 2: Manipular la BDD
    const nuevoCurso = new cursos({nombre});
    const anioLectivoBDD = await anioLectivo.findOne({estado: true});
    await anioLectivoBDD.agregarCurso(nuevoCurso._id);
    await nuevoCurso.save();
    await anioLectivoBDD.save();
    res.status(201).json({msg: 'Curso registrado correctamente'});
}

const registrarMaterias = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, curso, cedulaProfesor} = req.body;
    //Paso 2: Manipular la BDD
    const profesorBDD = await Profesor.findOne({cedula: cedulaProfesor});
    const cursoBDD = await cursos.findOne({nombre: curso});
    const nuevaMateria = new materias({nombre, profesor: profesorBDD._id});
    await profesorBDD.ingresarCurso(cursoBDD._id);
    await cursoBDD.agregarMaterias(nuevaMateria._id);
    await profesorBDD.save();
    await nuevaMateria.save();
    await cursoBDD.save();
    res.status(201).json({msg: 'Materia registrada correctamente'});
}

const registrarEstudiantes = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, cedula, curso, cedulaRepresentante} = req.body;
    //Paso 2: Manipular la BDD
    const cursoBDD = await cursos.findOne({nombre: curso});
    const representanteBDD = await representantes.findOne({cedula: cedulaRepresentante});
    const nuevoEstudiante = new estudiantes({nombre, apellido, cedula});
    const asignarEstudiante = await cursoBDD.agregarEstudiante(nuevoEstudiante._id);
    if (asignarEstudiante?.error) return res.status(400).json({error: asignarEstudiante.error});
    const asignarRepresentante = await representanteBDD.asignarEstudiante(nuevoEstudiante._id);
    if (asignarRepresentante?.error) return res.status(400).json({error: asignarRepresentante.error});
    await estudianteRegistrado(representanteBDD.email, cedula, nombre, apellido);
    const nuevaAsistencia = new asistencia({estudiante: nuevoEstudiante._id, cedula: cedula, nombreEstudiante: `${nombre} ${apellido}`});
    const nuevaObservacion = new Observaciones({estudiante: nuevoEstudiante._id, cedula: cedula, nombreEstudiante: `${nombre} ${apellido}`});
    await nuevoEstudiante.save();
    await nuevaAsistencia.save();
    await nuevaObservacion.save();
    res.status(201).json({msg: 'Estudiante registrado correctamente'});
}

const asignarRepresentante = async (req, res) => {
    //Paso 1: Obtener los datos
    const {cedulaEstudiante, cedulaRepresentante} = req.body;
    //Paso 2: Realizar validacionesManipular la BDD
    const estudianteBDD = await estudiantes.findOne({cedula: cedulaEstudiante});
    const representanteBDD = await representantes.findOne({cedula: cedulaRepresentante});
    const asignar = await representanteBDD.asignarEstudiante(estudianteBDD._id);
    if (asignar?.error) return res.status(400).json({error: asignar.error});
    await estudianteRegistrado(representanteBDD.email, cedulaEstudiante, estudianteBDD.nombre, estudianteBDD.apellido);
    res.status(200).json({msg: 'Representante asignado correctamente'});
}

const listarCursos = async (req, res) => {
    const cursosBDD = await cursos.find().select('-__v -createdAt -updatedAt -estudiantes -materias');
    if (!cursosBDD) return res.status(400).json({error: 'No hay cursos registrados'});
    res.status(200).json(cursosBDD);
}

const listarEstudiantesXCurso = async (req, res) => {
    const {cursoId} = req.params;
    const cursoBDD = await cursos.findOne({nombre: cursoId}).populate({
        path: 'estudiantes',
        select: 'nombre apellido _id'
    });
    if (!cursoBDD) return res.status(400).json({error: 'El curso no esta registrado'});
    res.status(200).json(cursoBDD.estudiantes);
}

const registroAsistenciaEstudiantes = async (req, res) => {
    // Paso 1: Obtener Datos
    const { curso, asistencias } = req.body;
    // Paso 2: Manipular la BDD
    try {
        const cursoBDD = await cursos.findOne({nombre: curso}).populate('estudiantes');
        const errores = [];
        for (const [estudianteId, estado] of Object.entries(asistencias)) {
            const estudianteBDD = cursoBDD.estudiantes.find(est => est._id.toString() === estudianteId);
            if (!estudianteBDD) {
                errores.push(`Estudiante con ID ${estudianteId} no encontrado en el curso`);
                continue;
            }
            const presente = estado == 'presente'? true : false;
            const nuevaAsistencia = { presente, justificacion: '', atraso: false };
            const registroAsistencia = await asistencia.findOne({estudiante: estudianteId});
            if (registroAsistencia) {
                const comprobar = await registroAsistencia.marcarAsistencia(nuevaAsistencia);
                if (comprobar?.error) errores.push(`${comprobar.error} del estudiante ${estudianteBDD.nombre} ${estudianteBDD.apellido}`);
                continue;
            }else{
                errores.push(`Error al registrar asistencia para el estudiante ${estudianteBDD.nombre} ${estudianteBDD.apellido}`);
            }
        }

        if (errores.length > 0) {
            return res.status(400).json({ error: errores.join(', ') });
        }

        res.status(200).json({ msg: 'Asistencia registrada correctamente' });
    } catch (error) {
        console.log(error)
    }
};

const justificacionesEstudiantes = async (req, res) => {
    //Paso 1: Obtener los datos
    const {cedula, fecha, justificacion} = req.body;
    //Paso 2: Manipular la BDD
    const estudianteBDD = await asistencia.findOne({cedula});
    const justificar = await estudianteBDD.justificarInasistencia(fecha, justificacion);
    if (justificar?.error) return res.status(400).json({error: justificar.error});
    estudianteBDD.save();
    res.status(200).json({msg: 'Justificación registrada correctamente'});
}

const terminarAnioLectivo = async (req, res) => {
    // Paso 1: Obtener Datos
    const anioLectivoBDD = await anioLectivo.findOne({ estado: true });
    if (!anioLectivoBDD) return res.status(400).json({ error: 'No hay un año lectivo activo' });
    // Paso 2: Manipular la BDD
    await anioLectivoBDD.terminarPeriodo();
    res.status(200).json({ msg: 'Año lectivo finalizado correctamente' });
}

const comenzarAnioLectivo = async (req, res) => {
    await anioLectivo.iniciarPeriodo(res);
}

const registrarFechaFin = async (req, res) => {
    const { fechaFin } = req.body;
    const anioLectivoBDD = await anioLectivo.findOne({ estado: true });
    if (!anioLectivoBDD) return res.status(400).json({ error: 'No hay un año lectivo activo' });
    if (!validarFecha(fechaFin)) return res.status(400).json({ error: 'La fecha no es válida, el formato es aaaa/mm/dd' });
    await anioLectivoBDD.establecerFechaFin(res, fechaFin);
}

const seleccionarAnioLectivo = async (req, res) => {
    const anioLectivoBDD = await anioLectivo.find().select('-__v -createdAt -updatedAt -cursos');
    if (!anioLectivoBDD || anioLectivoBDD.length === 0) return res.status(400).json({ error: 'No hay años lectivos registrados' });
    return res.status(200).json(anioLectivoBDD);
}

export {
    registrarAdmin,
    registrarProfesor,
    registrarRepresentante,
    registrarCurso,
    registrarEstudiantes,
    asignarRepresentante,
    registrarMaterias,
    registroAsistenciaEstudiantes,
    justificacionesEstudiantes,
    listarCursos,
    listarEstudiantesXCurso,
    terminarAnioLectivo,
    comenzarAnioLectivo,
    seleccionarAnioLectivo,
    registrarFechaFin
}