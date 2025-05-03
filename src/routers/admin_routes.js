// Importaciones necesarias
import Router from 'express' // Importa el enrutador de Express
import { 
    asignarPonderaciones, 
    asignarRepresentante, 
    comenzarAnioLectivo, 
    eliminarEstudiante, 
    eliminarProfesor, 
    justificacionesEstudiantes, 
    listarCursos, 
    listarEstudiantesXCurso, 
    reasignarMateriaProfesor, 
    reemplazarProfesor, 
    registrarAdmin, 
    registrarCurso, 
    registrarEstudiantes, 
    registrarFechaFin, 
    registrarMaterias, 
    registrarProfesor, 
    registrarRepresentante, 
    registroAsistenciaEstudiantes, 
    terminarAnioLectivo 
} from '../controllers/admin_controller.js' // Importa los controladores

import { 
    verificarAnioLectivo, 
    verificarAutenticacion, 
    verificarRolAdmin 
} from '../middlewares/JWT.js' // Importa los middlewares de autenticación y autorización

import { 
    asignarPonderacionesValidator, 
    asignarRepresentanteValidator, 
    eliminarEstudianteValidator, 
    eliminarProfesorValidator, 
    justificarInasistenciaValidator, 
    reasignarMateriaProfesorValidator, 
    reemplazarProfesorValidator, 
    registroAdminValidator, 
    registroAsistenciaEstudiantesValidator, 
    registroCursoValidator, 
    registroEstudianteValidator, 
    registroMateriaValidator, 
    registroProfesorValidator, 
    registroRepresentanteValidator, 
    terminarAnioLectivoValidator 
} from '../validators/admin_validator.js' // Importa los validadores

const router = Router()

// Rutas privadas para la administración

// Registro de usuarios y entidades
router.post('/registro', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroAdminValidator, registrarAdmin) // Registrar un administrador
router.post('/registro-profesor', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroProfesorValidator, registrarProfesor) // Registrar un profesor
router.post('/registro-representante', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroRepresentanteValidator, registrarRepresentante) // Registrar un representante
router.post('/registro-curso', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroCursoValidator, registrarCurso) // Registrar un curso
router.post('/registro-materia', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroMateriaValidator, registrarMaterias) // Registrar materias
router.post('/registro-estudiante', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroEstudianteValidator, registrarEstudiantes) // Registrar estudiantes

// Asignaciones y modificaciones
router.post('/asignar-representante', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, asignarRepresentanteValidator, asignarRepresentante) // Asignar un representante a un estudiante
router.post('/registro-asistencia', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroAsistenciaEstudiantesValidator, registroAsistenciaEstudiantes) // Registrar asistencia de estudiantes
router.post('/asignar-ponderaciones', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, asignarPonderacionesValidator, asignarPonderaciones) // Asignar ponderaciones a materias

// Justificaciones y reasignaciones
router.patch('/justificar-inasistencia', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, justificarInasistenciaValidator, justificacionesEstudiantes) // Justificar inasistencias de estudiantes
router.patch('/reemplazar-profesor/:idProfesor/:idProfesorNuevo', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, reemplazarProfesorValidator, reemplazarProfesor) // Reemplazar un profesor
router.patch('/reasignar-materia/:idProfesor/:idProfesorNuevo', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, reasignarMateriaProfesorValidator, reasignarMateriaProfesor) // Reasignar materias de un profesor a otro

// Gestión de cursos y estudiantes
router.get('/cursos', verificarAutenticacion, verificarRolAdmin, listarCursos) // Listar todos los cursos
router.get('/cursos/:cursoId/estudiantes', verificarAutenticacion, verificarRolAdmin, listarEstudiantesXCurso) // Listar estudiantes de un curso específico

// Gestión del año lectivo
router.patch('/terminar-periodo', verificarAutenticacion, verificarRolAdmin, terminarAnioLectivoValidator, terminarAnioLectivo) // Terminar el año lectivo
router.post('/iniciar-periodo', verificarAutenticacion, verificarRolAdmin, comenzarAnioLectivo) // Iniciar un nuevo año lectivo
router.patch('/fecha-fin-periodo', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registrarFechaFin) // Registrar la fecha de fin del año lectivo

// Eliminación de entidades
router.delete('/eliminar-profesor/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarProfesorValidator, eliminarProfesor) // Eliminar un profesor
router.delete('/eliminar-estudiante/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarEstudianteValidator, eliminarEstudiante) // Eliminar un estudiante


export default router