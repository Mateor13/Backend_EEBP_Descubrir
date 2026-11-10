import { Router } from 'express'
import { z } from 'zod'
import { ruta } from '../../shared/middlewares/ruta.js'
import { validar } from '../../shared/middlewares/validar.js'
import { autorizar } from '../../shared/middlewares/autenticacion.js'
import { ROLES } from '../../shared/roles.js'
import { idMongo, paramsId } from '../../shared/esquemas.js'

const esquemas = {
    crear: z.strictObject({ texto: z.string().trim().min(5, 'La observación debe tener al menos 5 caracteres').max(1000) }),
    periodo: z.object({ periodo: idMongo.optional() })
}

export const crearRutasObservaciones = ({ observacionesServicio: s, autenticar }) => {
    const router = Router()
    router.use(autenticar)
    router.post('/estudiantes/:id/observaciones', autorizar(ROLES.ADMIN, ROLES.PROFESOR), validar({ params: paramsId, body: esquemas.crear }),
        ruta(async (req, res) => res.status(201).json(await s.crear(req.usuario, req.params.id, req.body.texto))))
    router.get('/estudiantes/:id/observaciones', validar({ params: paramsId, query: esquemas.periodo }),
        ruta(async (req, res) => res.json(await s.listar(req.usuario, req.params.id, req.consulta.periodo))))
    return router
}
