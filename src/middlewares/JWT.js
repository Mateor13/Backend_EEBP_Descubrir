import jwt from 'jsonwebtoken'

// Genera un JWT con id, rol y año lectivo, válido por 1 hora
const generarJWT = (id, rol, anio) => {
    return jwt.sign({ id, rol, anio }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

// Middleware para verificar autenticación mediante JWT
// 401 = no autenticado (falta el token o no es válido). Antes se respondía 404 ("no encontrado").
const verificarAutenticacion = async (req, res, next) => {
    const { authorization } = req.headers
    const [esquema, token] = (authorization || '').split(' ')
    if (esquema?.toLowerCase() !== 'bearer' || !token) return res.status(401).json({ error: "Lo sentimos, debes proporcionar un token" })
    try {
        // Decodifica el token y extrae datos del usuario
        const { id, rol, anio } = jwt.verify(token, process.env.JWT_SECRET)
        req.userBDD = { id, rol, anio }
        next()
    } catch (error) {
        const mensaje = error.name === 'TokenExpiredError' ? 'La sesión ha expirado' : 'Formato del token no válido'
        return res.status(401).json({ error: mensaje })
    }
}

// Middleware para verificar si el usuario es profesor
const verificarRolProfesor = (req, res, next) => {
    if (req.userBDD.rol === "profesor") next()
    else return res.status(403).json({ error: "Lo sentimos, no tienes permisos de profesor para realizar esta acción" })
}

// Middleware para verificar si el usuario es administrador
const verificarRolAdmin = (req, res, next) => {
    if (req.userBDD.rol === "administrador") next()
    else return res.status(403).json({ error: "Lo sentimos, no tienes permisos de administrador para realizar esta acción" })
}

// Middleware para verificar si el usuario es representante
const verificarRolRepresentante = (req, res, next) => {
    if (req.userBDD.rol === "representante") next()
    else return res.status(403).json({ error: "Lo sentimos, no tienes permisos para realizar esta acción" })
}

// Middleware para verificar que el año lectivo esté activo
const verificarAnioLectivo = (req, res, next) => {
    const { anio } = req.userBDD
    if (!anio) return res.status(400).json({ error: "Lo sentimos, el periodo lectivo actual ya ha finalizado" })
    next()
}

export {
    generarJWT,
    verificarAutenticacion,
    verificarRolProfesor,
    verificarRolAdmin,
    verificarRolRepresentante,
    verificarAnioLectivo
}