import Router from 'express'
import { comprobarTokenPassword, confirmarCuenta, loginAdmin, nuevoPassword, recuperarPassword, registrarAdmin } from '../controllers/admin_controller.js'

const router = Router()

//Ruta Pública
router.post('/registro', registrarAdmin)
router.get('/confirmar/:token', confirmarCuenta)
router.post('/login', loginAdmin)
router.post('/recuperar', recuperarPassword)
router.get('/recuperar/:token', comprobarTokenPassword)
router.post('/cambiar-password/:token', nuevoPassword)

//Ruta Privada


export default router