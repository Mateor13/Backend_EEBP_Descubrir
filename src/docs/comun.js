// Utilidades compartidas para construir la especificación OpenAPI (v1 y v2).

// Express usa "/ruta/:id"; OpenAPI usa "/ruta/{id}"
export const aRutaOpenAPI = (ruta) => ruta.replace(/:([A-Za-z0-9_]+)/g, '{$1}')

// Descripciones de los parámetros de ruta más comunes
const PARAMETROS = {
    id: 'Identificador (ObjectId de MongoDB) del recurso',
    cursoId: 'Identificador del curso',
    idCurso: 'Identificador del curso',
    materiaId: 'Identificador de la materia',
    idMateria: 'Identificador de la materia',
    idProfesorNuevo: 'Identificador del nuevo profesor',
    idEstudiante: 'Identificador del estudiante',
    claseId: 'Identificador de la clase',
    representanteId: 'Identificador del representante',
    token: 'Token de un solo uso recibido por correo (64 caracteres hexadecimales)',
    tipo: 'Tipo de evaluación'
}

export const parametrosDeRuta = (ruta, extra = {}) =>
    [...ruta.matchAll(/:([A-Za-z0-9_]+)/g)].map(([, nombre]) => ({
        name: nombre,
        in: 'path',
        required: true,
        description: extra[nombre]?.description ?? PARAMETROS[nombre] ?? nombre,
        schema: extra[nombre]?.schema ?? (nombre === 'token' ? { type: 'string', pattern: '^[a-f0-9]{64}$' }
            : nombre === 'tipo' ? { type: 'string' } : { type: 'string', pattern: '^[a-f0-9]{24}$' })
    }))

// Las respuestas grabadas por la prueba de contrato usan marcadores (<id3>, <jwt>...).
// Para los ejemplos de la documentación se cambian por valores verosímiles y estables.
export const desnormalizar = (valor) => {
    if (typeof valor === 'string') {
        return valor
            .replace(/<id(\d+)>/g, (_, n) => `6740a1b2c3d4e5f6a7b8${String(n).padStart(4, '0')}`)
            .replace(/<id-nuevo>/g, '6740a1b2c3d4e5f6a7b8ffff')
            .replace(/<jwt>/g, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NDBhMWIyYzNkNGU1ZjZhN2I4MDAwMyJ9.firma')
            .replace(/<token>/g, 'a3f1c9e2b7d4a6f8c0e1b2d3f4a5c6e7d8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3')
            .replace(/<fecha-iso>/g, '2026-11-10T15:30:00.000Z')
            .replace(/<fecha-dma>/g, '10/11/2026')
            .replace(/<fecha-amd>/g, '2026/11/10')
            .replace(/<periodo-actual>/g, '2026-2027')
            .replace(/<periodo-siguiente>/g, '2027-2028')
    }
    if (Array.isArray(valor)) return valor.map(desnormalizar)
    if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, desnormalizar(v)]))
    return valor
}

// Ejemplo JSON genérico de error
export const respuesta = (descripcion, ejemplo, esquema = { $ref: '#/components/schemas/Error' }) => ({
    description: descripcion,
    content: { 'application/json': { schema: esquema, ...(ejemplo !== undefined && { example: ejemplo }) } }
})

export const DESCRIPCION_CODIGO = {
    200: 'Operación exitosa',
    201: 'Recurso creado',
    204: 'Operación exitosa, sin contenido',
    400: 'Datos inválidos o regla de negocio incumplida',
    401: 'Sin sesión o token inválido/expirado',
    403: 'La sesión no tiene permiso para esta acción',
    404: 'No encontrado',
    409: 'Conflicto (duplicado o periodo cerrado)',
    429: 'Demasiados intentos fallidos; intente en 15 minutos',
    500: 'Error interno del servidor'
}
