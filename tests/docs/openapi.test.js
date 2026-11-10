// La documentación OpenAPI (docs/openapi.json, publicada en /api/docs) debe estar:
//  1. al día con el código que la genera (src/docs),
//  2. completa: cada ruta del código documentada, y sin rutas documentadas que ya no existan,
//  3. válida según la especificación OpenAPI 3.1.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { validate } from '@readme/openapi-parser'
import { construirOpenAPI } from '../../src/docs/openapi.js'
import { RUTA_OPENAPI, serializar } from '../../scripts/generar-openapi.js'

const leer = (ruta) => fs.readFileSync(new URL(`../../${ruta}`, import.meta.url), 'utf8')
const normalizar = (ruta) => (ruta.replace(/:([A-Za-z0-9_]+)/g, '{$1}').replace(/\/+/g, '/').replace(/(.)\/$/, '$1'))
const rutasDeArchivo = (codigo, prefijo, objeto = 'router') =>
    [...codigo.matchAll(new RegExp(`${objeto}\\.(get|post|put|patch|delete)\\(\\s*'([^']+)'`, 'g'))]
        .map(([, metodo, ruta]) => `${metodo.toUpperCase()} ${normalizar(prefijo + ruta)}`)

// Rutas declaradas en el código fuente
const rutasDelCodigo = () => {
    const rutas = [
        ...rutasDeArchivo(leer('src/server.js'), '', 'app'),
        ...rutasDeArchivo(leer('src/docs/rutas.js'), '/api'),
        ...['admin', 'common', 'profesor', 'representante'].flatMap(r => rutasDeArchivo(leer(`src/routers/${r}_routes.js`), '/api')),
        ...rutasDeArchivo(leer('src/v2/app.js'), '/api/v2')
    ]
    // Módulos v2: el prefijo de cada uno sale de "router.use('/prefijo', crearRutasX(deps))" en src/v2/app.js
    const montajes = [...leer('src/v2/app.js').matchAll(/router\.use\('([^']+)', (crearRutas\w+)\(deps\)\)/g)]
    const modulos = fs.readdirSync(new URL('../../src/v2/modules/', import.meta.url))
    for (const [, prefijo, funcion] of montajes) {
        const modulo = modulos.find(m => fs.existsSync(new URL(`../../src/v2/modules/${m}/${m}.modulo.js`, import.meta.url)) &&
            leer(`src/v2/modules/${m}/${m}.modulo.js`).includes(`export const ${funcion} `))
        assert.ok(modulo, `No se encontró el módulo que exporta ${funcion}`)
        rutas.push(...rutasDeArchivo(leer(`src/v2/modules/${modulo}/${modulo}.modulo.js`), `/api/v2${prefijo === '/' ? '' : prefijo}`))
    }
    return new Set(rutas)
}

const spec = construirOpenAPI()
const rutasDocumentadas = new Set(Object.entries(spec.paths).flatMap(([ruta, ops]) => Object.keys(ops).map(m => `${m.toUpperCase()} ${ruta}`)))

test('docs/openapi.json está al día (si falla: npm run docs:generar)', () => {
    assert.equal(fs.readFileSync(RUTA_OPENAPI, 'utf8'), serializar(spec))
})

test('todas las rutas del código están documentadas', () => {
    const faltan = [...rutasDelCodigo()].filter(r => !rutasDocumentadas.has(r))
    assert.deepEqual(faltan, [], `Rutas sin documentar en src/docs: ${faltan.join(', ')}`)
})

test('no hay rutas documentadas que ya no existan en el código', () => {
    const codigo = rutasDelCodigo()
    const sobran = [...rutasDocumentadas].filter(r => !codigo.has(r))
    assert.deepEqual(sobran, [], `Rutas documentadas que no existen: ${sobran.join(', ')}`)
})

test('la especificación es OpenAPI 3.1 válida', async () => {
    const resultado = await validate(structuredClone(spec))
    assert.equal(resultado.valid, true, JSON.stringify(resultado.errors))
})

test('cada operación tiene resumen, etiqueta, respuestas y un operationId único', () => {
    const ids = new Set()
    for (const [ruta, operaciones] of Object.entries(spec.paths)) {
        for (const [metodo, op] of Object.entries(operaciones)) {
            const nombre = `${metodo.toUpperCase()} ${ruta}`
            assert.ok(op.summary && op.tags?.length && Object.keys(op.responses ?? {}).length, `${nombre} incompleta`)
            assert.ok(!ids.has(op.operationId), `operationId repetido: ${op.operationId}`)
            ids.add(op.operationId)
        }
    }
})
