// Express 4 no captura errores de funciones async: este envoltorio los pasa a next()
// para que lleguen al middleware de errores, sin escribir try/catch en cada controlador.
export const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
