// Importaciones necesarias
import Router from 'express'; // Importa el enrutador de Express
import { 
    modificarNotasEstudiantes, 
    observacionesEstudiantes, 
    subirNotasEstudiantes, 
    visualizarCursosAsociados, 
    visualizarEstudiantesCurso, 
    visualizarEstudiantesPorMateria, 
    visualizarMateriasAsignadas 
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
    visualizarEstudiantesPorMateriaValidator 
} from '../validators/profesor_validator.js'; // Importa los validadores

// Crear el enrutador
const router = Router();

// Rutas privadas para profesores
// Estas rutas requieren autenticación y el rol de profesor

// Gestión de notas
router.post('/registro-nota', verificarAutenticacion, verificarRolProfesor, subirNotasEstudiantesValidator, subirNotasEstudiantes); // Registrar notas de estudiantes
router.patch('/actualizar-nota', verificarAutenticacion, verificarRolProfesor, modificarNotasEstudiantesValidator, modificarNotasEstudiantes); // Modificar notas de estudiantes

// Observaciones
router.post('/observacion-estudiante', verificarAutenticacion, verificarRolProfesor, observacionesEstudiantesValidator, observacionesEstudiantes); // Registrar observaciones para estudiantes

// Visualización de cursos y estudiantes
router.get('/estudiantes/curso', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesCursoValidator, visualizarEstudiantesCurso); // Ver estudiantes de un curso
router.get('/profesor/cursos', verificarAutenticacion, verificarRolProfesor, visualizarCursosAsociados); // Ver cursos asociados al profesor
router.get('/profesor/:cursoId/materias', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesCursoValidator, visualizarMateriasAsignadas); // Ver materias asignadas a un curso
router.get('/profesor/:materiaId/estudiantes', verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesPorMateriaValidator, visualizarEstudiantesPorMateria); // Ver estudiantes de una materia específica

// Exportar el enrutador
export default router;