import Router from 'express'
import { asignarRepresentante, justificacionesEstudiantes, listarCursos, registrarAdmin, registrarCurso, registrarEstudiantes, registrarMaterias, registrarProfesor, registrarRepresentante, registroAsistenciaEstudiantes } from '../controllers/admin_controller.js'
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

export default router