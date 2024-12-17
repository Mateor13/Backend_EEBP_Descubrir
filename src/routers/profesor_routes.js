import Router from 'express'
import { crearPassword } from '../controllers/profesor_controller.js'

const router = Router()
router.get('/crear-password', crearPassword)
export default router