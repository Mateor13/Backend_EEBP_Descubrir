import { SolicitudInvalidaError } from '../errores.js'

// Campo trampa ("honeypot") de los formularios públicos del frontend (login, recuperar, activar, restablecer).
// Es invisible para las personas: si llega con contenido, quien envía es un bot y se rechaza la petición.
// El rechazo cuenta como intento fallido para el límite de intentos (rate limit) de la ruta.
export const CAMPO_TRAMPA = 'sitioWeb'

export const rechazarBots = (req, res, next) => {
    const valor = req.body?.[CAMPO_TRAMPA]
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
        return next(new SolicitudInvalidaError('No se pudo procesar la solicitud'))
    }
    if (req.body && CAMPO_TRAMPA in req.body) delete req.body[CAMPO_TRAMPA]
    next()
}
