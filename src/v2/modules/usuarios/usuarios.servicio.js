import bcrypt from 'bcryptjs'
import { AppError, ConflictoError, NoEncontradoError, SolicitudInvalidaError } from '../../shared/errores.js'
import { generarTokenUnUso, generarPasswordTemporal } from '../../shared/utils/tokens.js'
import { ROLES } from '../../shared/roles.js'
import * as plantillas from '../../infra/mail/plantillas.js'

export const DURACION_ACTIVACION_MS = 72 * 60 * 60 * 1000

// Lo que se devuelve al cliente: nunca hashes ni tokens
export const aPerfil = (u) => ({
    id: String(u._id), nombre: u.nombre, apellido: u.apellido, cedula: u.cedula, email: u.email,
    telefono: u.telefono, direccion: u.direccion, roles: u.roles, activo: u.activo, emailConfirmado: u.emailConfirmado
})

export const crearUsuariosServicio = ({ usuariosRepo, mailer }) => {
    const asegurarUnico = async ({ email, cedula, excluirId }) => {
        if (await usuariosRepo.existeConDatos({ email, cedula, excluirId })) {
            throw new ConflictoError('Ya existe un usuario con ese email o cédula')
        }
    }

    const enviarActivacion = async (usuario) => {
        const { token, registro } = generarTokenUnUso(DURACION_ACTIVACION_MS)
        await usuariosRepo.actualizar(usuario._id, { tokenConfirmacion: registro })
        try {
            await mailer.enviar({ para: usuario.email, ...plantillas.bienvenida({ nombre: usuario.nombre, token }) })
        } catch (error) {
            // El detalle técnico (credenciales SMTP, red) queda en el log; al cliente, un mensaje que se pueda actuar
            console.error('[v2] No se pudo enviar el correo de activación:', error.message)
            throw new AppError('No se pudo enviar el correo de activación. Revise la configuración del correo del servidor e inténtelo de nuevo.', 502)
        }
    }

    return {
        async crear(datos) {
            await asegurarUnico(datos)
            // La cuenta nace con una contraseña aleatoria que nadie conoce: la persona crea la suya
            // con el enlace de activación (ya no se envían contraseñas por correo).
            const passwordHash = await bcrypt.hash(generarPasswordTemporal(), 10)
            const usuario = await usuariosRepo.crear({ ...datos, passwordHash })
            try {
                await enviarActivacion(usuario)
            } catch (error) {
                await usuariosRepo.eliminar(usuario._id) // sin correo no hay forma de activar la cuenta
                throw error
            }
            return aPerfil(usuario)
        },

        async reenviarActivacion(id) {
            const usuario = await usuariosRepo.buscarPorId(id)
            if (!usuario) throw new NoEncontradoError('Usuario')
            if (usuario.emailConfirmado) throw new SolicitudInvalidaError('La cuenta ya está activada')
            await enviarActivacion(usuario)
        },

        async listar(filtro) {
            return (await usuariosRepo.listar(filtro)).map(aPerfil)
        },

        async obtener(id) {
            const usuario = await usuariosRepo.buscarPorId(id)
            if (!usuario) throw new NoEncontradoError('Usuario')
            return aPerfil(usuario)
        },

        async actualizar(id, cambios) {
            const actual = await usuariosRepo.buscarPorId(id)
            if (!actual) throw new NoEncontradoError('Usuario')
            await asegurarUnico({ email: cambios.email, cedula: cambios.cedula, excluirId: id })
            if (cambios.roles && actual.roles.includes(ROLES.ADMIN) && !cambios.roles.includes(ROLES.ADMIN)) {
                await this.asegurarNoEsUltimoAdmin()
            }
            return aPerfil(await usuariosRepo.actualizar(id, cambios))
        },

        async desactivar(id, solicitanteId) {
            if (id === solicitanteId) throw new SolicitudInvalidaError('No puede desactivar su propia cuenta')
            const usuario = await usuariosRepo.buscarPorId(id)
            if (!usuario) throw new NoEncontradoError('Usuario')
            if (usuario.roles.includes(ROLES.ADMIN)) await this.asegurarNoEsUltimoAdmin()
            await usuariosRepo.actualizar(id, { activo: false })
        },

        async asegurarNoEsUltimoAdmin() {
            if (await usuariosRepo.contarAdminsActivos() <= 1) {
                throw new ConflictoError('Debe existir al menos un administrador activo')
            }
        }
    }
}
