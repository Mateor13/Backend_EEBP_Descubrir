import Router from 'express'
import { cambiarDatos, cambiarPassword, comprobarTokenPassword, confirmarCuenta, loginRepresentante, nuevaContrasenaRepresentante, recuperarContrasena } from '../controllers/representante_controller.js'
const router = Router()

//Rutas publicas
router.post('/login-representante', loginRepresentante)
router.get('/representante/confirmar/:token', confirmarCuenta)
router.post('/representante/recuperar-password', recuperarContrasena)
router.get('/representante/recuperar-password/:token', comprobarTokenPassword)
router.post('/representante/nueva-contrasena/:token', nuevaContrasenaRepresentante)

//Rutas privadas
router.post('/representante/cambiar-contraseña', cambiarPassword)
router.post('/representante/cambiar-datos', cambiarDatos)


export default router