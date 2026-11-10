import mongoose from 'mongoose'
import { AppError } from '../errores.js'

// Único punto donde los errores se convierten en respuestas HTTP
// eslint-disable-next-line no-unused-vars
export const manejarErrores = (err, req, res, next) => {
    if (err instanceof AppError) {
        return res.status(err.status).json({ error: err.message, ...(err.detalles && { detalles: err.detalles }) })
    }
    if (err?.code === 11000) {
        const campo = Object.keys(err.keyPattern || {}).join(', ')
        return res.status(409).json({ error: `Ya existe un registro con ese valor (${campo})` })
    }
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ error: `Identificador no válido: ${err.path}` })
    }
    if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ error: Object.values(err.errors)[0].message })
    }
    if (err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo excede el tamaño permitido' })
    }
    // Error inesperado: se registra completo en el servidor y se responde genérico
    console.error('[v2] Error no controlado:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
}
