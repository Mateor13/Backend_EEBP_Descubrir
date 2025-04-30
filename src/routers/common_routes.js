import Router from 'express';
import { cambiarDatos, cambiarPassword, comprobarTokenPassword, confirmarCuenta, listarAniosLectivos, login, nuevaContrasena, perfil, recuperarPassword } from '../controllers/common_controller.js';
import { verificarAutenticacion, verificarRolAdmin, verificarRolProfesor, verificarRolRepresentante } from '../middlewares/JWT.js';
import { confirmarCuentaValidator, loginValidator, recuperarPasswordValidator, comprobarTokenPasswordValidator, nuevaContrasenaValidator, perfilValidator, cambiarPasswordValidator, cambiarDatosValidator } from '../validators/common_validator.js';

const router = Router();

//Rutas públicas
router.post('/login', loginValidator, login)
router.get('/listar-anios', verificarAutenticacion, verificarRolAdmin, listarAniosLectivos)
router.get('/confirmar-cuenta/:token', confirmarCuentaValidator, confirmarCuenta)
router.post('/recuperar-password', recuperarPasswordValidator, recuperarPassword)
router.get('/confirmar-token/:token', comprobarTokenPasswordValidator, comprobarTokenPassword)
router.patch('/nuevo-password/:token', nuevaContrasenaValidator, nuevaContrasena)

//Rutas privadas
router.get('/perfil', perfilValidator, verificarAutenticacion, perfil)
router.patch('/cambiar-password', cambiarPasswordValidator, verificarAutenticacion, cambiarPassword)
router.patch('/cambiar-datos', verificarAutenticacion, cambiarDatosValidator, cambiarDatos)

export default router;