import {  sendMailToUser, sendMailToProfesor, envioCredenciales, estudianteRegistrado } from '../config/nodemailer.js';
import Administrador from '../models/administradores.js';
import Profesor from '../models/profesor.js';
import representantes from '../models/representante.js';
import cursos from '../models/cursos.js';
import estudiantes from '../models/estudiantes.js';
import materias from '../models/materias.js';
import asistencia from '../models/asistencia.js';
import Observaciones from '../models/observaciones.js';

const validarEmail = (email) => {
    const regExp = new RegExp(/\S+@\S+\.\S+/)
    return regExp.test(email)
}

const validarCurso = (curso) => {
    const regExp = new RegExp(/^[0-7][A-E]$/)
    return regExp.test(curso)
}
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
    //Paso 2: Realizar validaciones
    const nuevoAdmin = new Administrador({nombre, apellido, email, password});
    if (Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!(validarEmail(email))) return res.status(400).json({error: 'El email no es válido'});
    const adminBDD = await Administrador.findOne({email});
    if (adminBDD) return res.status(400).json({error: 'El usuario ya esta registrado'})
    const representanteBDD = await representantes.findOne({email});
    if (representanteBDD) return res.status(400).json({error: 'El usuario ya esta registrado'})
    const profesorBDD = await Profesor.findOne({email});
    if (profesorBDD) return res.status(400).json({error: 'El usuario ya esta registrado'})
    if (password.length < 6) return res.status(400).json({error: 'La contraseña debe tener al menos 6 caracteres'});
    //Paso 3: Manipular la BDD
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
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!(validarEmail(email))) return res.status(400).json({error: 'El email no es válido'});
    const profBDD = await Profesor.findOne({email});
    if (profBDD) return res.status(400).json({error: 'El usuario ya esta registrado'})
    const repBDD = await representantes.findOne({email});
    if (repBDD) return res.status(400).json({error: 'El usuario ya esta registrado'})
    const adminBDD = await Administrador.findOne({email})
    if (adminBDD) return res.status(400).json({error: 'El usuario ya esta registrado'})
    if (telefono.length !== 10) return res.status(400).json({error: 'El telefono debe tener 10 caracteres'});
    if (cedula.length !== 10) return res.status(400).json({error: 'La cédula debe tener 10 caracteres'});
    //Paso 3: Manipular la BDD
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
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!validarEmail(email)) return res.status(400).json({error:'El email es inválido'});
    if (telefono.length !== 10) return res.status(400).json({error: 'El telefono debe tener 10 caracteres'});
    if (cedula.length !== 10) return res.status(400).json({error: 'La cedula debe tener 10 caracteres'});
    const representanteBDD = await representantes.findOne({email});
    if (representanteBDD) return res.status(400).json({error: 'El usuario ya esta registrado'});
    const profesorBDD = await Profesor.findOne({email});
    if (profesorBDD) return res.status(400).json({error: 'El usuario ya esta registrado'});
    const adminBDD = await Administrador.findOne({email})
    if (adminBDD) return res.status(400).json({error: 'El usuario ya esta registrado'})
    //Paso 3: Manipular la BDD
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
    const materiasRegistradas = await cursoBDD.buscarMateriasRegistradas(nombre);
    if (materiasRegistradas.length > 0) return res.status(400).json({error: 'La materia ya esta registrada en este curso'});  
    //Paso 3: Manipular la BDD
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
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (cedula.length !== 10) return res.status(400).json({error: 'La cedula debe tener 10 caracteres'});
    if(!validarCurso(curso)) return res.status(400).json({error: 'El curso no es válido'});
    if (cedulaRepresentante.length !== 10) return res.status(400).json({error: 'La cedula del representante debe tener 10 caracteres'});
    const representanteBDD = await representantes.findOne({cedula: cedulaRepresentante}).select('-password');
    if (!representanteBDD) return res.status(400).json({error: 'El representante no esta registrado'});
    const estudianteBDD = await estudiantes.findOne({cedula})
    if (estudianteBDD) return res.status(400).json({error: 'El estudiante ya esta registrado'});
    const representanteBDD2 =await representantes.findOne({cedula});
    if (representanteBDD2) return res.status(400).json({error: 'Cédula inválida'});
    const profesorBDD = await Profesor.findOne({cedula});
    if (profesorBDD) return res.status(400).json({error: 'Cédula inválida'});
    const cursoBDD = await cursos.findOne({nombre: curso});
    if (!cursoBDD) return res.status(400).json({error: 'El curso no esta registrado'});
    //Paso 3: Manipular la BDD
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
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (cedulaEstudiante.length !== 10) return res.status(400).json({error: 'La cedula del estudiante debe tener 10 caracteres'});
    if (cedulaRepresentante.length !== 10) return res.status(400).json({error: 'La cedula del representante debe tener 10 caracteres'});
    const representanteBDD = await representantes.findOne({cedula: cedulaRepresentante});
    if (!representanteBDD) return res.status(400).json({error: 'El representante no esta registrado'});
    const estudianteBDD = await estudiantes.findOne({cedula: cedulaEstudiante});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no esta registrado'});
    //Paso 3: Manipular la BDD
    const asignar = await representanteBDD.asignarEstudiante(estudianteBDD._id);
    if (asignar?.error) return res.status(400).json({error: asignar.error});
    await estudianteRegistrado(representanteBDD.email, cedulaEstudiante, estudianteBDD.nombre, estudianteBDD.apellido);
    res.status(200).json({msg: 'Representante asignado correctamente'});
}

const listarCursos = async (req, res) => {
    const cursosBDD = await cursos.find().select('-__v -createdAt -updatedAt -estudiantes -materias');
    res.status(200).json(cursosBDD);
}

const listarEstudiantesXCurso = async (req, res) => {
    const {cursoId} = req.params;
    const cursoBDD = await cursos.findOne({nombre: cursoId}).populate({
        path: 'estudiantes',
        select: 'nombre apellido _id'
    });
    res.status(200).json(cursoBDD.estudiantes);
}

const registroAsistenciaEstudiantes = async (req, res) => {
    // Paso 1: Obtener Datos
    const { curso, asistencias } = req.body;
    // Paso 2: Realizar validaciones
    if (!curso) return res.status(400).json({ error: 'Especificar curso' });
    if (!asistencias || typeof asistencias !== 'object') return res.status(400).json({ error: 'Especificar asistencias' });

    try {
        const cursoBDD = await cursos.findOne({nombre: curso}).populate('estudiantes');
        if (!cursoBDD) return res.status(400).json({ error: 'El curso no está registrado' });
        const errores = [];

        // Paso 3: Manipular la BDD
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
                errores.push(`Error al registrar asistencia para el estudiante con ID ${estudianteBDD.nombre} ${estudianteBDD.apellido}`);
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
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!cedula) return res.status(400).json({error: 'Especificar cédula estudiante'});
    if (!fecha) return res.status(400).json({error: 'Especificar fecha'});
    if (!justificacion) return res.status(400).json({error: 'Especificar justificación'});
    if (!validarFecha(fecha)) return res.status(400).json({error: 'La fecha no es válida, el formato es aaaa/mm/dd'});
    const estudianteBDD = await asistencia.findOne({cedula});
    if (!estudianteBDD) return res.status(404).json({error: 'El estudiante no encontrado'});
    //Paso 3: Manipular la BDD
    const justificar = await estudianteBDD.justificarInasistencia(fecha, justificacion);
    if (justificar?.error) return res.status(400).json({error: justificar.error});
    estudianteBDD.save();
    res.status(200).json({msg: 'Justificación registrada correctamente'});
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
    listarEstudiantesXCurso
}