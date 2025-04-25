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

const registrarAdmin = async (req, res) => {
    const { nombre, apellido, email, password } = req.body;
    try {
        const nuevoAdmin = new Administrador({ nombre, apellido, email, password });
        await nuevoAdmin.encriptarPassword(password);
        const token = await nuevoAdmin.generarToken();
        nuevoAdmin.token = token;
        await sendMailToUser(email, token);
        await nuevoAdmin.save();
        res.status(201).json({ msg: 'Administrador registrado, verifique el email para confirmar su cuenta' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar administrador' });
    }
};

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

const registrarCurso = async (req, res) => {
    const { nivel, paralelo } = req.body;
    const { anioLectivoBDD } = req;
    try {
        const nuevoCurso = new Curso({ nivel, paralelo });
        await nuevoCurso.save();
        await anioLectivoBDD.agregarCurso(nuevoCurso._id);
        await anioLectivoBDD.save();
        res.status(201).json({ msg: 'Curso registrado correctamente y asignado al año lectivo activo' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar curso' });
    }
};

const registrarMaterias = async (req, res) => {
    //Paso 1: Obtener los datos
    const { nombre } = req.body;
    const { cursoBDD, profesorBDD } = req;
    //Paso 2: Manipular la BDD
    try {
        const nuevaMateria = new Materia({ nombre, profesor: profesorBDD._id });
        await profesorBDD.ingresarCurso(cursoBDD._id);
        await cursoBDD.agregarMaterias(nuevaMateria._id);
        await profesorBDD.save();
        await nuevaMateria.save();
        await cursoBDD.save();
        res.status(201).json({ msg: 'Materia registrada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar materia' });
    }
}

const registrarEstudiantes = async (req, res) => {
    //Paso 1: Obtener los datos
    const { nombre, apellido, cedula } = req.body;
    const { representanteBDD } = req;
    //Paso 2: Manipular la BDD
    try {
        const nuevoEstudiante = new Estudiante({ nombre, apellido, cedula });
        const asignarRepresentante = await representanteBDD.asignarEstudiante(nuevoEstudiante._id);
        if (asignarRepresentante?.error) return res.status(400).json({ error: asignarRepresentante.error });
        await estudianteRegistrado(representanteBDD.email, cedula, nombre, apellido);
        const nuevaAsistencia = new Asistencia({ estudiante: nuevoEstudiante._id, cedula: cedula, nombreEstudiante: `${nombre} ${apellido}` });
        const nuevaObservacion = new Observacion({ estudiante: nuevoEstudiante._id, cedula: cedula, nombreEstudiante: `${nombre} ${apellido}` });
        await nuevoEstudiante.save();
        await nuevaAsistencia.save();
        await nuevaObservacion.save();
        res.status(201).json({ msg: 'Estudiante registrado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar estudiante' });
    }
}

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

const asignarEstudianteACurso = async (req, res) => {
    const { estudianteBDD, cursoBDD, anioLectivoBDD } = req;
    try {
        const cursoAsignado = await CursoAsignado.findOne({ curso: cursoBDD._id, anioLectivo: anioLectivoBDD._id });
        if (!cursoAsignado) {
            cursoAsignado = new CursoAsignado({ curso: cursoBDD._id, anioLectivo: anioLectivoBDD._id });
        }
        await cursoAsignado.agregarEstudiante(estudianteBDD._id);
        res.status(200).json({ msg: 'Estudiante asignado al curso correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al asignar estudiante a curso' });
    }
}

const listarCursos = async (req, res) => {
    const cursosBDD = await Curso.find().select('-__v -createdAt -updatedAt -estudiantes -materias');
    if (!cursosBDD) return res.status(400).json({ error: 'No hay cursos registrados' });
    res.status(200).json(cursosBDD);
}

const listarEstudiantesXCurso = async (req, res) => {
    const { cursoId } = req.params;
    const cursoBDD = await Curso.findOne({ nombre: cursoId }).populate({
        path: 'estudiantes',
        select: 'nombre apellido _id'
    });
    if (!cursoBDD) return res.status(400).json({ error: 'El curso no esta registrado' });
    res.status(200).json(cursoBDD.estudiantes);
}

const registroAsistenciaEstudiantes = async (req, res) => {
    // Paso 1: Obtener Datos
    const { asistencias } = req.body;
    const { cursoBDD } = req;
    // Paso 2: Manipular la BDD
    try {
        const errores = [];
        for (const [estudianteId, estado] of Object.entries(asistencias)) {
            const estudianteBDD = cursoBDD.estudiantes.find(est => est._id.toString() === estudianteId);
            if (!estudianteBDD) {
                errores.push(`Estudiante con ID:${estudianteId} no encontrado en el curso`);
                continue;
            }
            const presente = estado == 'presente' ? true : false;
            const nuevaAsistencia = { presente, justificacion: '', atraso: false };
            const registroAsistencia = await Asistencia.findOne({ estudiante: estudianteId });
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

const comenzarAnioLectivo = async (req, res) => {
    // Paso 1: Ejecutar el método
    await AnioLectivo.iniciarPeriodo(res);
}

const registrarFechaFin = async (req, res) => {
    // Paso 1: Obtener los datos
    const { fechaFin } = req.body;
    const { anioLectivoBDD } = req;
    // Paso 2: Realizar validaciones
    await anioLectivoBDD.establecerFechaFin(res, fechaFin);
}

const eliminarProfesor = async (req, res) => {
    // Paso 1: Obtener los datos
    const { profesorBDD } = req;
    // Paso 2: Realizar validaciones
    try {
        profesorBDD.estado = false;
        await profesorBDD.save();
        res.status(200).json({ msg: 'Profesor eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar profesor' });
    }
}

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

const eliminarEstudiante = async (req, res) => {
    const { estudianteBDD, cursoBDD } = req;
    try {
        estudianteBDD.estado = false;
        await cursoBDD.eliminarEstudiante(estudianteBDD.id);
        await estudianteBDD.save();
        res.status(200).json({ msg: 'Estudiante eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar estudiante' });
    }
}

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
    asignarEstudianteACurso,
    //Asistencia
    registroAsistenciaEstudiantes,
    justificacionesEstudiantes,
    //Listar
    listarCursos,
    listarEstudiantesXCurso,
    //Año lectivo
    terminarAnioLectivo,
    comenzarAnioLectivo,
    registrarFechaFin,
    //Eliminar
    eliminarProfesor,
    eliminarEstudiante,
    //Reemplazar
    reemplazarProfesor,
    reasignarMateriaProfesor
}