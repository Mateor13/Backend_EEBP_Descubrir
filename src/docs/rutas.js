import fs from 'node:fs'
import { Router } from 'express'

// Publica la documentación de la API:
//   GET /api/docs               -> Swagger UI (interfaz para leer y probar los endpoints)
//   GET /api/docs/openapi.json  -> especificación OpenAPI 3.1
// La especificación se genera con "npm run docs:generar" (docs/openapi.json).
// Swagger UI se carga desde un CDN con versión fija: no añade dependencias al despliegue.
const SWAGGER_UI = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.34.0'
const especificacion = fs.readFileSync(new URL('../../docs/openapi.json', import.meta.url), 'utf8')

const pagina = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Escuela Descubrir · Documentación</title>
  <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css">
  <style>body { margin: 0; } .swagger-ui .topbar { display: none; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI}/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: './docs/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: false
    })
  </script>
</body>
</html>`

export const crearRutasDocs = () => {
    const router = Router()
    router.get('/docs/openapi.json', (req, res) => res.type('application/json').send(especificacion))
    // Sin barra final, "./docs/openapi.json" se resuelve como /api/docs/openapi.json
    router.get('/docs', (req, res) => res.type('html').send(pagina))
    return router
}
