import { SolicitudInvalidaError } from '../errores.js'

// Valida y normaliza body/params/query con esquemas de zod.
// El validador SOLO comprueba la forma de los datos: no consulta la BDD ni aplica reglas de negocio.
export const validar = (esquemas) => (req, res, next) => {
    for (const parte of ['params', 'query', 'body']) {
        if (!esquemas[parte]) continue
        const resultado = esquemas[parte].safeParse(req[parte] ?? {})
        if (!resultado.success) {
            const detalles = resultado.error.issues.map(i => ({ campo: i.path.join('.'), mensaje: i.message }))
            return next(new SolicitudInvalidaError(detalles[0].mensaje, detalles))
        }
        // req.query es de solo lectura en algunas versiones de Express: se guarda aparte
        if (parte === 'query') req.consulta = resultado.data
        else req[parte] = resultado.data
    }
    next()
}
