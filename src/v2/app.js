import express from 'express'
import { crearContenedor } from './contenedor.js'
import { crearAutenticar } from './shared/middlewares/autenticacion.js'
import { manejarErrores } from './shared/middlewares/manejarErrores.js'
import { crearRutasAuth } from './modules/auth/auth.modulo.js'
import { crearRutasUsuarios } from './modules/usuarios/usuarios.modulo.js'
import { crearRutasPeriodos } from './modules/periodos/periodos.modulo.js'
import { crearRutasAcademico } from './modules/academico/academico.modulo.js'
import { crearRutasEstudiantes } from './modules/estudiantes/estudiantes.modulo.js'
import { crearRutasCalificaciones } from './modules/calificaciones/calificaciones.modulo.js'
import { crearRutasAsistencias } from './modules/asistencias/asistencias.modulo.js'
import { crearRutasObservaciones } from './modules/observaciones/observaciones.modulo.js'
import { NoEncontradoError } from './shared/errores.js'

// Construye el router de la API v2. Se monta en /api/v2 dentro del servidor principal.
export const crearApiV2 = (contenedor = crearContenedor()) => {
    const autenticar = crearAutenticar(contenedor.usuariosRepo)
    const deps = { ...contenedor, autenticar }
    const router = express.Router()

    router.use(express.json({ limit: '1mb' }))
    router.get('/salud', (req, res) => res.json({ estado: 'ok', version: 2 }))
    router.use('/auth', crearRutasAuth(deps))
    router.use('/usuarios', crearRutasUsuarios(deps))
    router.use('/periodos', crearRutasPeriodos(deps))
    router.use('/', crearRutasAcademico(deps))
    router.use('/', crearRutasEstudiantes(deps))
    router.use('/', crearRutasCalificaciones(deps))
    router.use('/', crearRutasAsistencias(deps))
    router.use('/', crearRutasObservaciones(deps))
    router.use((req, res, next) => next(new NoEncontradoError('Ruta')))
    router.use(manejarErrores)
    return router
}
