import { Router } from 'express'
import { z } from 'zod'
import { ruta } from '../../shared/middlewares/ruta.js'
import { validar } from '../../shared/middlewares/validar.js'
import { autorizar } from '../../shared/middlewares/autenticacion.js'
import { ROLES } from '../../shared/roles.js'
import { fechaISO, idMongo, paramsId } from '../../shared/esquemas.js'
import { diaDesdeISO } from '../../shared/utils/fechas.js'

const porcentaje = z.number().min(0).max(100)
const ponderaciones = z.object({ deber: porcentaje, taller: porcentaje, prueba: porcentaje, examen: porcentaje })
const configuracion = {
    ponderaciones: ponderaciones.optional(),
    notaMinima: z.number().min(0).max(10).optional(),
    nivelMinimoReprobacion: z.number().int().min(1).max(7).optional(),
    fin: fechaISO.transform(diaDesdeISO).optional()
}
const esquemas = {
    crear: z.object({
        nombre: z.string().trim().regex(/^\d{4}-\d{4}$/, 'El nombre debe tener el formato 2025-2026'),
        inicio: fechaISO.transform(diaDesdeISO),
        ...configuracion
    }).strict().refine(d => !d.fin || d.fin > d.inicio, { message: 'La fecha de fin debe ser posterior al inicio', path: ['fin'] }),
    configurar: z.object(configuracion).strict(),
    promocion: z.object({ destino: idMongo, copiarClases: z.boolean().default(true) }).strict()
}

const aPeriodo = (p) => ({
    id: String(p._id), nombre: p.nombre, inicio: p.inicio, fin: p.fin, estado: p.estado,
    ponderaciones: p.ponderaciones, notaMinima: p.notaMinima, nivelMinimoReprobacion: p.nivelMinimoReprobacion
})

const crearControlador = (periodos, promocion) => ({
    listar: async (req, res) => res.json((await periodos.listar()).map(aPeriodo)),
    activo: async (req, res) => res.json(aPeriodo(await periodos.activo())),
    crear: async (req, res) => res.status(201).json(aPeriodo(await periodos.crear(req.body))),
    activar: async (req, res) => res.json(aPeriodo(await periodos.activar(req.params.id))),
    cerrar: async (req, res) => res.json(aPeriodo(await periodos.cerrar(req.params.id))),
    configurar: async (req, res) => res.json(aPeriodo(await periodos.configurar(req.params.id, req.body))),
    vistaPrevia: async (req, res) => {
        const resultados = await promocion.calcular(req.params.id)
        res.json(resultados.map(r => ({
            estudiante: String(r.matricula.estudiante._id), curso: String(r.matricula.curso._id),
            aprueba: r.aprueba, clasesReprobadas: r.clasesReprobadas, nivelDestino: r.nivelDestino
        })))
    },
    promover: async (req, res) => res.json(await promocion.promover({ origen: req.params.id, ...req.body }))
})

export const crearRutasPeriodos = ({ periodosServicio, promocionServicio, autenticar }) => {
    const c = crearControlador(periodosServicio, promocionServicio)
    const soloAdmin = autorizar(ROLES.ADMIN)
    const router = Router()
    router.use(autenticar)
    router.get('/', ruta(c.listar))
    router.get('/activo', ruta(c.activo))
    router.post('/', soloAdmin, validar({ body: esquemas.crear }), ruta(c.crear))
    router.patch('/:id', soloAdmin, validar({ params: paramsId, body: esquemas.configurar }), ruta(c.configurar))
    router.post('/:id/activar', soloAdmin, validar({ params: paramsId }), ruta(c.activar))
    router.post('/:id/cerrar', soloAdmin, validar({ params: paramsId }), ruta(c.cerrar))
    router.get('/:id/promocion', soloAdmin, validar({ params: paramsId }), ruta(c.vistaPrevia))
    router.post('/:id/promocion', soloAdmin, validar({ params: paramsId, body: esquemas.promocion }), ruta(c.promover))
    return router
}
