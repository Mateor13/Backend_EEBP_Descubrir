import { Router } from 'express'
import { z } from 'zod'
import { ruta } from '../../shared/middlewares/ruta.js'
import { validar } from '../../shared/middlewares/validar.js'
import { autorizar } from '../../shared/middlewares/autenticacion.js'
import { ROLES, TODOS_LOS_ROLES } from '../../shared/roles.js'
import { cedula, email, nombrePropio, paramsId, telefono } from '../../shared/esquemas.js'

const datosUsuario = {
    nombre: nombrePropio, apellido: nombrePropio, cedula, email, telefono,
    direccion: z.string().trim().min(5, 'La dirección debe tener entre 5 y 120 caracteres').max(120),
    roles: z.array(z.enum(TODOS_LOS_ROLES)).min(1, 'Debe indicar al menos un rol').transform(r => [...new Set(r)])
}
const esquemas = {
    crear: z.object(datosUsuario).strict(),
    actualizar: z.object(datosUsuario).partial().strict(),
    listar: z.object({ rol: z.enum(TODOS_LOS_ROLES).optional(), activo: z.enum(['true', 'false']).default('true').transform(v => v === 'true') })
}

const crearControlador = (servicio) => ({
    crear: async (req, res) => res.status(201).json(await servicio.crear(req.body)),
    listar: async (req, res) => res.json(await servicio.listar(req.consulta)),
    obtener: async (req, res) => res.json(await servicio.obtener(req.params.id)),
    actualizar: async (req, res) => res.json(await servicio.actualizar(req.params.id, req.body)),
    desactivar: async (req, res) => { await servicio.desactivar(req.params.id, req.usuario.id); res.status(204).end() },
    reenviar: async (req, res) => { await servicio.reenviarActivacion(req.params.id); res.json({ mensaje: 'Enlace de activación reenviado' }) }
})

// Gestión de cuentas: solo administradores
export const crearRutasUsuarios = ({ usuariosServicio, autenticar }) => {
    const c = crearControlador(usuariosServicio)
    const router = Router()
    router.use(autenticar, autorizar(ROLES.ADMIN))
    router.post('/', validar({ body: esquemas.crear }), ruta(c.crear))
    router.get('/', validar({ query: esquemas.listar }), ruta(c.listar))
    router.get('/:id', validar({ params: paramsId }), ruta(c.obtener))
    router.patch('/:id', validar({ params: paramsId, body: esquemas.actualizar }), ruta(c.actualizar))
    router.delete('/:id', validar({ params: paramsId }), ruta(c.desactivar))
    router.post('/:id/reenviar-activacion', validar({ params: paramsId }), ruta(c.reenviar))
    return router
}
