import Router from 'express'
import { asignarRepresentante, cambiarDatos, cambiarPassword, comprobarTokenPassword, confirmarCuenta, justificacionesEstudiantes, loginAdmin, nuevoPassword, recuperarPassword, registrarAdmin, registrarCurso, registrarEstudiantes, registrarMaterias, registrarProfesor, registrarRepresentante, registroAsistenciaEstudiantes } from '../controllers/admin_controller.js'
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
router.patch('/cambiar-datos', verificarAutenticacion, verificarRolAdmin, cambiarDatos)
router.post('/registro-profesor', verificarAutenticacion, verificarRolAdmin, registrarProfesor)
router.post('/registro-representante', verificarAutenticacion, verificarRolAdmin, registrarRepresentante)
router.post('/registro-curso', verificarAutenticacion, verificarRolAdmin, registrarCurso)
router.post('/registro-materia', verificarAutenticacion, verificarRolAdmin, registrarMaterias)
router.post('/registro-estudiante', verificarAutenticacion, verificarRolAdmin, registrarEstudiantes)
router.post('/asignar-representante', verificarAutenticacion, verificarRolAdmin, asignarRepresentante)
router.post('/registro-asistencia', verificarAutenticacion, verificarRolAdmin, registroAsistenciaEstudiantes)
router.patch('/justificar-inasistencia', verificarAutenticacion, verificarRolAdmin, justificacionesEstudiantes)

export default router