// Importaciones necesarias
import Router from 'express'; // Importa el enrutador de Express
import multer from 'multer'; // Importa multer para manejar archivos
import { 
    modificarNotasEstudiantes, 
    observacionesEstudiantes, 
    subirNotasEstudiantes, 
    visualizarCursosAsociados, 
    visualizarEstudiantesCurso, 
    visualizarEstudiantesDescripcion, 
    visualizarMateriasAsignadas, 
    visualizarTiposEstudiantes,
    subirFotoEvidencia
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
    subirEvidenciaImgur,
    subirEvidenciasEstudiantesValidator
} from '../validators/profesor_validator.js'; // Importa los validadores

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
// Rutas privadas para profesores
// Estas rutas requieren autenticación y el rol de profesor

// Gestión de notas
router.post('/registro-nota/:materiaId', upload.none(),verificarAutenticacion, verificarRolProfesor, subirNotasEstudiantesValidator, subirNotasEstudiantes); // Registrar notas de estudiantes
router.patch('/actualizar-nota/:materiaId', upload.none(),verificarAutenticacion, verificarRolProfesor, modificarNotasEstudiantesValidator, modificarNotasEstudiantes); // Modificar notas de estudiantes
router.post('/subir-evidencia/:materiaId/:cursoId', verificarAutenticacion, verificarRolProfesor, upload.single('imagen'), subirEvidenciaImgur, subirEvidenciasEstudiantesValidator, subirFotoEvidencia); // Subir evidencia de notas de estudiantes

// Observaciones
router.post('/observacion-estudiante', upload.none(), verificarAutenticacion, verificarRolProfesor, observacionesEstudiantesValidator, observacionesEstudiantes); // Registrar observaciones para estudiantes

// Visualización de cursos y estudiantes
router.get('/profesor/cursos', upload.none(), verificarAutenticacion, verificarRolProfesor, visualizarCursosAsociados); // Ver cursos asociados al profesor
router.get('/profesor/:cursoId/materias', upload.none(), verificarAutenticacion, verificarRolProfesor, visualizarMateriasAsignadasValidator, visualizarMateriasAsignadas); // Ver materias asignadas a un curso
router.get('/estudiantes/:cursoId', upload.none(), verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesCursoValidator, visualizarEstudiantesCurso); // Ver estudiantes de un curso
router.get('/tipos/:materiaId/:tipo', upload.none(), verificarAutenticacion, verificarRolProfesor, visualizarTiposNotasEstudiantesValidator, visualizarTiposEstudiantes); // Ver notas de estudiantes por materia
router.post('/descripcion/:materiaId/:tipo', upload.none(), verificarAutenticacion, verificarRolProfesor, visualizarEstudiantesPorTipoValidator, visualizarEstudiantesDescripcion); // Ver estudiantes de un curso y materia

export default router;