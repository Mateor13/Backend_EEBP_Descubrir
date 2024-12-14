import Router from 'express'
import { confirmarCuenta, loginAdmin, registrarAdmin } from '../controllers/admin_controller.js'

const router = Router()

router.post('/registro', registrarAdmin)
router.get('/confirmar/:token', confirmarCuenta)
router.post('/login', loginAdmin)

export default router