import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { ruta } from '../../shared/middlewares/ruta.js'
import { validar } from '../../shared/middlewares/validar.js'
import { autorizar } from '../../shared/middlewares/autenticacion.js'
import { SolicitudInvalidaError } from '../../shared/errores.js'
import { ROLES } from '../../shared/roles.js'
import { fechaISO, idMongo, paramsId } from '../../shared/esquemas.js'
import { TIPOS_EVALUACION } from '../../infra/db/modelos.js'

const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
// La imagen de evidencia es opcional y se valida ANTES de cargarla completa en memoria
const subirEvidencia = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => MIME_PERMITIDOS.includes(file.mimetype)
        ? cb(null, true)
        : cb(new SolicitudInvalidaError('La evidencia debe ser una imagen JPEG, PNG, GIF o WEBP'))
}).single('evidencia')

const datosEvaluacion = {
    tipo: z.enum(TIPOS_EVALUACION),
    titulo: z.string().trim().min(2).max(100),
    descripcion: z.string().trim().max(500).optional(),
    fecha: fechaISO.optional()
}
const esquemas = {
    crear: z.strictObject(datosEvaluacion),
    actualizar: z.strictObject(datosEvaluacion).partial(),
    paramsClase: z.object({ claseId: idMongo }),
    listar: z.object({ tipo: z.enum(TIPOS_EVALUACION).optional() }),
    calificaciones: z.strictObject({
        calificaciones: z.array(z.strictObject({ estudiante: idMongo, nota: z.number().min(0).max(10) })).min(1)
            .refine(l => new Set(l.map(c => c.estudiante)).size === l.length, 'Hay estudiantes repetidos')
    }),
    boletin: z.object({ periodo: idMongo.optional() })
}

const crearControlador = (s) => ({
    crear: async (req, res) => res.status(201).json(await s.crearEvaluacion(req.usuario, req.params.claseId, req.body, req.file)),
    listar: async (req, res) => res.json(await s.listarEvaluaciones(req.usuario, req.params.claseId, req.consulta.tipo)),
    actualizar: async (req, res) => res.json(await s.actualizarEvaluacion(req.usuario, req.params.id, req.body, req.file)),
    eliminar: async (req, res) => { await s.eliminarEvaluacion(req.usuario, req.params.id); res.status(204).end() },
    planilla: async (req, res) => res.json(await s.planilla(req.usuario, req.params.id)),
    registrar: async (req, res) => res.json(await s.registrarCalificaciones(req.usuario, req.params.id, req.body.calificaciones)),
    boletin: async (req, res) => res.json(await s.boletin(req.usuario, req.params.id, req.consulta.periodo))
})

export const crearRutasCalificaciones = ({ calificacionesServicio, autenticar }) => {
    const c = crearControlador(calificacionesServicio)
    const docentes = autorizar(ROLES.ADMIN, ROLES.PROFESOR)
    const router = Router()
    router.use(autenticar)
    router.post('/clases/:claseId/evaluaciones', docentes, subirEvidencia, validar({ params: esquemas.paramsClase, body: esquemas.crear }), ruta(c.crear))
    router.get('/clases/:claseId/evaluaciones', docentes, validar({ params: esquemas.paramsClase, query: esquemas.listar }), ruta(c.listar))
    router.patch('/evaluaciones/:id', docentes, subirEvidencia, validar({ params: paramsId, body: esquemas.actualizar }), ruta(c.actualizar))
    router.delete('/evaluaciones/:id', docentes, validar({ params: paramsId }), ruta(c.eliminar))
    router.get('/evaluaciones/:id/calificaciones', docentes, validar({ params: paramsId }), ruta(c.planilla))
    router.put('/evaluaciones/:id/calificaciones', docentes, validar({ params: paramsId, body: esquemas.calificaciones }), ruta(c.registrar))
    router.get('/estudiantes/:id/boletin', validar({ params: paramsId, query: esquemas.boletin }), ruta(c.boletin))
    return router
}
