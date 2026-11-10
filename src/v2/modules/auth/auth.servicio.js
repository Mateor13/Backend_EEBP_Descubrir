import bcrypt from 'bcryptjs'
import { ConflictoError, NoAutenticadoError, NoEncontradoError, ProhibidoError, SolicitudInvalidaError } from '../../shared/errores.js'
import { generarTokenUnUso, hashToken } from '../../shared/utils/tokens.js'
import { firmarToken } from '../../shared/middlewares/autenticacion.js'
import { aPerfil } from '../usuarios/usuarios.servicio.js'
import * as plantillas from '../../infra/mail/plantillas.js'

export const DURACION_RECUPERACION_MS = 60 * 60 * 1000
// Hash válido de una contraseña imposible: compararlo cuesta lo mismo que uno real, así el tiempo
// de respuesta no revela si el email existe
const HASH_FICTICIO = bcrypt.hashSync('usuario-inexistente', 10)

export const crearAuthServicio = ({ usuariosRepo, mailer }) => {
    const tokenVigente = (registro) => registro?.expira && registro.expira.getTime() > Date.now()

    return {
        async login({ email, password }) {
            const usuario = await usuariosRepo.buscarPorEmailConSecretos(email)
            const coincide = await bcrypt.compare(password, usuario?.passwordHash ?? HASH_FICTICIO)
            // Mismo mensaje si el email no existe o la contraseña falla: no se revela qué cuentas existen
            if (!usuario || !coincide) throw new NoAutenticadoError('Credenciales incorrectas')
            if (!usuario.activo) throw new ProhibidoError('Su cuenta está desactivada, contacte a la administración')
            if (!usuario.emailConfirmado) throw new ProhibidoError('Debe activar su cuenta desde el enlace enviado a su correo')
            return { token: firmarToken(usuario), usuario: aPerfil(usuario) }
        },

        // Activa la cuenta y define la primera contraseña en un solo paso
        async activarCuenta({ token, password }) {
            const usuario = await usuariosRepo.buscarPorTokenConfirmacion(hashToken(token))
            if (!usuario || !tokenVigente(usuario.tokenConfirmacion)) throw new SolicitudInvalidaError('El enlace no es válido o ha expirado')
            usuario.passwordHash = await bcrypt.hash(password, 10)
            usuario.emailConfirmado = true
            usuario.tokenConfirmacion = undefined
            await usuario.save()
        },

        // Siempre responde igual, exista o no el email (evita enumerar cuentas)
        async solicitarRecuperacion({ email }) {
            const usuario = await usuariosRepo.buscarPorEmail(email)
            if (!usuario || !usuario.activo) return
            const { token, registro } = generarTokenUnUso(DURACION_RECUPERACION_MS)
            usuario.tokenRecuperacion = registro
            await usuario.save()
            await mailer.enviar({ para: usuario.email, ...plantillas.recuperacion({ nombre: usuario.nombre, token }) })
        },

        async restablecerPassword({ token, password }) {
            const usuario = await usuariosRepo.buscarPorTokenRecuperacion(hashToken(token))
            if (!usuario || !tokenVigente(usuario.tokenRecuperacion)) throw new SolicitudInvalidaError('El enlace no es válido o ha expirado')
            usuario.passwordHash = await bcrypt.hash(password, 10)
            usuario.tokenRecuperacion = undefined
            usuario.emailConfirmado = true // demostró que controla el correo
            await usuario.save()
        },

        async perfil(id) {
            const usuario = await usuariosRepo.buscarPorId(id)
            if (!usuario) throw new NoEncontradoError('Usuario')
            return aPerfil(usuario)
        },

        async actualizarPerfil(id, cambios) {
            const actual = await usuariosRepo.buscarPorId(id)
            if (!actual) throw new NoEncontradoError('Usuario')
            const cambiaEmail = cambios.email && cambios.email !== actual.email
            if (cambiaEmail && await usuariosRepo.existeConDatos({ email: cambios.email, excluirId: id })) {
                throw new ConflictoError('El email ya está registrado')
            }
            const actualizado = await usuariosRepo.actualizar(id, cambios)
            // Se avisa al email ANTERIOR, y solo después de guardar
            if (cambiaEmail) {
                await mailer.enviar({ para: actual.email, ...plantillas.cambioEmail({ nombre: actual.nombre, nuevoEmail: cambios.email }) })
                    .catch(error => console.error('[v2] No se pudo notificar el cambio de email:', error.message))
            }
            return aPerfil(actualizado)
        },

        async cambiarPassword(id, { actual, nueva }) {
            const usuario = await usuariosRepo.buscarPorIdConSecretos(id)
            if (!usuario || !await bcrypt.compare(actual, usuario.passwordHash)) {
                throw new SolicitudInvalidaError('La contraseña actual es incorrecta')
            }
            usuario.passwordHash = await bcrypt.hash(nueva, 10)
            await usuario.save()
        }
    }
}
