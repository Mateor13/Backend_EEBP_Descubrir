import Router from 'express'
import { verAsistenciaEstudiante, verEstudiantes, verMateriasEstudiante, verNotasEstudiante, verObservacionesEstudiante } from '../controllers/representante_controller.js'
import { verificarAutenticacion, verificarRolRepresentante } from '../middlewares/JWT.js'
import { validarIdEstudiante } from '../validators/representante_validator.js'
const router = Router()
router.get('/estudiantes-registrados', verificarAutenticacion, verificarRolRepresentante, verEstudiantes)
router.get('/materias-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verMateriasEstudiante)
router.get('/ver-notas-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verNotasEstudiante)
router.get('/ver-observaciones-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verObservacionesEstudiante)
router.get('/ver-asistencia-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verAsistenciaEstudiante)

export default router