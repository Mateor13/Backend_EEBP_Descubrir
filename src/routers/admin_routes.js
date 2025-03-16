import Router from 'express'
import { asignarRepresentante, comenzarAnioLectivo, justificacionesEstudiantes, listarCursos, listarEstudiantesXCurso, registrarAdmin, registrarCurso, registrarEstudiantes, registrarMaterias, registrarProfesor, registrarRepresentante, registroAsistenciaEstudiantes, terminarAnioLectivo } from '../controllers/admin_controller.js'
import { verificarAutenticacion, verificarRolAdmin } from '../helpers/JWT.js'

const router = Router()

//Rutas Privadas
router.post('/registro', verificarAutenticacion, verificarRolAdmin, registrarAdmin)
router.post('/registro-profesor', verificarAutenticacion, verificarRolAdmin, registrarProfesor)
router.post('/registro-representante', verificarAutenticacion, verificarRolAdmin, registrarRepresentante)
router.post('/registro-curso', verificarAutenticacion, verificarRolAdmin, registrarCurso)
router.post('/registro-materia', verificarAutenticacion, verificarRolAdmin, registrarMaterias)
router.post('/registro-estudiante', verificarAutenticacion, verificarRolAdmin, registrarEstudiantes)
router.post('/asignar-representante', verificarAutenticacion, verificarRolAdmin, asignarRepresentante)
router.post('/registro-asistencia', verificarAutenticacion, verificarRolAdmin, registroAsistenciaEstudiantes)
router.patch('/justificar-inasistencia', verificarAutenticacion, verificarRolAdmin, justificacionesEstudiantes)
router.get('/cursos', verificarAutenticacion, verificarRolAdmin, listarCursos)
router.get('/cursos/:cursoId/estudiantes', verificarAutenticacion, verificarRolAdmin, listarEstudiantesXCurso)
router.post('/terminar-periodo', verificarAutenticacion, verificarRolAdmin, terminarAnioLectivo)
router.post('/iniciar-periodo', verificarAutenticacion, verificarRolAdmin, comenzarAnioLectivo)

export default router