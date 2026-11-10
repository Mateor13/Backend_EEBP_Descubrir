import { Router } from 'express'
import { z } from 'zod'
import { ruta } from '../../shared/middlewares/ruta.js'
import { validar } from '../../shared/middlewares/validar.js'
import { autorizar } from '../../shared/middlewares/autenticacion.js'
import { ROLES } from '../../shared/roles.js'
import { fechaISO, idMongo, paramsId } from '../../shared/esquemas.js'

export const esquemas = {
    paramsCurso: z.object({ cursoId: idMongo }),
    fecha: z.object({ fecha: fechaISO.optional() }),
    registrar: z.strictObject({
        fecha: fechaISO.optional(),
        // "justificado" no se registra directamente: se llega a él justificando una ausencia
        registros: z.array(z.strictObject({ estudiante: idMongo, estado: z.enum(['presente', 'ausente', 'atraso']) })).min(1)
            .refine(l => new Set(l.map(r => r.estudiante)).size === l.length, 'Hay estudiantes repetidos')
    }),
    justificar: z.strictObject({ justificacion: z.string().trim().min(5, 'Describa el motivo (mínimo 5 caracteres)').max(300) }),
    periodo: z.object({ periodo: idMongo.optional() })
}

const crearControlador = (s) => ({
    registrar: async (req, res) => res.json(await s.registrarDelDia(req.usuario, req.params.cursoId, req.body)),
    lista: async (req, res) => res.json(await s.listaDelDia(req.usuario, req.params.cursoId, req.consulta.fecha)),
    justificar: async (req, res) => res.json(await s.justificar(req.params.id, req.body.justificacion)),
    delEstudiante: async (req, res) => res.json(await s.delEstudiante(req.usuario, req.params.id, req.consulta.periodo))
})

export const crearRutasAsistencias = ({ asistenciasServicio, autenticar }) => {
    const c = crearControlador(asistenciasServicio)
    const docentes = autorizar(ROLES.ADMIN, ROLES.PROFESOR)
    const router = Router()
    router.use(autenticar)
    router.put('/cursos/:cursoId/asistencias', docentes, validar({ params: esquemas.paramsCurso, body: esquemas.registrar }), ruta(c.registrar))
    router.get('/cursos/:cursoId/asistencias', docentes, validar({ params: esquemas.paramsCurso, query: esquemas.fecha }), ruta(c.lista))
    router.patch('/asistencias/:id/justificacion', autorizar(ROLES.ADMIN), validar({ params: paramsId, body: esquemas.justificar }), ruta(c.justificar))
    router.get('/estudiantes/:id/asistencias', validar({ params: paramsId, query: esquemas.periodo }), ruta(c.delEstudiante))
    return router
}
