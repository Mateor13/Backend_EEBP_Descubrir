import { Router } from 'express'
import { z } from 'zod'
import { ruta } from '../../shared/middlewares/ruta.js'
import { validar } from '../../shared/middlewares/validar.js'
import { autorizar } from '../../shared/middlewares/autenticacion.js'
import { ROLES } from '../../shared/roles.js'
import { idMongo, paramsId } from '../../shared/esquemas.js'

const esquemas = {
    curso: z.object({ nivel: z.number().int().min(1).max(7), paralelo: z.enum(['A', 'B', 'C', 'D', 'E']) }).strict(),
    asignatura: z.object({ nombre: z.string().trim().min(2).max(60) }).strict(),
    actualizarAsignatura: z.object({ nombre: z.string().trim().min(2).max(60).optional(), activo: z.boolean().optional() }).strict(),
    clase: z.object({ curso: idMongo, asignatura: idMongo, profesor: idMongo, periodo: idMongo.optional() }).strict(),
    cambiarProfesor: z.object({ profesor: idMongo }).strict(),
    listarClases: z.object({ periodo: idMongo.optional(), curso: idMongo.optional(), profesor: idMongo.optional() })
}

const crearControlador = (s) => ({
    listarCursos: async (req, res) => res.json(await s.listarCursos()),
    crearCurso: async (req, res) => res.status(201).json(await s.crearCurso(req.body)),
    listarAsignaturas: async (req, res) => res.json(await s.listarAsignaturas()),
    crearAsignatura: async (req, res) => res.status(201).json(await s.crearAsignatura(req.body)),
    actualizarAsignatura: async (req, res) => res.json(await s.actualizarAsignatura(req.params.id, req.body)),
    listarClases: async (req, res) => res.json(await s.listarClases(req.usuario, req.consulta)),
    crearClase: async (req, res) => res.status(201).json(await s.crearClase(req.body)),
    cambiarProfesor: async (req, res) => res.json(await s.cambiarProfesor(req.params.id, req.body.profesor)),
    desactivarClase: async (req, res) => { await s.desactivarClase(req.params.id); res.status(204).end() }
})

export const crearRutasAcademico = ({ academicoServicio, autenticar }) => {
    const c = crearControlador(academicoServicio)
    const soloAdmin = autorizar(ROLES.ADMIN)
    const router = Router()
    router.use(autenticar)
    router.get('/cursos', ruta(c.listarCursos))
    router.post('/cursos', soloAdmin, validar({ body: esquemas.curso }), ruta(c.crearCurso))
    router.get('/asignaturas', ruta(c.listarAsignaturas))
    router.post('/asignaturas', soloAdmin, validar({ body: esquemas.asignatura }), ruta(c.crearAsignatura))
    router.patch('/asignaturas/:id', soloAdmin, validar({ params: paramsId, body: esquemas.actualizarAsignatura }), ruta(c.actualizarAsignatura))
    // Admin: todas (con filtros). Profesor: solo las suyas.
    router.get('/clases', autorizar(ROLES.ADMIN, ROLES.PROFESOR), validar({ query: esquemas.listarClases }), ruta(c.listarClases))
    router.post('/clases', soloAdmin, validar({ body: esquemas.clase }), ruta(c.crearClase))
    router.patch('/clases/:id', soloAdmin, validar({ params: paramsId, body: esquemas.cambiarProfesor }), ruta(c.cambiarProfesor))
    router.delete('/clases/:id', soloAdmin, validar({ params: paramsId }), ruta(c.desactivarClase))
    return router
}
