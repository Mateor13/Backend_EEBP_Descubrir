import Router from 'express'
import { comprobarTokenPassword, loginProfesor, nuevoPassword, recuperarPassword, registrarEstudiantes, registrarProfesor, registroAsistenciaEstudiantes } from '../controllers/profesor_controller.js'
import { verificarAutenticacion, verificarRolAdmin, verificarRolProfesor } from '../helpers/JWT.js'

const router = Router()

//Ruta pública
router.post('/login-profesor', loginProfesor)
router.post('/recuperar-password', recuperarPassword)
router.get('/comprobar-password/:token', comprobarTokenPassword)
router.patch('/nuevo-password/:token', nuevoPassword)

//Ruta privada
router.post('/registro-profesor', verificarAutenticacion, verificarRolAdmin, registrarProfesor)
router.post('/registro-asistencia', verificarAutenticacion, verificarRolProfesor, registroAsistenciaEstudiantes)
router.post('/registro-estudiante', verificarAutenticacion, verificarRolProfesor, registrarEstudiantes)

export default router