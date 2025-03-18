import Router from 'express'
import { asignarRepresentante, comenzarAnioLectivo, justificacionesEstudiantes, listarCursos, listarEstudiantesXCurso, registrarAdmin, registrarCurso, registrarEstudiantes, registrarFechaFin, registrarMaterias, registrarProfesor, registrarRepresentante, registroAsistenciaEstudiantes, terminarAnioLectivo } from '../controllers/admin_controller.js'
import { verificarAutenticacion, verificarRolAdmin } from '../middlewares/JWT.js'
import { asignarRepresentanteValidator, justificarInasistenciaValidator, registroAdminValidator, registroAsistenciaEstudiantesValidator, registroCursoValidator, registroEstudianteValidator, registroMateriaValidator, registroProfesorValidator, registroRepresentanteValidator } from '../validators/admin_validator.js'
const router = Router()

//Rutas Privadas
router.post('/registro', verificarAutenticacion, verificarRolAdmin, registroAdminValidator, registrarAdmin)
router.post('/registro-profesor', verificarAutenticacion, verificarRolAdmin, registroProfesorValidator, registrarProfesor)
router.post('/registro-representante', verificarAutenticacion, verificarRolAdmin, registroRepresentanteValidator, registrarRepresentante)
router.post('/registro-curso', verificarAutenticacion, verificarRolAdmin, registroCursoValidator, registrarCurso)
router.post('/registro-materia', verificarAutenticacion, verificarRolAdmin, registroMateriaValidator, registrarMaterias)
router.post('/registro-estudiante', verificarAutenticacion, verificarRolAdmin, registroEstudianteValidator, registrarEstudiantes)
router.post('/asignar-representante', verificarAutenticacion, verificarRolAdmin, asignarRepresentanteValidator, asignarRepresentante)
router.post('/registro-asistencia', verificarAutenticacion, verificarRolAdmin, registroAsistenciaEstudiantesValidator, registroAsistenciaEstudiantes)
router.patch('/justificar-inasistencia', verificarAutenticacion, verificarRolAdmin, justificarInasistenciaValidator, justificacionesEstudiantes)
router.get('/cursos', verificarAutenticacion, verificarRolAdmin, listarCursos)
router.get('/cursos/:cursoId/estudiantes', verificarAutenticacion, verificarRolAdmin, listarEstudiantesXCurso)
router.patch('/terminar-periodo', verificarAutenticacion, verificarRolAdmin, terminarAnioLectivo)
router.post('/iniciar-periodo', verificarAutenticacion, verificarRolAdmin, comenzarAnioLectivo)
router.patch('/fecha-fin-periodo', verificarAutenticacion, verificarRolAdmin, registrarFechaFin)

export default router