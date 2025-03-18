import Router from 'express';
import { cambiarDatos, cambiarPassword, comprobarTokenPassword, confirmarCuenta, login, nuevaContrasena, perfil, recuperarPassword } from '../controllers/common_controller.js';
import { verificarAutenticacion, verificarRolAdmin, verificarRolProfesor, verificarRolRepresentante } from '../middlewares/JWT.js';

const router = Router();

//Rutas públicas
router.post('/login', login)
router.get('/confirmar-cuenta/:token', confirmarCuenta)
router.post('/recuperar-password', recuperarPassword)
router.get('/confirmar-token/:token', comprobarTokenPassword)
router.patch('/nuevo-password/:token', nuevaContrasena)

//Rutas privadas
router.get('/perfil', verificarAutenticacion, perfil)
router.patch('/cambiar-password', verificarAutenticacion, cambiarPassword)
router.patch('/cambiar-datos', verificarAutenticacion, cambiarDatos)

export default router;