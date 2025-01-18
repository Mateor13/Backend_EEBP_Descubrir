import Router from 'express';
import { cambiarDatos, cambiarPassword, comprobarTokenPassword, confirmarCuenta, login, nuevaContrasena, recuperarPassword } from '../controllers/common_controller.js';
import { verificarAutenticacion, verificarRolAdmin, verificarRolProfesor, verificarRolRepresentante } from '../helpers/JWT.js';

const router = Router();

//Rutas públicas
router.post('/login', login)
router.get('/confirmar-cuenta/:token', confirmarCuenta)
router.post('/recuperar-password', recuperarPassword)
router.get('/confirmar-token/:token', comprobarTokenPassword)
router.patch('/nuevo-password/:token', nuevaContrasena)

//Rutas privadas
router.patch('/cambiar-password', verificarAutenticacion, cambiarPassword)
router.patch('/cambiar-datos', verificarAutenticacion, cambiarDatos)

export default router;