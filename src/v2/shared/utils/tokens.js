import crypto from 'crypto'

// Los tokens de un solo uso (confirmar cuenta, recuperar contraseña) se envían por correo
// en texto plano, pero en la BDD solo se guarda su hash: si alguien lee la BDD no puede usarlos.
export const generarTokenUnUso = (duracionMs) => {
    const token = crypto.randomBytes(32).toString('hex')
    return {
        token,
        registro: { hash: hashToken(token), expira: new Date(Date.now() + duracionMs) }
    }
}

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

export const generarPasswordTemporal = () => crypto.randomBytes(9).toString('base64url')
