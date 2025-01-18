import Router from 'express'
import { verEstudiantes, verNotasEstudiante, verObservacionesEstudiante } from '../controllers/representante_controller.js'
import { verificarAutenticacion } from '../helpers/JWT.js'
const router = Router()

router.get('/estudiantes-registrados', verificarAutenticacion, verEstudiantes)
router.get('/ver-notas-estudiante/:idEstudiante', verificarAutenticacion, verNotasEstudiante)
router.get('/ver-observaciones-estudiante/:idEstudiante', verificarAutenticacion, verObservacionesEstudiante)

export default router