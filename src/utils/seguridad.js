import crypto from 'crypto'

// Token aleatorio criptográficamente seguro (para confirmar cuenta / recuperar contraseña).
// Math.random() no es apto para seguridad: su salida se puede predecir.
export const generarTokenSeguro = () => crypto.randomBytes(32).toString('hex')

// Contraseña temporal aleatoria y segura, manteniendo el prefijo por rol que ya usaba el sistema.
export const generarPasswordTemporal = (prefijo) => `${prefijo}-${crypto.randomBytes(6).toString('base64url')}`

// Tiempo de validez del token de recuperación de contraseña
export const DURACION_TOKEN_RECUPERACION_MS = 60 * 60 * 1000 // 1 hora
