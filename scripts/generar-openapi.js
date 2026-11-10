// Genera docs/openapi.json a partir de src/docs (v1 a mano + v2 desde los esquemas zod).
//   npm run docs:generar
// Una prueba (tests/docs) falla si el archivo publicado quedó desactualizado.
import fs from 'node:fs'
import { construirOpenAPI } from '../src/docs/openapi.js'

export const RUTA_OPENAPI = new URL('../docs/openapi.json', import.meta.url)
export const serializar = (spec) => JSON.stringify(spec, null, 2) + '\n'

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    fs.writeFileSync(RUTA_OPENAPI, serializar(construirOpenAPI()))
    const spec = JSON.parse(fs.readFileSync(RUTA_OPENAPI, 'utf8'))
    const operaciones = Object.values(spec.paths).reduce((n, p) => n + Object.keys(p).length, 0)
    console.log(`docs/openapi.json generado: ${operaciones} operaciones`)
}
