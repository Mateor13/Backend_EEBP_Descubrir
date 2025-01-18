import Router from 'express'
import { verAsistenciaEstudiante, verEstudiantes, verNotasEstudiante, verObservacionesEstudiante } from '../controllers/representante_controller.js'
import { verificarAutenticacion, verificarRolRepresentante } from '../helpers/JWT.js'
const router = Router()

router.get('/estudiantes-registrados', verificarAutenticacion, verificarRolRepresentante, verEstudiantes)
router.get('/ver-notas-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, verNotasEstudiante)
router.get('/ver-observaciones-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, verObservacionesEstudiante)
router.get('/ver-asistencia-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, verAsistenciaEstudiante)

export default router