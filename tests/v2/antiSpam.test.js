// Campo trampa de los formularios públicos: sin BDD ni servidor
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rechazarBots, CAMPO_TRAMPA } from '../../src/v2/shared/middlewares/antiSpam.js'
import { SolicitudInvalidaError } from '../../src/v2/shared/errores.js'

const ejecutar = (body) => {
    const req = { body }
    let recibido = 'sin-llamar'
    rechazarBots(req, {}, (error) => { recibido = error })
    return { req, recibido }
}

test('deja pasar a una persona (campo trampa vacío) y quita el campo del cuerpo', () => {
    const { req, recibido } = ejecutar({ email: 'a@b.ec', password: 'x', [CAMPO_TRAMPA]: '' })
    assert.equal(recibido, undefined)
    assert.deepEqual(req.body, { email: 'a@b.ec', password: 'x' })
})

test('deja pasar a clientes que no envían el campo (app móvil, scripts)', () => {
    assert.equal(ejecutar({ email: 'a@b.ec' }).recibido, undefined)
    assert.equal(ejecutar(undefined).recibido, undefined)
})

test('rechaza con 400 si el campo trampa viene lleno (bot)', () => {
    const { recibido } = ejecutar({ email: 'a@b.ec', [CAMPO_TRAMPA]: 'https://spam.example' })
    assert.ok(recibido instanceof SolicitudInvalidaError)
    assert.equal(recibido.status, 400)
    assert.ok(ejecutar({ [CAMPO_TRAMPA]: 123 }).recibido instanceof SolicitudInvalidaError)
})
