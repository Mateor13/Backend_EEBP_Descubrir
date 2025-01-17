import Router from 'express'
import { comprobarTokenPassword, confirmarCuenta, loginProfesor, modificarNotasEstudiantes, nuevoPassword, observacionesEstudiantes, recuperarPassword, subirNotasEstudiantes, visualizarCursosAsignados, visualizarEstudiante, visualizarEstudiantesCurso} from '../controllers/profesor_controller.js'
import { verificarAutenticacion, verificarRolProfesor } from '../helpers/JWT.js'

const router = Router()

//Ruta pública
router.post('/login-profesor', loginProfesor)
router.get('/confirmar-token/:token', confirmarCuenta)
router.post('/recuperar-password', recuperarPassword)
router.get('/comprobar-cuenta/:token', comprobarTokenPassword)
router.patch('/nuevo-password/:token', nuevoPassword)

//Ruta privada
router.post('/registro-nota', verificarAutenticacion, verificarRolProfesor, subirNotasEstudiantes)
router.patch('/actualizar-nota', verificarAutenticacion, verificarRolProfesor, modificarNotasEstudiantes)
router.post('/observacion-estudiante', verificarAutenticacion, verificarRolProfesor, observacionesEstudiantes)
router.get('/estudiantes/curso', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesCurso)
router.get('/cursos', verificarAutenticacion, verificarRolProfesor, visualizarCursosAsignados)
router.get('/estudiante-materia', verificarAutenticacion, verificarRolProfesor, visualizarEstudiante) 

export default router