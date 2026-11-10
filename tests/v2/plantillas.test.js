// Enlaces de los correos de la v2: deben ir al frontend nuevo aunque la v1 siga usando el antiguo
import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { bienvenida, recuperacion, urlFrontendV2 } from '../../src/v2/infra/mail/plantillas.js'

const originales = { v2: process.env.URL_FRONTEND_V2, v1: process.env.URL_PRODUCTION }
afterEach(() => {
    for (const [clave, valor] of [['URL_FRONTEND_V2', originales.v2], ['URL_PRODUCTION', originales.v1]]) {
        if (valor === undefined) delete process.env[clave]; else process.env[clave] = valor
    }
})
const token = 'a'.repeat(64)

test('usa URL_FRONTEND_V2 en lugar del frontend de la v1', () => {
    process.env.URL_PRODUCTION = 'https://frontend-antiguo.vercel.app/'
    process.env.URL_FRONTEND_V2 = 'https://descubrir-frontend.vercel.app/'
    assert.match(bienvenida({ nombre: 'Ana', token }).html, /href="https:\/\/descubrir-frontend\.vercel\.app\/v2\/activar\/a{64}"/)
    assert.match(recuperacion({ nombre: 'Ana', token }).html, /href="https:\/\/descubrir-frontend\.vercel\.app\/v2\/restablecer\/a{64}"/)
})

test('sin URL_FRONTEND_V2 usa URL_PRODUCTION, y agrega https:// si falta', () => {
    delete process.env.URL_FRONTEND_V2
    process.env.URL_PRODUCTION = 'frontend.vercel.app'
    assert.equal(urlFrontendV2(), 'https://frontend.vercel.app')
})
