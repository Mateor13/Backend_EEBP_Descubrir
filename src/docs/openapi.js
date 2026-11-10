// Ensambla la especificación OpenAPI 3.1 completa (v1 + v2).
// Se genera con "npm run docs:generar" y se guarda en docs/openapi.json, que es lo que publica el servidor.
import { operacionesV1, tagsV1 } from './v1.js'
import { operacionesV2, tagsV2, esquemasV2 } from './v2.js'
import { respuesta } from './comun.js'

// OpenAPI 3.1 usa JSON Schema 2020-12: "nullable: true" (de 3.0) se expresa con el tipo "null"
const convertirNullable = (valor) => {
    if (Array.isArray(valor)) return valor.map(convertirNullable)
    if (!valor || typeof valor !== 'object') return valor
    const { nullable, ...resto } = valor
    const convertido = Object.fromEntries(Object.entries(resto).map(([k, v]) => [k, convertirNullable(v)]))
    if (!nullable) return convertido
    if (convertido.$ref || convertido.allOf) return { anyOf: [convertido, { type: 'null' }] }
    if (convertido.type) return { ...convertido, type: [convertido.type, 'null'] }
    return { anyOf: [convertido, { type: 'null' }] }
}

const agrupar = (operaciones) => {
    const paths = {}
    for (const [metodo, ruta, op] of operaciones) {
        paths[ruta] ??= {}
        if (paths[ruta][metodo]) throw new Error(`Operación duplicada en la documentación: ${metodo.toUpperCase()} ${ruta}`)
        paths[ruta][metodo] = op
    }
    return paths
}

export const construirOpenAPI = () => convertirNullable({
    openapi: '3.1.0',
    info: {
        title: 'API Escuela Descubrir',
        version: '2.0.0',
        description: [
            'Sistema de gestión académica de la Escuela de Educación Básica Particular "Descubrir".',
            '',
            '- **v1** (`/api/...`): la API que usa hoy el frontend. Se mantiene compatible; los ejemplos de respuesta son respuestas reales grabadas por la prueba de contrato (`tests/v1`).',
            '- **v2** (`/api/v2/...`): nueva arquitectura, en paralelo a la v1. Sus cuerpos y parámetros se generan desde los esquemas de validación (zod).',
            '',
            '**Autenticación:** obtén un token con `POST /api/login` (v1) o `POST /api/v2/auth/login` (v2) y pulsa **Authorize**. Los tokens de una versión no sirven en la otra.',
            '',
            '**Errores:** siempre `{ "error": "mensaje" }` (la v2 añade `detalles` en los errores de validación).',
            '',
            'Documentación detallada en el repositorio: `docs/v2/ARQUITECTURA.md`, `docs/v2/API.md`, `docs/v1/MANTENIMIENTO.md`.'
        ].join('\n')
    },
    servers: [{ url: '/', description: 'Este servidor' }],
    tags: [{ name: 'Servidor', description: 'Página de estado del servidor y documentación de la API.' }, ...tagsV1, ...tagsV2],
    paths: agrupar([
        ['get', '/', {
            tags: ['Servidor'], summary: 'Página de estado del servidor', operationId: 'servidor_inicio', security: [],
            responses: { 200: { description: 'Página HTML que indica que el servidor está en línea', content: { 'text/html': { schema: { type: 'string' } } } } }
        }],
        ['get', '/api/docs', {
            tags: ['Servidor'], summary: 'Documentación interactiva (Swagger UI)', operationId: 'docs_ui', security: [],
            responses: { 200: { description: 'Página de Swagger UI', content: { 'text/html': { schema: { type: 'string' } } } } }
        }],
        ['get', '/api/docs/openapi.json', {
            tags: ['Servidor'], summary: 'Especificación OpenAPI 3.1 de la API', operationId: 'docs_openapi', security: [],
            responses: { 200: { description: 'Este documento', content: { 'application/json': { schema: { type: 'object' } } } } }
        }],
        ...operacionesV1,
        ...operacionesV2
    ]),
    components: {
        securitySchemes: {
            tokenV1: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token de POST /api/login. Dura 1 hora e incluye el rol y el año lectivo.' },
            tokenV2: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token de POST /api/v2/auth/login. Dura 8 horas.' }
        },
        schemas: {
            Error: { type: 'object', properties: { error: { type: 'string' } }, required: ['error'] },
            ...esquemasV2
        },
        responses: {
            ErrorInterno: respuesta('Error interno del servidor', { error: 'Error interno del servidor.' })
        }
    }
})
