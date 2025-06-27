import Router from 'express'
import { verAsistenciaEstudiante, verEstudiantes, verMateriasEstudiante, verNotasEstudiante, verObservacionesEstudiante } from '../controllers/representante_controller.js'
import { verificarAutenticacion, verificarRolRepresentante } from '../middlewares/JWT.js'
import { validarIdEstudiante } from '../validators/representante_validator.js'
// Enrutador para las rutas de representante
const router = Router()

// Rutas privadas para representantes
// Estas rutas requieren autenticación y el rol de representante 
router.get('/estudiantes-registrados', verificarAutenticacion, verificarRolRepresentante, verEstudiantes) // Ver estudiantes registrados por el representante
router.get('/materias-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verMateriasEstudiante) // Ver materias de un estudiante
router.get('/ver-notas-estudiante/:idEstudiante/:idMateria', verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verNotasEstudiante) // Ver notas de un estudiante en una materia específica
router.get('/ver-observaciones-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verObservacionesEstudiante) // Ver observaciones de un estudiante
router.get('/ver-asistencia-estudiante/:idEstudiante', verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verAsistenciaEstudiante) // Ver asistencia de un estudiante

export default router