import Router from 'express'
import { verAsistenciaEstudiante, verEstudiantes, verMateriasEstudiante, verNotasEstudiante, verObservacionesEstudiante } from '../controllers/representante_controller.js'
import { verificarAutenticacion, verificarRolRepresentante } from '../middlewares/JWT.js'
import { validarIdEstudiante } from '../validators/representante_validator.js'
import multer from 'multer'
const upload = multer() // Configura multer para manejar archivos, aunque no se usará en estas rutas
// Importa las rutas del representante
const router = Router()
router.get('/estudiantes-registrados', upload.none(), verificarAutenticacion, verificarRolRepresentante, verEstudiantes)
router.get('/materias-estudiante/:idEstudiante', upload.none(), verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verMateriasEstudiante)
router.get('/ver-notas-estudiante/:idEstudiante/:idMateria', upload.none(), verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verNotasEstudiante)
router.get('/ver-observaciones-estudiante/:idEstudiante', upload.none(), verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verObservacionesEstudiante)
router.get('/ver-asistencia-estudiante/:idEstudiante', upload.none(), verificarAutenticacion, verificarRolRepresentante, validarIdEstudiante, verAsistenciaEstudiante)

export default router