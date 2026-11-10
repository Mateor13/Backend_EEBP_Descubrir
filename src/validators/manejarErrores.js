import { validationResult } from 'express-validator'

// Último paso de cada validador: si alguna regla falló, responde 400 con el PRIMER mensaje de error.
// Antes este bloque estaba copiado 41 veces en los archivos de validadores.
export const manejarErroresValidacion = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })
    next()
}
