// Importaciones necesarias
import Router from 'express'; // Importa el enrutador de Express
import { 
    modificarNotasEstudiantes, 
    observacionesEstudiantes, 
    subirNotasEstudiantes, 
    visualizarCursosAsociados, 
    visualizarEstudiantesCurso, 
    visualizarEstudiantesDescripcion, 
    visualizarMateriasAsignadas, 
    visualizarTiposEstudiantes
} from '../controllers/profesor_controller.js'; // Importa los controladores

import { 
    verificarAutenticacion, 
    verificarRolProfesor 
} from '../middlewares/JWT.js'; // Importa los middlewares de autenticación y autorización

import { 
    modificarNotasEstudiantesValidator, 
    observacionesEstudiantesValidator, 
    subirNotasEstudiantesValidator, 
    visualizarEstudiantesCursoValidator,
    visualizarEstudiantesPorTipoValidator,
    visualizarMateriasAsignadasValidator,
    visualizarTiposNotasEstudiantesValidator, 
} from '../validators/profesor_validator.js'; // Importa los validadores

const router = Router();

// Rutas privadas para profesores
// Estas rutas requieren autenticación y el rol de profesor

// Gestión de notas
router.post('/registro-nota/:materiaId', verificarAutenticacion, verificarRolProfesor, subirNotasEstudiantesValidator, subirNotasEstudiantes); // Registrar notas de estudiantes
router.patch('/actualizar-nota/:materiaId', verificarAutenticacion, verificarRolProfesor, modificarNotasEstudiantesValidator, modificarNotasEstudiantes); // Modificar notas de estudiantes

// Observaciones
router.post('/observacion-estudiante', verificarAutenticacion, verificarRolProfesor, observacionesEstudiantesValidator, observacionesEstudiantes); // Registrar observaciones para estudiantes

// Visualización de cursos y estudiantes
router.get('/profesor/cursos', verificarAutenticacion, verificarRolProfesor, visualizarCursosAsociados); // Ver cursos asociados al profesor
router.get('/profesor/:cursoId/materias', verificarAutenticacion, verificarRolProfesor, visualizarMateriasAsignadasValidator, visualizarMateriasAsignadas); // Ver materias asignadas a un curso
router.get('/estudiantes/:cursoId', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesCursoValidator, visualizarEstudiantesCurso); // Ver estudiantes de un curso
router.get('/tipos/:materiaId/:tipo', verificarAutenticacion, verificarRolProfesor, visualizarTiposNotasEstudiantesValidator, visualizarTiposEstudiantes); // Ver notas de estudiantes por materia
router.post('/descripcion/:materiaId/:tipo', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesPorTipoValidator, visualizarEstudiantesDescripcion); // Ver estudiantes de un curso y materia

export default router;