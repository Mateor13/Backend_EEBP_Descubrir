// Importaciones necesarias
import Router from 'express' // Importa el enrutador de Express
import { 
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
} from '../controllers/admin_controller.js' // Importa los controladores

import { 
    verificarAnioLectivo, 
    verificarAutenticacion, 
    verificarRolAdmin 
} from '../middlewares/JWT.js' // Importa los middlewares de autenticación y autorización

import { 
    asignarPonderacionesValidator, 
    asignarRepresentanteValidator,
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
    terminarAnioLectivoValidator,
    modificarUsuarioValidator, 
    modificarEstudianteValidator,
    eliminarEstAdminValidator,
    eliminarRepresentanteValidator
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

// Modificaciones de entidades
router.patch('/modificar-administrador/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarUsuarioValidator, modificarAdministrador) // Modificar un administrador
router.patch('/modificar-profesor/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarUsuarioValidator, modificarProfesor) // Modificar un profesor
router.patch('/modificar-representante/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarUsuarioValidator, modificarRepresentante) // Modificar un representante
router.patch('/modificar-estudiante/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarEstudianteValidator, modificarEstudiante) // Modificar un estudiante 

// Justificaciones y reasignaciones
router.patch('/justificar-inasistencia', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, justificarInasistenciaValidator, justificacionesEstudiantes) // Justificar inasistencias de estudiantes
router.patch('/reemplazar-profesor/:idProfesor/:idProfesorNuevo', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, reemplazarProfesorValidator, reemplazarProfesor) // Reemplazar un profesor
router.patch('/reasignar-materia/:idProfesor/:idProfesorNuevo', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, reasignarMateriaProfesorValidator, reasignarMateriaProfesor) // Reasignar materias de un profesor a otro

// Listado de usuarios por rol y entidades
router.get('/cursos', verificarAutenticacion, verificarRolAdmin, listarCursos) // Listar todos los cursos
router.get('/cursos/:cursoId/estudiantes', verificarAutenticacion, verificarRolAdmin, listarEstudiantesXCurso) // Listar estudiantes de un curso específico
router.get('/administradores', verificarAutenticacion, verificarRolAdmin, listarAdministradores) // Listar administradores
router.get('/representantes', verificarAutenticacion, verificarRolAdmin, listarRepresentantes) // Listar representantes
router.get('/profesores', verificarAutenticacion, verificarRolAdmin, listarProfesores) // Listar profesores
router.get('/materias/:cursoId', verificarAutenticacion, verificarRolAdmin, listarMaterias) // Listar materias de un curso específico

// Gestión del año lectivo
router.patch('/terminar-periodo', verificarAutenticacion, verificarRolAdmin, terminarAnioLectivoValidator, terminarAnioLectivo) // Terminar el año lectivo
router.post('/iniciar-periodo', verificarAutenticacion, verificarRolAdmin, comenzarAnioLectivo) // Iniciar un nuevo año lectivo
router.patch('/fecha-fin-periodo', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registrarFechaFin) // Registrar la fecha de fin del año lectivo

// Eliminación de entidades
router.delete('/eliminar-profesor/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarProfesorValidator, eliminarProfesor) // Eliminar un profesor
router.delete('/eliminar-estudiante/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarEstAdminValidator, eliminarEstudiante) // Eliminar un estudiante
router.delete('/eliminar-administrador/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarEstAdminValidator, eliminarAdministrador) // Eliminar un administrador
router.delete('/eliminar-representante/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarRepresentanteValidator, eliminarRepresentante) // Eliminar un representante

export default router