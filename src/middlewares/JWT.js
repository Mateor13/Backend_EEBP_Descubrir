import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

// Genera un JWT con id, rol y año lectivo, válido por 1 hora
const generarJWT = (id, rol, anio) => {
    return jwt.sign({ id, rol, anio }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

// Middleware para verificar autenticación mediante JWT
const verificarAutenticacion = async (req, res, next) => {
    // Verifica que exista el header de autorización
    if (!req.headers.authorization) return res.status(404).json({ error: "Lo sentimos, debes proprocionar un token" })
    const { authorization } = req.headers
    try {
        // Decodifica el token y extrae datos del usuario
        const { id, rol, anio } = jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET)
        req.userBDD = { id, rol, anio }
        next()
    } catch (error) {
        const e = new Error("Formato del token no válido")
        return res.status(404).json({ error: e.message })
    }
}

// Middleware para verificar si el usuario es profesor
const verificarRolProfesor = (req, res, next) => {
    if (req.userBDD.rol === "profesor") next()
    else return res.status(401).json({ error: "Lo sentimos, no tienes permisos de profesor para realizar esta acción" })
}

// Middleware para verificar si el usuario es administrador
const verificarRolAdmin = (req, res, next) => {
    if (req.userBDD.rol === "administrador") next()
    else return res.status(401).json({ error: "Lo sentimos, no tienes permisos de administrador para realizar esta acción" })
}

// Middleware para verificar si el usuario es representante
const verificarRolRepresentante = (req, res, next) => {
    if (req.userBDD.rol === "representante") next()
    else return res.status(401).json({ error: "Lo sentimos, no tienes permisos para realizar esta acción" })
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