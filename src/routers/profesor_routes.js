import Router from 'express'
import { comprobarTokenPassword, confirmarCuenta, loginProfesor, modificarNotasEstudiantes, nuevoPassword, observacionesEstudiantes, recuperarPassword, registrarEstudiantes, registrarProfesor, registroAsistenciaEstudiantes, subirNotasEstudiantes } from '../controllers/profesor_controller.js'
import { verificarAutenticacion, verificarRolAdmin, verificarRolProfesor } from '../helpers/JWT.js'

const router = Router()

//Ruta pública
router.post('/login-profesor', loginProfesor)
router.get('/confirmar-token/:token', confirmarCuenta)
router.post('/recuperar-password', recuperarPassword)
router.get('/comprobar-cuenta/:token', comprobarTokenPassword)
router.patch('/nuevo-password/:token', nuevoPassword)

//Ruta privada
router.post('/registro-profesor', verificarAutenticacion, verificarRolAdmin, registrarProfesor)
router.post('/registro-asistencia', verificarAutenticacion, verificarRolProfesor, registroAsistenciaEstudiantes)
router.post('/registro-estudiante', verificarAutenticacion, verificarRolProfesor, registrarEstudiantes)
router.post('/registro-nota', verificarAutenticacion, verificarRolProfesor, subirNotasEstudiantes)
router.patch('/actualizar-nota', verificarAutenticacion, verificarRolProfesor, modificarNotasEstudiantes)
router.post('/observacion-estudiante', verificarAutenticacion, verificarRolProfesor, observacionesEstudiantes)

export default router