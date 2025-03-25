import Router from 'express'
import { modificarNotasEstudiantes, observacionesEstudiantes, subirNotasEstudiantes, visualizarCursosAsociados, visualizarEstudiantesCurso, visualizarEstudiantesPorMateria, visualizarMateriasAsignadas} from '../controllers/profesor_controller.js'
import { verificarAutenticacion, verificarRolProfesor } from '../middlewares/JWT.js'
import { modificarNotasEstudiantesValidator, observacionesEstudiantesValidator, subirNotasEstudiantesValidator, visualizarEstudiantesCursoValidator, visualizarEstudiantesPorMateriaValidator } from '../validators/profesor_validator.js'

const router = Router()

//Rutas privadas
router.post('/registro-nota', verificarAutenticacion, verificarRolProfesor, subirNotasEstudiantesValidator, subirNotasEstudiantes)
router.patch('/actualizar-nota', verificarAutenticacion, verificarRolProfesor, modificarNotasEstudiantesValidator, modificarNotasEstudiantes)
router.post('/observacion-estudiante', verificarAutenticacion, verificarRolProfesor, observacionesEstudiantesValidator, observacionesEstudiantes)
router.get('/estudiantes/curso', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesCursoValidator, visualizarEstudiantesCurso)
router.get('/profesor/cursos', verificarAutenticacion, verificarRolProfesor, visualizarCursosAsociados)
router.get('/profesor/:cursoId/materias', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesCursoValidator, visualizarMateriasAsignadas)
router.get('/profesor/:materiaId/estudiantes', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesPorMateriaValidator, visualizarEstudiantesPorMateria) 

export default router