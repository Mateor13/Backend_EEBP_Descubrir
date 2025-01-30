import Router from 'express'
import { modificarNotasEstudiantes, observacionesEstudiantes, subirNotasEstudiantes, visualizarCursosAsociados, visualizarEstudiantesCurso, visualizarEstudiantesPorMateria, visualizarMateriasAsignadas} from '../controllers/profesor_controller.js'
import { verificarAutenticacion, verificarRolProfesor } from '../helpers/JWT.js'

const router = Router()

//Rutas privadas
router.post('/registro-nota', verificarAutenticacion, verificarRolProfesor, subirNotasEstudiantes)
router.patch('/actualizar-nota', verificarAutenticacion, verificarRolProfesor, modificarNotasEstudiantes)
router.post('/observacion-estudiante', verificarAutenticacion, verificarRolProfesor, observacionesEstudiantes)
router.get('/estudiantes/curso', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesCurso)
router.get('/profesor/cursos', verificarAutenticacion, verificarRolProfesor, visualizarCursosAsociados)
router.get('/profesor/:cursoId/materias', verificarAutenticacion, verificarRolProfesor, visualizarMateriasAsignadas)
router.get('/profesor/:materiaId/estudiantes', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesPorMateria) 

export default router