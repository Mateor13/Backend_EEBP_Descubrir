import { Router } from 'express'
import { z } from 'zod'
import { ruta } from '../../shared/middlewares/ruta.js'
import { validar } from '../../shared/middlewares/validar.js'
import { autorizar } from '../../shared/middlewares/autenticacion.js'
import { ROLES } from '../../shared/roles.js'
import { cedula, idMongo, nombrePropio, paramsId } from '../../shared/esquemas.js'

const consultaPeriodo = z.object({ periodo: idMongo.optional() })
const esquemas = {
    crear: z.object({
        nombre: nombrePropio, apellido: nombrePropio, cedula,
        representantes: z.array(idMongo).max(4).default([]),
        curso: idMongo.optional() // si se indica, se matricula en el periodo activo
    }).strict(),
    actualizar: z.object({ nombre: nombrePropio.optional(), apellido: nombrePropio.optional(), cedula: cedula.optional() }).strict(),
    representante: z.object({ representante: idMongo }).strict(),
    paramsRepresentante: z.object({ id: idMongo, representanteId: idMongo }),
    matricular: z.object({ estudiante: idMongo, curso: idMongo, periodo: idMongo.optional() }).strict(),
    cambiarCurso: z.object({ curso: idMongo }).strict(),
    paramsCurso: z.object({ cursoId: idMongo })
}

const crearControlador = (s) => ({
    crear: async (req, res) => res.status(201).json(await s.crear(req.body)),
    mios: async (req, res) => res.json(await s.misEstudiantes(req.usuario, req.consulta.periodo)),
    obtener: async (req, res) => res.json(await s.obtenerDetalle(req.usuario, req.params.id, req.consulta.periodo)),
    actualizar: async (req, res) => res.json(await s.actualizar(req.params.id, req.body)),
    desactivar: async (req, res) => { await s.desactivar(req.params.id); res.status(204).end() },
    vincular: async (req, res) => { await s.vincularRepresentante(req.params.id, req.body.representante); res.status(204).end() },
    desvincular: async (req, res) => { await s.desvincularRepresentante(req.params.id, req.params.representanteId); res.status(204).end() },
    matricular: async (req, res) => res.status(201).json(await s.matricular(req.body)),
    cambiarCurso: async (req, res) => res.json(await s.cambiarCurso(req.params.id, req.body.curso)),
    retirar: async (req, res) => res.json(await s.retirar(req.params.id)),
    delCurso: async (req, res) => res.json(await s.estudiantesDelCurso(req.usuario, req.params.cursoId, req.consulta.periodo))
})

export const crearRutasEstudiantes = ({ estudiantesServicio, autenticar }) => {
    const c = crearControlador(estudiantesServicio)
    const soloAdmin = autorizar(ROLES.ADMIN)
    const router = Router()
    router.use(autenticar)
    router.post('/estudiantes', soloAdmin, validar({ body: esquemas.crear }), ruta(c.crear))
    router.get('/estudiantes/mios', autorizar(ROLES.REPRESENTANTE), validar({ query: consultaPeriodo }), ruta(c.mios))
    // El servicio decide si quien consulta puede ver a ESTE estudiante (admin, su profesor o su representante)
    router.get('/estudiantes/:id', validar({ params: paramsId, query: consultaPeriodo }), ruta(c.obtener))
    router.patch('/estudiantes/:id', soloAdmin, validar({ params: paramsId, body: esquemas.actualizar }), ruta(c.actualizar))
    router.delete('/estudiantes/:id', soloAdmin, validar({ params: paramsId }), ruta(c.desactivar))
    router.post('/estudiantes/:id/representantes', soloAdmin, validar({ params: paramsId, body: esquemas.representante }), ruta(c.vincular))
    router.delete('/estudiantes/:id/representantes/:representanteId', soloAdmin, validar({ params: esquemas.paramsRepresentante }), ruta(c.desvincular))
    router.post('/matriculas', soloAdmin, validar({ body: esquemas.matricular }), ruta(c.matricular))
    router.patch('/matriculas/:id', soloAdmin, validar({ params: paramsId, body: esquemas.cambiarCurso }), ruta(c.cambiarCurso))
    router.post('/matriculas/:id/retiro', soloAdmin, validar({ params: paramsId }), ruta(c.retirar))
    router.get('/cursos/:cursoId/estudiantes', autorizar(ROLES.ADMIN, ROLES.PROFESOR), validar({ params: esquemas.paramsCurso, query: consultaPeriodo }), ruta(c.delCurso))
    return router
}
