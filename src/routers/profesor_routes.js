import Router from 'express'
import { modificarNotasEstudiantes, observacionesEstudiantes, subirNotasEstudiantes, visualizarCursosAsignados, visualizarEstudiante, visualizarEstudiantesCurso, visualizarMateriasAsignadas} from '../controllers/profesor_controller.js'
import { verificarAutenticacion, verificarRolProfesor } from '../helpers/JWT.js'

const router = Router()

//Rutas privadas
router.post('/registro-nota', verificarAutenticacion, verificarRolProfesor, subirNotasEstudiantes)
router.patch('/actualizar-nota', verificarAutenticacion, verificarRolProfesor, modificarNotasEstudiantes)
router.post('/observacion-estudiante', verificarAutenticacion, verificarRolProfesor, observacionesEstudiantes)
router.get('/estudiantes/curso', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesCurso)
router.get('/profesor/materias', verificarAutenticacion, verificarRolProfesor, visualizarMateriasAsignadas)
router.get('/estudiante-materia', verificarAutenticacion, verificarRolProfesor, visualizarEstudiante) 

export default router