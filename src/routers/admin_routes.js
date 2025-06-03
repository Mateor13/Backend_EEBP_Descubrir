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
import multer from 'multer' // Importa multer para manejar archivos
const upload = multer() // Configura multer para manejar archivos, aunque no se usará en estas rutas

const router = Router()

// Rutas privadas para la administración

// Registro de usuarios y entidades
router.post('/registro', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroAdminValidator, registrarAdmin) // Registrar un administrador
router.post('/registro-profesor', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroProfesorValidator, registrarProfesor) // Registrar un profesor
router.post('/registro-representante', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroRepresentanteValidator, registrarRepresentante) // Registrar un representante
router.post('/registro-curso', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroCursoValidator, registrarCurso) // Registrar un curso
router.post('/registro-materia', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroMateriaValidator, registrarMaterias) // Registrar materias
router.post('/registro-estudiante', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroEstudianteValidator, registrarEstudiantes) // Registrar estudiantes

// Asignaciones y modificaciones
router.post('/asignar-representante', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, asignarRepresentanteValidator, asignarRepresentante) // Asignar un representante a un estudiante
router.post('/registro-asistencia', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroAsistenciaEstudiantesValidator, registroAsistenciaEstudiantes) // Registrar asistencia de estudiantes

// Modificaciones de entidades
router.patch('/modificar-administrador/:id', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarUsuarioValidator, modificarAdministrador) // Modificar un administrador
router.patch('/modificar-profesor/:id', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarUsuarioValidator, modificarProfesor) // Modificar un profesor
router.patch('/modificar-representante/:id', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarUsuarioValidator, modificarRepresentante) // Modificar un representante
router.patch('/modificar-estudiante/:id', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarEstudianteValidator, modificarEstudiante) // Modificar un estudiante
router.patch('/reasignar-materia/:idMateria/:idProfesorNuevo', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, modificarMateriaValidator, modificarMateria) // Modificar materias de un profesor a otro

// Justificaciones y reasignaciones
router.patch('/justificar-inasistencia', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, justificarInasistenciaValidator, justificacionesEstudiantes) // Justificar inasistencias de estudiantes
router.patch('/reasignar-curso/:idCurso/:idEstudiante', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, reasignarCursoEstudianteValidator, reasignarCursoEstudiante) // Reasignar un curso a un estudiante

// Listado de usuarios por rol y entidades
router.get('/cursos', upload.none(), verificarAutenticacion, verificarRolAdmin, listarCursos) // Listar todos los cursos
router.get('/cursos/:cursoId/estudiantes', upload.none(), verificarAutenticacion, verificarRolAdmin, listarEstudiantesXCurso) // Listar estudiantes de un curso específico
router.get('/administradores', upload.none(), verificarAutenticacion, verificarRolAdmin, listarAdministradores) // Listar administradores
router.get('/representantes/:cursoId', upload.none(), verificarAutenticacion, verificarRolAdmin, listarRepresentantes) // Listar representantes
router.get('/profesores', upload.none(), verificarAutenticacion, verificarRolAdmin, listarProfesores) // Listar profesores
router.get('/materias/:cursoId', upload.none(), verificarAutenticacion, verificarRolAdmin, listarMaterias) // Listar materias de un curso específico

// Gestión del año lectivo
router.patch('/terminar-periodo', upload.none(), verificarAutenticacion, verificarRolAdmin, terminarAnioLectivoValidator, terminarAnioLectivo) // Terminar el año lectivo
router.post('/iniciar-periodo', upload.none(), verificarAutenticacion, verificarRolAdmin, comenzarAnioLectivoValidator, comenzarAnioLectivo) // Iniciar un nuevo año lectivo
router.patch('/fecha-fin-periodo', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registrarFechaFinValidator, registrarFechaFin) // Registrar la fecha de fin del año lectivo
router.post('/asignar-ponderaciones', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, asignarPonderacionesValidator, asignarPonderaciones) // Asignar ponderaciones a materias

// Eliminación de entidades
router.delete('/eliminar-profesor/:id', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarProfesorValidator, eliminarProfesor) // Eliminar un profesor
router.delete('/eliminar-estudiante/:id', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarEstAdminValidator, eliminarEstudiante) // Eliminar un estudiante
router.delete('/eliminar-administrador/:id', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarEstAdminValidator, eliminarAdministrador) // Eliminar un administrador
router.delete('/eliminar-representante/:id', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarRepresentanteValidator, eliminarRepresentante) // Eliminar un representante
router.delete('/eliminar-curso/:id', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarCursoValidator, eliminarCurso) // Eliminar un curso
router.delete('/eliminar-materia/:id', upload.none(), verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarMateriaValidator, eliminarMateria) // Eliminar una materia

export default router