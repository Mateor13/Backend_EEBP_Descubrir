import Router from 'express'
import { cambiarDatos, cambiarPassword, comprobarTokenPassword, confirmarCuenta, loginAdmin, nuevoPassword, recuperarPassword, registrarAdmin } from '../controllers/admin_controller.js'
import { verificarAutenticacion, verificarRolAdmin } from '../helpers/JWT.js'

const router = Router()

//Ruta Pública
router.post('/registro', registrarAdmin)
router.get('/confirmar/:token', confirmarCuenta)
router.post('/login', loginAdmin)
router.post('/recuperar', recuperarPassword)
router.get('/recuperar/:token', comprobarTokenPassword)
router.post('/nuevo-password/:token', nuevoPassword)
router.get('/confirmar/:token')

//Ruta Privada
router.post('/cambiar-password', verificarAutenticacion, verificarRolAdmin, cambiarPassword)
router.post('/cambiar-datos', verificarAutenticacion, verificarRolAdmin, cambiarDatos)

export default router