import {
    sendMailToUser,
    sendMailToProfesor,
    envioCredenciales,
    estudianteRegistrado
} from '../config/nodemailer.js';
import Administrador from '../models/administradores.js';
import Profesor from '../models/profesor.js';
import Representante from '../models/representante.js';
import Curso from '../models/cursos.js';
import Estudiante from '../models/estudiantes.js';
import Materia from '../models/materias.js';
import Asistencia from '../models/asistencia.js';
import Observacion from '../models/observaciones.js';
import AnioLectivo from '../models/anioLectivo.js';
import CursoAsignado from '../models/cursoAsignado.js';

// ==================== ADMINISTRADOR ====================

// Registra un nuevo administrador y envía credenciales por correo
const registrarAdmin = async (req, res) => {
    const { nombre, apellido, email, direccion, telefono, cedula } = req.body;
    try {
        const nuevoAdmin = new Administrador({ nombre, apellido, email, direccion, telefono, cedula });
        const password = await nuevoAdmin.generarPassword();
        const token = await nuevoAdmin.generarToken();
        nuevoAdmin.token = token;
        await sendMailToUser(email, token, password);
        await nuevoAdmin.save();
        res.status(201).json({ msg: 'Administrador registrado, verifique el email para confirmar su cuenta' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar administrador' });
    }
};

// Lista todos los administradores registrados
const listarAdministradores = async (req, res) => {
    const administradoresBDD = await Administrador.find().select('-__v -createdAt -updatedAt -token -password -confirmEmail');
    if (!administradoresBDD) return res.status(400).json({ error: 'No hay administradores registrados' });
    const administradores = administradoresBDD.filter(admin => admin.estado === true);
    if (administradores.length === 0) return res.status(400).json({ error: 'No hay administradores activos' });
    res.status(200).json(administradores);
};

// Modifica los datos de un administrador existente
const modificarAdministrador = async (req, res) => {
    const { usuarioBDD } = req;
    const { nombre, apellido, email, direccion, telefono, cedula } = req.body;
    try {
        usuarioBDD.nombre = nombre;
        usuarioBDD.apellido = apellido;
        usuarioBDD.email = email;
        usuarioBDD.direccion = direccion;
        usuarioBDD.telefono = telefono;
        usuarioBDD.cedula = cedula;
        await usuarioBDD.save();
        res.status(200).json({ msg: 'Representante modificado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al modificar representante' });
    }
}

// Elimina (desactiva) un administrador
const eliminarAdministrador = async (req, res) => {
    const { usuarioBDD } = req;
    try {
        usuarioBDD.estado = false;
        await usuarioBDD.save();
        res.status(200).json({ msg: 'Administrador eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar administrador' });
    }
}

// ==================== PROFESOR ====================

// Registra un nuevo profesor y envía credenciales por correo
const registrarProfesor = async (req, res) => {
    const { nombre, apellido, email, direccion, telefono, cedula } = req.body;
    try {
        const nuevoProfesor = new Profesor({ nombre, apellido, email, direccion, telefono, cedula, admin: req.userBDD.id });
        const password = await nuevoProfesor.generarPassword();
        const token = await nuevoProfesor.generarToken();
        await sendMailToProfesor(email, token, password);
        await nuevoProfesor.save();
        res.status(201).json({ msg: 'Profesor registrado, verifique el email para confirmar su cuenta' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar profesor' });
    }
};

// Lista todos los profesores registrados
const listarProfesores = async (req, res) => {
    const profesoresBDD = await Profesor.find().select('-__v -createdAt -updatedAt -token -password -confirmEmail -admin');
    if (!profesoresBDD) return res.status(400).json({ error: 'No hay profesores registrados' });
    const profesores = profesoresBDD.filter(profesor => profesor.estado === true);
    if (profesores.length === 0) return res.status(400).json({ error: 'No hay profesores activos' });
    res.status(200).json(profesores);
};

// Modifica los datos de un profesor existente
const modificarProfesor = async (req, res) => {
    const { usuarioBDD } = req;
    const { nombre, apellido, email, direccion, telefono, cedula } = req.body;
    try {
        usuarioBDD.nombre = nombre;
        usuarioBDD.apellido = apellido;
        usuarioBDD.email = email;
        usuarioBDD.direccion = direccion;
        usuarioBDD.telefono = telefono;
        usuarioBDD.cedula = cedula;
        await usuarioBDD.save();
        res.status(200).json({ msg: 'Representante modificado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al modificar representante' });
    }
}

// Elimina (desactiva) un profesor
const eliminarProfesor = async (req, res) => {
    const { profesorBDD } = req;
    try {
        profesorBDD.estado = false;
        await profesorBDD.save();
        res.status(200).json({ msg: 'Profesor eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar profesor' });
    }
}

// ==================== REPRESENTANTE ====================

// Registra un nuevo representante y envía credenciales por correo
const registrarRepresentante = async (req, res) => {
    const { nombre, apellido, email, direccion, telefono, cedula } = req.body;
    try {
        const nuevoRepresentante = new Representante({ nombre, apellido, email, telefono, cedula, direccion });
        const password = await nuevoRepresentante.generarPassword();
        const token = await nuevoRepresentante.generarToken();
        await envioCredenciales(nombre, apellido, email, password, token);
        await nuevoRepresentante.save();
        res.status(201).json({ msg: 'Representante registrado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar representante' });
    }
};

// Lista todos los representantes registrados
const listarRepresentantes = async (req, res) => {
    const representantesBDD = await Representante.find().select('-__v -createdAt -updatedAt -token -password -confirmEmail');
    if (!representantesBDD) return res.status(400).json({ error: 'No hay representantes registrados' });
    const representantes = representantesBDD.filter(representante => representante.estado === true);
    if (representantes.length === 0) return res.status(400).json({ error: 'No hay representantes activos' });
    res.status(200).json(representantes);
};

// Modifica los datos de un representante existente
const modificarRepresentante = async (req, res) => {
    const { usuarioBDD } = req;
    const { nombre, apellido, email, direccion, telefono, cedula } = req.body;
    try {
        usuarioBDD.nombre = nombre;
        usuarioBDD.apellido = apellido;
        usuarioBDD.email = email;
        usuarioBDD.direccion = direccion;
        usuarioBDD.telefono = telefono;
        usuarioBDD.cedula = cedula;
        await usuarioBDD.save();
        res.status(200).json({ msg: 'Representante modificado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al modificar representante' });
    }
}

// Elimina (desactiva) un representante
const eliminarRepresentante = async (req, res) => {
    const { representanteBDD } = req;
    try {
        representanteBDD.estado = false;
        await representanteBDD.save();
        res.status(200).json({ msg: 'Representante eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar representante' });
    }
}

// ==================== CURSO ====================

// Registra un nuevo curso y lo asigna al año lectivo activo
const registrarCurso = async (req, res) => {
    const { nivel, paralelo } = req.body;
    try {
        const nuevoCurso = new Curso({ nivel, paralelo});
        const vereficarCursoAsignadoBDD = await CursoAsignado.findOne({ curso: nuevoCurso._id, anioLectivo: req.userBDD.anio._id });
        if (vereficarCursoAsignadoBDD) return res.status(400).json({ error: 'El curso ya esta registrado en el año lectivo activo' });
        const crearCursoAsignado = new CursoAsignado({ curso: nuevoCurso._id, anioLectivo: req.userBDD.anio });
        await crearCursoAsignado.save();
        await nuevoCurso.asignarNombre();
        await nuevoCurso.save();
        res.status(201).json({ msg: 'Curso registrado correctamente y asignado al año lectivo activo' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar curso' });
    }
};

// Lista todos los cursos registrados
const listarCursos = async (req, res) => {
    const cursosBDD = await Curso.find().select('-__v -createdAt -updatedAt -estudiantes -materias');
    if (!cursosBDD) return res.status(400).json({ error: 'No hay cursos registrados' });
    res.status(200).json(cursosBDD);
}

// ==================== MATERIA ====================

// Registra una nueva materia y la asigna a un curso
const registrarMaterias = async (req, res) => {
    //Paso 1: Obtener los datos
    const { nombre } = req.body;
    const { cursoBDD, profesorBDD } = req;
    //Paso 2: Manipular la BDD
    try {
        const nuevaMateria = new Materia({ nombre, profesor: profesorBDD._id });
        await nuevaMateria.save();
        await cursoBDD.agregarMaterias(nuevaMateria._id);
        await cursoBDD.save();
        res.status(201).json({ msg: 'Materia registrada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar materia' });
    }
}

// Lista las materias de un curso específico
const listarMaterias = async (req, res) => {
    const { cursoId } = req.params;
    const cursoBDD = await Curso.findById(cursoId).populate({ 'materias': ' nombre profesor' }).populate('materias.profesor', 'nombre apellido');
    if (!cursoBDD) return res.status(400).json({ error: 'El curso no esta registrado' });
    const materias = cursoBDD.materias.filter(materia => materia.estado === true);
    if (materias.length === 0) return res.status(400).json({ error: 'No hay materias registradas' });
    res.status(200).json(materias);
}

// ==================== ESTUDIANTE ====================

// Registra un nuevo estudiante, lo asigna a un representante y a un curso
const registrarEstudiantes = async (req, res) => {
    //Paso 1: Obtener los datos
    const { nombre, apellido, cedula } = req.body;
    const { representanteBDD, cursoAsignadoBDD } = req;
    //Paso 2: Manipular la BDD
    try {
        const nuevoEstudiante = new Estudiante({ nombre, apellido, cedula });
        const asignarRepresentante = await representanteBDD.asignarEstudiante(nuevoEstudiante._id);
        if (asignarRepresentante?.error) return res.status(400).json({ error: asignarRepresentante.error });
        await estudianteRegistrado(representanteBDD.email, cedula, nombre, apellido);
        await cursoAsignadoBDD.agregarEstudiante(nuevoEstudiante._id);
        const nuevaAsistencia = new Asistencia({ estudiante: nuevoEstudiante._id, anioLectivo: req.userBDD.anio });
        const nuevaObservacion = new Observacion({ estudiante: nuevoEstudiante._id, anioLectivo: req.userBDD.anio });
        await nuevoEstudiante.save();
        await nuevaAsistencia.save();
        await nuevaObservacion.save();
        res.status(201).json({ msg: 'Estudiante registrado correctamente' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al registrar estudiante' });
        
    }
}

// Asigna un representante a un estudiante
const asignarRepresentante = async (req, res) => {
    //Paso 1: Obtener los datos
    const { estudianteBDD, representanteBDD } = req;
    //Paso 2: Realizar validacionesManipular la BDD
    try {
        const asignar = await representanteBDD.asignarEstudiante(estudianteBDD._id);
        if (asignar?.error) return res.status(400).json({ error: asignar.error });
        await estudianteRegistrado(representanteBDD.email, estudianteBDD.cedula, estudianteBDD.nombre, estudianteBDD.apellido);
        res.status(200).json({ msg: 'Representante asignado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al asignar representante' });
    }
}

// Lista los estudiantes de un curso específico
const listarEstudiantesXCurso = async (req, res) => {
    const { cursoId } = req.params;
    const cursoAsignadoBDD = await CursoAsignado.findOne({ curso: cursoId, anioLectivo: req.userBDD.anio }).populate({
        path: 'estudiantes',
        select: 'nombre apellido _id'
    });
    if (!cursoAsignadoBDD) return res.status(400).json({ error: 'El curso no esta registrado' });
    res.status(200).json(cursoAsignadoBDD.estudiantes);
}

// Elimina (desactiva) un estudiante y lo remueve del curso
const eliminarEstudiante = async (req, res) => {
    const { usuarioBDD } = req;
    try {
        usuarioBDD.estado = false;
        await usuarioBDD.save();
        res.status(200).json({ msg: 'Estudiante eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar estudiante' });
    }
}

// Modifica los datos de un estudiante existente
const modificarEstudiante = async (req, res) => {
    const { estudianteBDD } = req;
    const { nombre, apellido, cedula } = req.body;
    try {
        estudianteBDD.nombre = nombre;
        estudianteBDD.apellido = apellido;
        estudianteBDD.cedula = cedula;
        await estudianteBDD.save();
        res.status(200).json({ msg: 'Estudiante modificado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al modificar estudiante' });
    }
}

// ==================== ASISTENCIA ====================

// Registra la asistencia de los estudiantes de un curso
const registroAsistenciaEstudiantes = async (req, res) => {
    // Paso 1: Obtener Datos
    const { asistencias } = req.body;
    const { cursoAsignadoBDD } = req;
    console.log(asistencias)
    // Paso 2: Manipular la BDD
    try {
        const errores = [];
        for (const [estudianteId, presente] of Object.entries(asistencias)) {
            const estudianteBDD = cursoAsignadoBDD.estudiantes.find(est => est._id.toString() === estudianteId);
            if (!estudianteBDD) {
                errores.push(`Estudiante con ID:${estudianteId} no encontrado en el curso`);
                continue;
            }
            const nuevaAsistencia = { presente, justificacion: '' };
            const registroAsistencia = await Asistencia.findOne({ estudiante: estudianteId, anioLectivo: req.userBDD.anio });
            if (registroAsistencia) {
                const comprobar = await registroAsistencia.marcarAsistencia(nuevaAsistencia);
                if (comprobar?.error) errores.push(`${comprobar.error} del estudiante ${estudianteBDD.nombre} ${estudianteBDD.apellido}`);
                continue;
            } else {
                errores.push(`Error al registrar asistencia para el estudiante ${estudianteBDD.nombre} ${estudianteBDD.apellido}`);
            }
        }
        if (errores.length > 0) return res.status(400).json({ error: errores.join(', ') });
        res.status(200).json({ msg: 'Asistencia registrada correctamente' });
    } catch (error) {
        console.log(error)
    }
};

// Registra una justificación de inasistencia para un estudiante
const justificacionesEstudiantes = async (req, res) => {
    //Paso 1: Obtener los datos
    const { fecha, justificacion } = req.body;
    const { estudianteBDD } = req;
    //Paso 2: Manipular la BDD
    try {
        const justificar = await estudianteBDD.justificarInasistencia(fecha, justificacion);
        if (justificar?.error) return res.status(400).json({ error: justificar.error });
        await estudianteBDD.save();
        res.status(200).json({ msg: 'Justificación registrada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar justificación' });
    }
}

// ==================== AÑO LECTIVO ====================

// Asigna ponderaciones a un año lectivo
const asignarPonderaciones = async (req, res) => {
    // Paso 1: Obtener los datos
    const { ponderaciones } = req;
    const { anioLectivoBDD } = req;
    // Paso 2: Interactuar con la BDD
    try {
        anioLectivoBDD.ponderaciones.push(ponderaciones);
        await anioLectivoBDD.save();
        res.status(200).json({ msg: 'Ponderaciones registradas correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar ponderaciones' });
    }
}

// Finaliza el año lectivo actual
const terminarAnioLectivo = async (req, res) => {
    // Paso 1: Obtener los datos
    const { anioLectivoBDD } = req;
    try {
        await anioLectivoBDD.terminarPeriodo();
        res.status(200).json({ msg: 'Año lectivo finalizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al finalizar año lectivo' });
    }
}

// Comienza un nuevo año lectivo
const comenzarAnioLectivo = async (req, res) => {
    // Paso 1: Ejecutar el método
    await AnioLectivo.iniciarPeriodo(res);
}

// Registra la fecha de fin de un año lectivo
const registrarFechaFin = async (req, res) => {
    // Paso 1: Obtener los datos
    const { fechaFin } = req.body;
    const { anioLectivoBDD } = req;
    // Paso 2: Realizar validaciones
    await anioLectivoBDD.establecerFechaFin(res, fechaFin);
}

// ==================== REEMPLAZOS ====================

// Reemplaza un profesor por otro en las materias indicadas
const reemplazarProfesor = async (req, res) => {
    const { profesorBDD, nuevoProfesorBDD, materiasBDD } = req;
    try {
        for (const materia of materiasBDD) {
            await materia.reemplazar_profesor(profesorBDD._id, nuevoProfesorBDD._id);
        }
        nuevoProfesorBDD.cursos.push(...profesorBDD.cursos);
        profesorBDD.cursos = [];
        await profesorBDD.save();
        await nuevoProfesorBDD.save();
        res.status(200).json({ msg: 'Profesor reemplazado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al reemplazar profesor' });
    }
}

// Reasigna una materia de un profesor a otro en un curso
const reasignarMateriaProfesor = async (req, res) => {
    const { profesorBDD, materiasBDD, nuevoProfesorBDD, cursoBDD } = req;
    try {
        profesorBDD.cursos = profesorBDD.cursos.filter(curso => curso !== cursoBDD._id);
        nuevoProfesorBDD.cursos.push(cursoBDD._id);
        await materiasBDD.reemplazar_profesor(profesorBDD._id, nuevoProfesorBDD._id);
        await nuevoProfesorBDD.save();
        await profesorBDD.save();
        res.status(200).json({ msg: 'Materia reemplazada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al reemplazar materia' });
    }
}

export {
    //Registrar
    registrarAdmin,
    registrarProfesor,
    registrarRepresentante,
    registrarCurso,
    registrarMaterias,
    registrarEstudiantes,
    //Asignar
    asignarRepresentante,
    //Asistencia
    registroAsistenciaEstudiantes,
    justificacionesEstudiantes,
    //Listar
    listarCursos,
    listarEstudiantesXCurso,
    listarAdministradores,
    listarProfesores,
    listarRepresentantes,
    listarMaterias,
    //Año lectivo
    terminarAnioLectivo,
    comenzarAnioLectivo,
    registrarFechaFin,
    asignarPonderaciones,
    //Eliminar
    eliminarProfesor,
    eliminarEstudiante,
    eliminarAdministrador,
    eliminarRepresentante,
    //Modificar
    modificarAdministrador,
    modificarProfesor,
    modificarRepresentante,
    modificarEstudiante,
    //Reemplazar
    reemplazarProfesor,
    reasignarMateriaProfesor
}