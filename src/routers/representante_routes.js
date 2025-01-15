import Router from 'express'
import { loginRepresentante } from '../controllers/representante_controller.js'
const router = Router()

router.post('/login-representante', loginRepresentante)

export default router