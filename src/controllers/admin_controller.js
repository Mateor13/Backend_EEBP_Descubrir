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
import Notas from '../models/notas.js'

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
        res.status(200).json({ msg: 'Administrador modificado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al modificar administrador' });
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
        res.status(200).json({ msg: 'Profesor modificado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al modificar profesor' });
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
        res.status(201).json({ msg: 'Representante registrado correctamente, ahora puede asignar un estudiante' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar representante' });
    }
};

// Lista todos los representantes registrados
const listarRepresentantes = async (req, res) => {
    const { cursoId } = req.params;
    const anio = req.userBDD.anio;
    try {
        // 1. Buscar el curso asignado para el año lectivo actual
        const cursoAsignadoBDD = await CursoAsignado.findOne({ curso: cursoId, anioLectivo: anio })
            .populate('estudiantes', '_id estado nombre apellido cedula');
        if (!cursoAsignadoBDD) {
            return res.status(400).json({ error: 'El curso no está registrado o no tiene estudiantes asignados' });
        }
        // Filtrar solo estudiantes activos
        const estudiantesActivos = cursoAsignadoBDD.estudiantes.filter(est => est.estado !== false);
        const estudiantesActivosIds = estudiantesActivos.map(est => est._id.toString());
        // 2. Buscar representantes que tengan alguno de estos estudiantes
        let representantes = await Representante.find({
            estudiantes: { $in: estudiantesActivosIds },
            estado: true
        })
            .populate('estudiantes', '_id nombre apellido cedula estado')
            .select('-__v -createdAt -updatedAt -token -password -confirmEmail');
        if (!representantes.length) {
            return res.status(404).json({ error: 'No hay representantes asociados a este curso' });
        }
        // Filtrar los estudiantes de cada representante para que solo estén los del curso
        representantes = representantes.map(rep => {
            const estudiantesFiltrados = rep.estudiantes.filter(est =>
                estudiantesActivosIds.includes(est._id.toString())
            );
            // Retornar el representante con solo los estudiantes del curso
            return {
                ...rep.toObject(),
                estudiantes: estudiantesFiltrados
            };
        });
        res.status(200).json(representantes);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar representantes' });
    }
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
        // 1. Buscar o crear el curso base
        let curso = await Curso.findOne({ nivel, paralelo });
        if (!curso) {
            curso = new Curso({ nivel, paralelo });
            await curso.asignarNombre();
            await curso.save();
        }
        // 2. Verificar que no exista ya la asignación en el año lectivo activo
        const existeCursoAsignado = await CursoAsignado.findOne({ curso: curso._id, anioLectivo: req.anioLectivoBDD._id });
        if (existeCursoAsignado) {
            return res.status(400).json({ error: 'El curso ya está registrado en el año lectivo activo' });
        }
        // 3. Crear la asignación del curso para el año lectivo activo
        const nuevoCursoAsignado = new CursoAsignado({ curso: curso._id, anioLectivo: req.anioLectivoBDD._id });
        await nuevoCursoAsignado.save();
        res.status(201).json({ msg: 'Curso registrado correctamente y asignado al año lectivo activo' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar curso' });
    }
};

// Elimina (desactiva) un curso
const eliminarCurso = async (req, res) => {
    const { cursoBDD } = req;
    try {
        // Borrado lógico
        cursoBDD.estado = false;
        await cursoBDD.save();
        res.status(200).json({ msg: 'Curso eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar curso' });
    }
};

// Lista todos los cursos registrados
const listarCursos = async (req, res) => {
    try {
        const cursos = await CursoAsignado.find({
            anioLectivo: req.userBDD.anio,
            estado: true
        }).populate('curso');

        const cursosBDD = cursos.map(curso => ({
            _id: curso.curso._id,
            nombre: curso.curso.nombre,
            nivel: curso.curso.nivel,
            paralelo: curso.curso.paralelo,
        }));

        res.status(200).json(cursosBDD);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar los cursos' });
    }
};

// ==================== MATERIA ====================

// Registra una nueva materia y la asigna a un curso
const registrarMaterias = async (req, res) => {
    //Paso 1: Obtener los datos
    const { nombre } = req.body;
    const { cursoAsignadoBDD, profesorBDD } = req;
    const anioLectivo = req.userBDD.anio;
    //Paso 2: Manipular la BDD
    try {
        const nuevaMateria = new Materia({ nombre, profesor: profesorBDD._id, anioLectivo });
        await cursoAsignadoBDD.agregarMaterias(nuevaMateria._id);
        await nuevaMateria.save();
        await cursoAsignadoBDD.save();
        res.status(201).json({ msg: 'Materia registrada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar materia' });
    }
}

// Elimina (desactiva) una materia y la remueve del curso
const eliminarMateria = async (req, res) => {
    const { materiaBDD } = req;
    try {
        // Borrado lógico
        materiaBDD.estado = false;
        await materiaBDD.save();
        // Opcional: eliminar referencia en el curso
        await CursoAsignado.updateMany(
            { materias: materiaBDD._id },
            { $pull: { materias: materiaBDD._id } }
        );
        res.status(200).json({ msg: 'Materia eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar materia' });
    }
};

// Lista las materias de un curso específico
const listarMaterias = async (req, res) => {
    const { cursoId } = req.params;
    const anioLectivo = req.userBDD.anio;
    const cursoBDD = await Curso.findById(cursoId);
    const cursoAsignadoBDD = await CursoAsignado.findOne({ curso: cursoBDD._id, anioLectivo })
        .populate({
            path: 'materias',
            match: { anioLectivo },
            select: 'nombre profesor estado',
            populate: {
                path: 'profesor',
                select: 'nombre apellido'
            }
        });
    if (!cursoAsignadoBDD) return res.status(400).json({ error: 'El curso no esta registrado' });
    const materias = cursoAsignadoBDD.materias.filter(materia => materia.estado === true);
    if (materias.length === 0) return res.status(400).json({ error: 'No hay materias registradas' });
    res.status(200).json(materias);
};

// Modificar una materia de un profesor a otro en un curso
const modificarMateria = async (req, res) => {
    const { nombre } = req.body;
    const { materiaBDD, nuevoProfesorBDD } = req;
    try {
        // Si el profesor cambia
        if (materiaBDD.profesor._id.toString() !== nuevoProfesorBDD._id.toString()) {
            // Cambiar el profesor en la materia
            await materiaBDD.reemplazar_profesor(nuevoProfesorBDD._id);
        }
        // Actualizar el nombre si cambió
        materiaBDD.nombre = nombre;
        await materiaBDD.save();
        res.status(200).json({ msg: 'Materia modificada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al modificar materia' });
    }
};

// ==================== ESTUDIANTE ====================

const registrarEstudiantes = async (req, res) => {
    const { nombre, apellido, cedula } = req.body;
    const { representanteBDD, cursoAsignadoBDD } = req;
    try {
        // Crear instancia del estudiante
        const nuevoEstudiante = new Estudiante({ nombre, apellido, cedula });
        // Asignar al representante
        const asignarRepresentante = await representanteBDD.asignarEstudiante(nuevoEstudiante._id);
        if (asignarRepresentante?.error) {
            return res.status(400).json({ error: asignarRepresentante.error });
        }
        // Enviar correo al representante con los datos del estudiante
        await estudianteRegistrado(representanteBDD.email, cedula, nombre, apellido);
        // Asignar al curso
        await cursoAsignadoBDD.agregarEstudiante(nuevoEstudiante._id);
        // Crear documentos de asistencia y observación
        const anioLectivo = req.userBDD.anio;
        const nuevaAsistencia = new Asistencia({ estudiante: nuevoEstudiante._id, anioLectivo });
        const nuevaObservacion = new Observacion({ estudiante: nuevoEstudiante._id, anioLectivo });
        for (const materia of cursoAsignadoBDD.materias) {
            const nuevaNota = new Notas({
                estudiante: nuevoEstudiante._id,
                materia: materia._id,
                anioLectivo
            });
            // Copiar los deberes ya asignados a una materia
            const evaluacionesPorTipo = await Notas.copiarEvaluacionesDeCurso({
                materiaId: materia._id,
                anioLectivo,
                estudiantes: cursoAsignadoBDD.estudiantes
            });
            if (Object.keys(evaluacionesPorTipo).length > 0) {
                nuevaNota.evaluaciones = {};
                for (const tipo of Object.keys(evaluacionesPorTipo)) {
                    nuevaNota.evaluaciones[tipo] = evaluacionesPorTipo[tipo];
                }
            }
            await nuevaNota.save();
        }
        // Guardar estudiante y documentos asociados
        await nuevoEstudiante.save();
        await nuevaAsistencia.save();
        await nuevaObservacion.save();
        res.status(201).json({ msg: 'Estudiante registrado correctamente' });
    } catch (error) {
        console.error('Error al registrar estudiante:', error);
        res.status(500).json({ error: 'Error al registrar estudiante' });
    }
};


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
    const cursoAsignadoBDD = await CursoAsignado.findOne({ curso: cursoId, anioLectivo: req.userBDD.anio })
        .populate({
            path: 'estudiantes',
            select: 'nombre apellido cedula _id estado'
        });
    if (!cursoAsignadoBDD) return res.status(400).json({ error: 'El curso no esta registrado' });
    // Filtrar solo estudiantes activos
    const estudiantesActivos = (cursoAsignadoBDD.estudiantes || []).filter(estudiante => estudiante.estado !== false);
    if (estudiantesActivos.length === 0) return res.status(400).json({ error: 'No hay estudiantes registrados' });
    res.status(200).json(estudiantesActivos);
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

const reasignarCursoEstudiante = async (req, res) => {
    const { estudianteBDD, cursoAnterior, cursoAsignadoBDD } = req;
    try {
        // Verificar si el estudiante ya está en el curso
        const estudianteEnCurso = cursoAsignadoBDD.estudiantes.find(est => est._id.toString() === estudianteBDD._id.toString());
        // Asignar el nuevo curso al estudiante
        if (cursoAnterior) {
            await cursoAnterior.eliminarEstudiante(estudianteBDD._id);
        }
        await cursoAsignadoBDD.agregarEstudiante(estudianteBDD._id);
        res.status(200).json({ msg: 'Curso asignado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al asignar curso' });
    }
}

// ==================== ASISTENCIA ====================

// Registra la asistencia de los estudiantes de un curso
const registroAsistenciaEstudiantes = async (req, res) => {
    // Paso 1: Obtener Datos
    const { asistencias } = req.body;
    const { cursoAsignadoBDD } = req;
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
        res.status(500).json({ error: 'Error al registrar asistencia' });
    }
};

// Registra una justificación de inasistencia para un estudiante
const justificacionesEstudiantes = async (req, res) => {
    //Paso 1: Obtener los datos
    const { fecha, justificacion } = req.body;
    const { asistenciaBDD } = req;
    //Paso 2: Manipular la BDD
    try {
        const justificar = await asistenciaBDD.justificarInasistencia(fecha, justificacion);
        if (justificar?.error) return res.status(400).json({ error: justificar.error });
        await asistenciaBDD.save();
        res.status(200).json({ msg: 'Justificación registrada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar justificación' });
    }
}

// ==================== AÑO LECTIVO ====================

// Asigna ponderaciones a un año lectivo
const asignarPonderaciones = async (req, res) => {
    const { ponderaciones } = req;
    const { anioLectivoBDD } = req;
    try {
        anioLectivoBDD.ponderaciones = ponderaciones;
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
    try {
        const ultimoAnioLectivo = await AnioLectivo.findOne().sort({ fechaFin: -1 });
        let anio;
        if (ultimoAnioLectivo && ultimoAnioLectivo.estado === false) {
            anio = await AnioLectivo.iniciarPeriodo();
            await CursoAsignado.promoverEstudiantesPorNivel(ultimoAnioLectivo._id, anio._id);
        } else {
            anio = await AnioLectivo.iniciarPeriodo();
        }
        res.status(201).json({ msg: "Año Lectivo iniciado correctamente", anio });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Registra la fecha de fin de un año lectivo
const registrarFechaFin = async (req, res) => {
    const { fechaFin } = req.body;
    const { anioLectivoBDD } = req;
    try {
        const fecha = new Date(fechaFin);
        await anioLectivoBDD.establecerFechaFin(fecha);
        res.status(200).json({ msg: 'Fecha de fin registrada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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
    reasignarCursoEstudiante,
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
    eliminarCurso,
    eliminarMateria,
    //Modificar
    modificarAdministrador,
    modificarProfesor,
    modificarRepresentante,
    modificarEstudiante,
    modificarMateria
}