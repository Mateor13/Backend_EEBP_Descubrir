import { Router } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { ruta } from '../../shared/middlewares/ruta.js'
import { validar } from '../../shared/middlewares/validar.js'
import { email, password, nombrePropio, telefono } from '../../shared/esquemas.js'

// ---------- Esquemas (solo forma de los datos) ----------
const esquemas = {
    login: z.object({ email, password: z.string().min(1, 'La contraseña es obligatoria') }),
    tokenYPassword: z.object({ token: z.string().length(64, 'Token no válido'), password }),
    recuperar: z.object({ email }),
    perfil: z.object({
        nombre: nombrePropio.optional(), apellido: nombrePropio.optional(), email: email.optional(),
        telefono: telefono.optional(), direccion: z.string().trim().min(5).max(120).optional()
    }).strict(),
    cambiarPassword: z.object({ actual: z.string().min(1), nueva: password })
        .refine(d => d.actual !== d.nueva, { message: 'La nueva contraseña debe ser diferente', path: ['nueva'] })
}

// ---------- Controlador: traduce HTTP <-> servicio, sin lógica de negocio ----------
const crearControlador = (servicio) => ({
    login: async (req, res) => res.json(await servicio.login(req.body)),
    activar: async (req, res) => { await servicio.activarCuenta(req.body); res.json({ mensaje: 'Cuenta activada, ya puede iniciar sesión' }) },
    recuperar: async (req, res) => {
        await servicio.solicitarRecuperacion(req.body)
        res.json({ mensaje: 'Si el email está registrado, recibirá un enlace para restablecer su contraseña' })
    },
    restablecer: async (req, res) => { await servicio.restablecerPassword(req.body); res.json({ mensaje: 'Contraseña actualizada' }) },
    perfil: async (req, res) => res.json(await servicio.perfil(req.usuario.id)),
    actualizarPerfil: async (req, res) => res.json(await servicio.actualizarPerfil(req.usuario.id, req.body)),
    cambiarPassword: async (req, res) => { await servicio.cambiarPassword(req.usuario.id, req.body); res.status(204).end() }
})

// ---------- Rutas ----------
export const crearRutasAuth = ({ authServicio, autenticar }) => {
    const c = crearControlador(authServicio)
    const limite = rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.AUTH_LIMITE_INTENTOS) || 10, standardHeaders: 'draft-7', legacyHeaders: false,
        message: { error: 'Demasiados intentos, intente de nuevo en 15 minutos' } })
    const router = Router()
    router.post('/login', limite, validar({ body: esquemas.login }), ruta(c.login))
    router.post('/activar', limite, validar({ body: esquemas.tokenYPassword }), ruta(c.activar))
    router.post('/recuperar', limite, validar({ body: esquemas.recuperar }), ruta(c.recuperar))
    router.post('/restablecer', limite, validar({ body: esquemas.tokenYPassword }), ruta(c.restablecer))
    router.get('/perfil', autenticar, ruta(c.perfil))
    router.patch('/perfil', autenticar, validar({ body: esquemas.perfil }), ruta(c.actualizarPerfil))
    router.patch('/password', autenticar, validar({ body: esquemas.cambiarPassword }), ruta(c.cambiarPassword))
    return router
}
