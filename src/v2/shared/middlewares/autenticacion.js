import jwt from 'jsonwebtoken'
import { NoAutenticadoError, ProhibidoError } from '../errores.js'
import { tieneRol } from '../roles.js'

export const AUDIENCIA_JWT = 'api-v2'

export const firmarToken = (usuario) => jwt.sign(
    { sub: String(usuario._id), roles: usuario.roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h', audience: AUDIENCIA_JWT }
)

// Verifica el JWT y carga el usuario desde la BDD: si un admin desactiva una cuenta,
// el acceso se corta de inmediato aunque el token aún no haya expirado.
export const crearAutenticar = (usuariosRepo) => async (req, res, next) => {
    // Varios routers comparten prefijo: si ya se autenticó en esta petición, no se repite la consulta
    if (req.usuario) return next()
    try {
        const [esquema, token] = (req.headers.authorization || '').split(' ')
        if (esquema?.toLowerCase() !== 'bearer' || !token) throw new NoAutenticadoError()
        let payload
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET, { audience: AUDIENCIA_JWT })
        } catch (error) {
            throw new NoAutenticadoError(error.name === 'TokenExpiredError' ? 'La sesión ha expirado' : 'Token no válido')
        }
        const usuario = await usuariosRepo.buscarPorId(payload.sub)
        if (!usuario || !usuario.activo) throw new NoAutenticadoError('La cuenta no existe o está desactivada')
        req.usuario = { id: String(usuario._id), roles: usuario.roles, nombre: usuario.nombre, apellido: usuario.apellido }
        next()
    } catch (error) {
        next(error)
    }
}

// Autoriza por rol. Las reglas finas ("¿este profesor dicta esta clase?") van en los servicios.
export const autorizar = (...roles) => (req, res, next) => {
    if (!tieneRol(req.usuario, ...roles)) return next(new ProhibidoError())
    next()
}
