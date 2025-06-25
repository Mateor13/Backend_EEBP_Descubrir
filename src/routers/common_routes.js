// Importaciones necesarias
import Router from 'express'; // Importa el enrutador de Express
import {
    cambiarDatos,
    cambiarPassword,
    confirmarCuenta,
    listarAniosLectivos,
    login,
    nuevaContrasena,
    perfil,
    recuperarPassword
} from '../controllers/common_controller.js'; // Importa los controladores

import {
    verificarAutenticacion
} from '../middlewares/JWT.js'; // Importa el middleware de autenticación

import {
    confirmarCuentaValidator,
    loginValidator,
    recuperarPasswordValidator,
    nuevaContrasenaValidator,
    perfilValidator,
    cambiarPasswordValidator,
    cambiarDatosValidator
} from '../validators/common_validator.js'; // Importa los validadores
import multer from 'multer'; // Importa multer para manejar archivos
const upload = multer(); // Configura multer para manejar archivos, aunque no se usará en estas rutas

const router = Router();

// Rutas públicas
// Estas rutas no requieren autenticación
router.post('/login', upload.none(), loginValidator, login); // Iniciar sesión
router.get('/listar-anios', upload.none(), listarAniosLectivos); // Listar años lectivos
router.get('/confirmar-cuenta/:token', upload.none(), confirmarCuentaValidator, confirmarCuenta); // Confirmar cuenta mediante un token
router.post('/recuperar-password', upload.none(), recuperarPasswordValidator, recuperarPassword); // Solicitar recuperación de contraseña
router.patch('/nuevo-password/:token', upload.none(), nuevaContrasenaValidator, nuevaContrasena); // Establecer una nueva contraseña

// Rutas privadas
// Estas rutas requieren autenticación
router.get('/perfil', upload.none(), verificarAutenticacion, perfilValidator, perfil); // Ver perfil del usuario autenticado
router.patch('/cambiar-password', upload.none(), verificarAutenticacion, cambiarPasswordValidator, cambiarPassword); // Cambiar contraseña del usuario autenticado
router.patch('/cambiar-datos', upload.none(), verificarAutenticacion, cambiarDatosValidator, cambiarDatos); // Cambiar datos del usuario autenticado

export default router;