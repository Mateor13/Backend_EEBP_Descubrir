import Router from 'express'
import { asignarRepresentante, comenzarAnioLectivo, eliminarEstudiante, eliminarProfesor, justificacionesEstudiantes, listarCursos, listarEstudiantesXCurso, reasignarMateriaProfesor, reemplazarProfesor, registrarAdmin, registrarCurso, registrarEstudiantes, registrarFechaFin, registrarMaterias, registrarProfesor, registrarRepresentante, registroAsistenciaEstudiantes, terminarAnioLectivo } from '../controllers/admin_controller.js'
import { verificarAnioLectivo, verificarAutenticacion, verificarRolAdmin } from '../middlewares/JWT.js'
import { asignarRepresentanteValidator, eliminarEstudianteValidator, eliminarProfesorValidator, justificarInasistenciaValidator, reasignarMateriaProfesorValidator, reemplazarProfesorValidator, registroAdminValidator, registroAsistenciaEstudiantesValidator, registroCursoValidator, registroEstudianteValidator, registroMateriaValidator, registroProfesorValidator, registroRepresentanteValidator, terminarAnioLectivoValidator } from '../validators/admin_validator.js'
const router = Router()

//Rutas Privadas
router.post('/registro', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroAdminValidator, registrarAdmin)
router.post('/registro-profesor', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroProfesorValidator, registrarProfesor)
router.post('/registro-representante', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroRepresentanteValidator, registrarRepresentante)
router.post('/registro-curso', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroCursoValidator, registrarCurso)
router.post('/registro-materia', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroMateriaValidator, registrarMaterias)
router.post('/registro-estudiante', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroEstudianteValidator, registrarEstudiantes)
router.post('/asignar-representante', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, asignarRepresentanteValidator, asignarRepresentante)
router.post('/registro-asistencia', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registroAsistenciaEstudiantesValidator, registroAsistenciaEstudiantes)
router.patch('/justificar-inasistencia', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, justificarInasistenciaValidator, justificacionesEstudiantes)
router.get('/cursos', verificarAutenticacion, verificarRolAdmin, listarCursos)
router.get('/cursos/:cursoId/estudiantes', verificarAutenticacion, verificarRolAdmin, listarEstudiantesXCurso)
router.patch('/terminar-periodo', verificarAutenticacion, verificarRolAdmin, terminarAnioLectivoValidator, terminarAnioLectivo)
router.post('/iniciar-periodo', verificarAutenticacion, verificarRolAdmin, comenzarAnioLectivo)
router.patch('/fecha-fin-periodo', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, registrarFechaFin)
router.delete('/eliminar-profesor/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarProfesorValidator, eliminarProfesor)
router.delete('/eliminar-estudiante/:id', verificarAutenticacion, verificarAnioLectivo, verificarRolAdmin, eliminarEstudianteValidator, eliminarEstudiante)
router.patch('/reemplazar-profesor/:idProfesor/:idProfesorNuevo', verificarAnioLectivo, verificarAutenticacion, verificarRolAdmin, reemplazarProfesorValidator, reemplazarProfesor)
router.patch('/reasignar-materia/:idProfesor/:idProfesorNuevo', verificarAnioLectivo, verificarAutenticacion, verificarRolAdmin, reasignarMateriaProfesorValidator, reasignarMateriaProfesor)

export default router