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
    eliminarCurso,
    eliminarMateria,
    //Modificar
    modificarAdministrador,
    modificarProfesor,
    modificarRepresentante,
    modificarEstudiante,
    modificarMateria,
    //Reemplazar
    reasignarCursoEstudiante
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
    eliminarRepresentanteValidator,
    registrarFechaFinValidator,
    eliminarCursoValidator,
    eliminarMateriaValidator,
    reasignarCursoEstudianteValidator,
    comenzarAnioLectivoValidator,
    modificarMateriaValidator
} from '../validators/admin_validator.js' // Importa los validadores

const router = Router()

// Rutas privadas para la administración

// CRUD administradores
router.post('/registro', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroAdminValidator, registrarAdmin) // Registrar un administrador
router.patch('/modificar-administrador/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarUsuarioValidator, modificarAdministrador) // Modificar un administrador
router.delete('/eliminar-administrador/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarEstAdminValidator, eliminarAdministrador) // Eliminar un administrador
router.get('/administradores', verificarAutenticacion, verificarRolAdmin, listarAdministradores) // Listar administradores

//CRUD  profesores
router.post('/registro-profesor', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroProfesorValidator, registrarProfesor) // Registrar un profesor
router.delete('/eliminar-profesor/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarProfesorValidator, eliminarProfesor) // Eliminar un profesor
router.patch('/modificar-profesor/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarUsuarioValidator, modificarProfesor) // Modificar un profesor
router.get('/profesores', verificarAutenticacion, verificarRolAdmin, listarProfesores) // Listar profesores

// CRUD representantes
router.post('/registro-representante', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroRepresentanteValidator, registrarRepresentante) // Registrar un representante
router.delete('/eliminar-representante/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarRepresentanteValidator, eliminarRepresentante) // Eliminar un representante
router.patch('/modificar-representante/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarUsuarioValidator, modificarRepresentante) // Modificar un representante
router.get('/representantes/:cursoId', verificarAutenticacion, verificarRolAdmin, listarRepresentantes) // Listar representantes

// CRUD estudiantes
router.post('/registro-estudiante', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroEstudianteValidator, registrarEstudiantes) // Registrar estudiantes
router.patch('/modificar-estudiante/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarEstudianteValidator, modificarEstudiante) // Modificar un estudiante
router.delete('/eliminar-estudiante/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarEstAdminValidator, eliminarEstudiante) // Eliminar un estudiante
router.get('/cursos/:cursoId/estudiantes', verificarAutenticacion, verificarRolAdmin, listarEstudiantesXCurso) // Listar estudiantes de un curso específico
router.post('/asignar-representante', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, asignarRepresentanteValidator, asignarRepresentante) // Asignar un representante a un estudiante

// CRUD cursos
router.post('/registro-curso', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroCursoValidator, registrarCurso) // Registrar un curso
router.delete('/eliminar-curso/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarCursoValidator, eliminarCurso) // Eliminar un curso
router.get('/cursos', verificarAutenticacion, verificarRolAdmin, listarCursos) // Listar todos los cursos
router.patch('/reasignar-curso/:idCurso/:idEstudiante', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, reasignarCursoEstudianteValidator, reasignarCursoEstudiante) // Reasignar un curso a un estudiante

//CRUD materias
router.post('/registro-materia', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroMateriaValidator, registrarMaterias) // Registrar materias
router.patch('/reasignar-materia/:idMateria/:idProfesorNuevo', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarMateriaValidator, modificarMateria) // Modificar materias de un profesor a otro
router.get('/materias/:cursoId', verificarAutenticacion, verificarRolAdmin, listarMaterias) // Listar materias de un curso específico
router.delete('/eliminar-materia/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarMateriaValidator, eliminarMateria) // Eliminar una materia

// Gestión de asistencia
router.post('/registro-asistencia', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroAsistenciaEstudiantesValidator, registroAsistenciaEstudiantes) // Registrar asistencia de estudiantes
router.patch('/justificar-inasistencia', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, justificarInasistenciaValidator, justificacionesEstudiantes) // Justificar inasistencias de estudiantes

// Gestión del año lectivo
router.patch('/terminar-periodo', verificarAutenticacion, verificarRolAdmin, terminarAnioLectivoValidator, terminarAnioLectivo) // Terminar el año lectivo
router.post('/iniciar-periodo', verificarAutenticacion, verificarRolAdmin, comenzarAnioLectivoValidator, comenzarAnioLectivo) // Iniciar un nuevo año lectivo
router.patch('/fecha-fin-periodo', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registrarFechaFinValidator, registrarFechaFin) // Registrar la fecha de fin del año lectivo
router.post('/asignar-ponderaciones', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, asignarPonderacionesValidator, asignarPonderaciones) // Asignar ponderaciones a materias


export default router