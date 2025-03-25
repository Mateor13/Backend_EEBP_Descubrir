import Router from 'express'
import { verAsistenciaEstudiante, verEstudiantes, verNotasEstudiante, verObservacionesEstudiante } from '../controllers/representante_controller.js'
import { verificarAutenticacion, verificarRolRepresentante } from '../middlewares/JWT.js'
import { verAsistenciaEstudianteValidator, verNotasEstudianteValidator, verObservacionesEstudianteValidator } from '../validators/representante_validator.js'
const router = Router()

router.get('/estudiantes-registrados', verificarAutenticacion, verificarRolRepresentante, verEstudiantes)
router.get('/ver-notas-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, verNotasEstudianteValidator, verNotasEstudiante)
router.get('/ver-observaciones-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, verObservacionesEstudianteValidator, verObservacionesEstudiante)
router.get('/ver-asistencia-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, verAsistenciaEstudianteValidator, verAsistenciaEstudiante)

export default router