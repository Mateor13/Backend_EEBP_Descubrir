// Creación de cuentas con dependencias falsas (sin BDD ni SMTP)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { crearUsuariosServicio } from '../../src/v2/modules/usuarios/usuarios.servicio.js'
import { AppError } from '../../src/v2/shared/errores.js'

const datos = { nombre: 'Lucía', apellido: 'Paredes', cedula: '1711111111', email: 'lucia@escuela.ec', telefono: '0999999999', direccion: 'Calle Sucre 45', roles: ['profesor'] }

const crearRepo = () => {
    const usuarios = new Map()
    return {
        usuarios,
        existeConDatos: async () => false,
        crear: async (d) => { const u = { _id: 'u1', ...d, activo: true, emailConfirmado: false }; usuarios.set(u._id, u); return u },
        actualizar: async (id, cambios) => Object.assign(usuarios.get(id), cambios),
        eliminar: async (id) => usuarios.delete(id)
    }
}

test('crea la cuenta y envía el enlace de activación a /v2/activar', async () => {
    const usuariosRepo = crearRepo()
    const enviados = []
    const servicio = crearUsuariosServicio({ usuariosRepo, mailer: { enviar: async (m) => { enviados.push(m) } } })
    const perfil = await servicio.crear(datos)
    assert.equal(perfil.email, 'lucia@escuela.ec')
    assert.equal(perfil.emailConfirmado, false)
    assert.equal('passwordHash' in perfil, false)
    assert.equal(enviados.length, 1)
    assert.equal(enviados[0].para, 'lucia@escuela.ec')
    assert.match(enviados[0].html, /v2\/activar\/[a-f0-9]{64}/)
    assert.ok(usuariosRepo.usuarios.get('u1').tokenConfirmacion.hash)
})

test('si el correo falla, no deja la cuenta creada y devuelve un error claro (502)', async (t) => {
    t.mock.method(console, 'error', () => {})
    const usuariosRepo = crearRepo()
    const servicio = crearUsuariosServicio({ usuariosRepo, mailer: { enviar: async () => { throw new Error('Invalid login: 535 Username and Password not accepted') } } })
    await assert.rejects(servicio.crear(datos), (e) => e instanceof AppError && e.status === 502 && /correo de activación/.test(e.message))
    assert.equal(usuariosRepo.usuarios.size, 0)
})
