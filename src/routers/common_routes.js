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

const router = Router();

// Rutas públicas
// Estas rutas no requieren autenticación
router.post('/login', loginValidator, login); // Iniciar sesión
router.get('/listar-anios', listarAniosLectivos); // Listar años lectivos
router.get('/confirmar-cuenta/:token', confirmarCuentaValidator, confirmarCuenta); // Confirmar cuenta mediante un token
router.post('/recuperar-password', recuperarPasswordValidator, recuperarPassword); // Solicitar recuperación de contraseña
router.patch('/nuevo-password/:token', nuevaContrasenaValidator, nuevaContrasena); // Establecer una nueva contraseña

// Rutas privadas
// Estas rutas requieren autenticación
router.get('/perfil', verificarAutenticacion, perfilValidator, perfil); // Ver perfil del usuario autenticado
router.patch('/cambiar-password', verificarAutenticacion, cambiarPasswordValidator, cambiarPassword); // Cambiar contraseña del usuario autenticado
router.patch('/cambiar-datos', verificarAutenticacion, cambiarDatosValidator, cambiarDatos); // Cambiar datos del usuario autenticado

export default router;