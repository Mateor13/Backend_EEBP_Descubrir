// ============================================================================
// Documentación OpenAPI de la API v2 (/api/v2/...).
// Los cuerpos, parámetros y filtros se GENERAN desde los mismos esquemas zod que validan las
// peticiones (z.toJSONSchema): la documentación no puede quedar desalineada de la validación.
// ============================================================================
import { z } from 'zod'
import { aRutaOpenAPI, parametrosDeRuta, respuesta, DESCRIPCION_CODIGO } from './comun.js'
import { esquemas as auth } from '../v2/modules/auth/auth.modulo.js'
import { esquemas as usuarios } from '../v2/modules/usuarios/usuarios.modulo.js'
import { esquemas as periodos } from '../v2/modules/periodos/periodos.modulo.js'
import { esquemas as academico } from '../v2/modules/academico/academico.modulo.js'
import { esquemas as estudiantes, consultaPeriodo } from '../v2/modules/estudiantes/estudiantes.modulo.js'
import { esquemas as calificaciones } from '../v2/modules/calificaciones/calificaciones.modulo.js'
import { esquemas as asistencias } from '../v2/modules/asistencias/asistencias.modulo.js'
import { esquemas as observaciones } from '../v2/modules/observaciones/observaciones.modulo.js'
import { CAMPO_TRAMPA } from '../v2/shared/middlewares/antiSpam.js'

// zod -> JSON Schema (formato de ENTRADA: lo que el cliente debe enviar)
const aJsonSchema = (esquema) => {
    const json = z.toJSONSchema(esquema, { io: 'input', unrepresentable: 'any' })
    delete json.$schema // la versión de JSON Schema ya la fija OpenAPI 3.1
    return json
}

const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` })
const lista = (nombre) => ({ type: 'array', items: ref(nombre) })

// ---------- Constructor de operaciones ----------
// acceso: 'publico' | 'sesion' (cualquier usuario autenticado) | lista de roles
const operacion = (metodo, ruta, d) => {
    const respuestas = {}
    const [codigoExito, esquemaExito, descripcionExito] = d.exito ?? [200]
    respuestas[codigoExito] = codigoExito === 204
        ? { description: DESCRIPCION_CODIGO[204] }
        : respuesta(descripcionExito ?? DESCRIPCION_CODIGO[codigoExito], undefined, esquemaExito)
    if (d.cuerpo || d.query || ruta.includes(':')) respuestas[400] = respuesta(DESCRIPCION_CODIGO[400], { error: 'Identificador no válido', detalles: [{ campo: 'id', mensaje: 'Identificador no válido' }] }, ref('ErrorV2'))
    if (d.acceso !== 'publico') respuestas[401] = respuesta(DESCRIPCION_CODIGO[401], { error: 'Debe iniciar sesión' }, ref('ErrorV2'))
    if (Array.isArray(d.acceso) || d.prohibido) {
        const quien = Array.isArray(d.acceso) ? d.acceso.join(' o ') : ''
        respuestas[403] = respuesta(d.prohibido ?? `${DESCRIPCION_CODIGO[403]} (requiere: ${quien})`, { error: 'No tiene permisos para realizar esta acción' }, ref('ErrorV2'))
    }
    for (const codigo of d.errores ?? []) respuestas[codigo] ??= respuesta(DESCRIPCION_CODIGO[codigo], undefined, ref('ErrorV2'))
    if (d.limiteIntentos) respuestas[429] = respuesta(DESCRIPCION_CODIGO[429], { error: 'Demasiados intentos, intente de nuevo en 15 minutos' }, ref('ErrorV2'))

    const parametros = ruta.includes(':') ? parametrosDeRuta(ruta) : []
    if (d.query) {
        const json = aJsonSchema(d.query)
        for (const [nombre, schema] of Object.entries(json.properties ?? {})) {
            parametros.push({ name: nombre, in: 'query', required: (json.required ?? []).includes(nombre), schema, ...(d.descripcionQuery?.[nombre] && { description: d.descripcionQuery[nombre] }) })
        }
    }

    let requestBody
    if (d.cuerpo) {
        const schema = aJsonSchema(d.cuerpo)
        if (d.trampa) {
            schema.properties = { ...schema.properties, [CAMPO_TRAMPA]: { type: 'string', maxLength: 0, description: 'Campo trampa anti-bots: el formulario lo oculta y debe enviarse vacío o no enviarse. Si llega con contenido, la petición se rechaza.' } }
            delete schema.additionalProperties
        }
        if (d.multipart) {
            schema.properties = { ...schema.properties, evidencia: { type: 'string', format: 'binary', description: 'Imagen opcional (JPEG, PNG, GIF o WEBP, hasta 10 MB)' } }
        }
        requestBody = { required: true, content: { [d.multipart ? 'multipart/form-data' : 'application/json']: { schema } } }
    }

    const roles = Array.isArray(d.acceso) ? `\n\n**Acceso:** ${d.acceso.join(', ')}.` : d.acceso === 'sesion' ? '\n\n**Acceso:** cualquier usuario autenticado (el servicio comprueba si puede ver ese recurso).' : ''
    return [metodo, `/api/v2${aRutaOpenAPI(ruta)}`, {
        tags: [d.tag],
        summary: d.resumen,
        description: `${d.descripcion ?? ''}${roles}`.trim() || undefined,
        operationId: `v2_${metodo}_${ruta.replace(/[/:-]+/g, '_').replace(/^_|_$/g, '')}`,
        security: d.acceso === 'publico' ? [] : [{ tokenV2: [] }],
        ...(parametros.length && { parameters: parametros }),
        ...(requestBody && { requestBody }),
        responses: respuestas
    }]
}

const ADMIN = ['admin']
const DOCENTES = ['admin', 'profesor']
const T = {
    sistema: 'v2 · Sistema', auth: 'v2 · Autenticación', usuarios: 'v2 · Usuarios', periodos: 'v2 · Periodos',
    promocion: 'v2 · Promoción de año', academico: 'v2 · Cursos, asignaturas y clases', estudiantes: 'v2 · Estudiantes y matrículas',
    calificaciones: 'v2 · Evaluaciones y calificaciones', asistencias: 'v2 · Asistencia', observaciones: 'v2 · Observaciones'
}
const descPeriodo = { periodo: 'Id del periodo a consultar; si se omite, se usa el periodo activo' }

export const tagsV2 = [
    { name: T.sistema, description: 'Estado del servicio.' },
    { name: T.auth, description: 'Sesión (JWT de 8 h, audiencia "api-v2"), activación de cuentas y recuperación de contraseña. Las cuentas se crean sin contraseña: la persona la define con el enlace de activación.' },
    { name: T.usuarios, description: 'Gestión de cuentas. Un usuario puede tener varios roles (admin, profesor, representante). Solo administradores.' },
    { name: T.periodos, description: 'Años lectivos: planificado → activo → cerrado. Solo puede haber un periodo activo.' },
    { name: T.promocion, description: 'Promoción de año por partes, pensada para el límite de tiempo por petición de Vercel: iniciar → procesar (repetir hasta "completado").' },
    { name: T.academico, description: 'Catálogo de cursos y asignaturas, y clases (asignatura dictada en un curso por un profesor en un periodo).' },
    { name: T.estudiantes, description: 'Estudiantes, sus representantes y sus matrículas por periodo.' },
    { name: T.calificaciones, description: 'Evaluaciones de una clase (una sola vez, con evidencia opcional), calificaciones por estudiante y boletín.' },
    { name: T.asistencias, description: 'Asistencia diaria por curso. Las faltas se calculan a partir de los registros.' },
    { name: T.observaciones, description: 'Observaciones de conducta o desempeño.' }
]

export const operacionesV2 = [
    operacion('get', '/salud', { tag: T.sistema, resumen: 'Estado del servicio', acceso: 'publico', exito: [200, { type: 'object', properties: { estado: { type: 'string', example: 'ok' }, version: { type: 'integer', example: 2 } } }] }),

    // ---------- Autenticación ----------
    operacion('post', '/auth/login', { tag: T.auth, resumen: 'Iniciar sesión', acceso: 'publico', cuerpo: auth.login, trampa: true, limiteIntentos: true, exito: [200, ref('SesionV2')], errores: [401, 403],
        descripcion: 'Devuelve el mismo error si el email no existe o la contraseña es incorrecta. 403 si la cuenta está desactivada o sin activar.' }),
    operacion('post', '/auth/activar', { tag: T.auth, resumen: 'Activar cuenta y crear contraseña', acceso: 'publico', cuerpo: auth.tokenYPassword, trampa: true, limiteIntentos: true, exito: [200, ref('Mensaje')],
        descripcion: 'Usa el token del correo de bienvenida (válido 72 h, un solo uso).' }),
    operacion('post', '/auth/recuperar', { tag: T.auth, resumen: 'Solicitar recuperación de contraseña', acceso: 'publico', cuerpo: auth.recuperar, trampa: true, limiteIntentos: true, exito: [200, ref('Mensaje')],
        descripcion: 'Responde igual exista o no el email (no revela qué cuentas existen). El enlace vence en 1 hora.' }),
    operacion('post', '/auth/restablecer', { tag: T.auth, resumen: 'Restablecer contraseña', acceso: 'publico', cuerpo: auth.tokenYPassword, trampa: true, limiteIntentos: true, exito: [200, ref('Mensaje')] }),
    operacion('get', '/auth/perfil', { tag: T.auth, resumen: 'Ver mi perfil', acceso: 'sesion', exito: [200, ref('Usuario')] }),
    operacion('patch', '/auth/perfil', { tag: T.auth, resumen: 'Actualizar mi perfil', acceso: 'sesion', cuerpo: auth.perfil, exito: [200, ref('Usuario')], errores: [409], descripcion: 'Si cambia el email, se avisa al email anterior.' }),
    operacion('patch', '/auth/password', { tag: T.auth, resumen: 'Cambiar mi contraseña', acceso: 'sesion', cuerpo: auth.cambiarPassword, exito: [204] }),

    // ---------- Usuarios ----------
    operacion('post', '/usuarios', { tag: T.usuarios, resumen: 'Crear usuario', acceso: ADMIN, cuerpo: usuarios.crear, exito: [201, ref('Usuario')], errores: [409], descripcion: 'Envía un correo de activación. Si el correo no se puede enviar, el usuario no se crea.' }),
    operacion('get', '/usuarios', { tag: T.usuarios, resumen: 'Listar usuarios', acceso: ADMIN, query: usuarios.listar, exito: [200, lista('Usuario')] }),
    operacion('get', '/usuarios/:id', { tag: T.usuarios, resumen: 'Ver usuario', acceso: ADMIN, exito: [200, ref('Usuario')], errores: [404] }),
    operacion('patch', '/usuarios/:id', { tag: T.usuarios, resumen: 'Actualizar usuario', acceso: ADMIN, cuerpo: usuarios.actualizar, exito: [200, ref('Usuario')], errores: [404, 409] }),
    operacion('delete', '/usuarios/:id', { tag: T.usuarios, resumen: 'Desactivar usuario', acceso: ADMIN, exito: [204], errores: [404, 409], descripcion: 'No permite desactivarse a sí mismo ni dejar el sistema sin administradores.' }),
    operacion('post', '/usuarios/:id/reenviar-activacion', { tag: T.usuarios, resumen: 'Reenviar correo de activación', acceso: ADMIN, exito: [200, ref('Mensaje')], errores: [404] }),

    // ---------- Periodos ----------
    operacion('get', '/periodos', { tag: T.periodos, resumen: 'Listar periodos', acceso: 'sesion', exito: [200, lista('Periodo')] }),
    operacion('get', '/periodos/activo', { tag: T.periodos, resumen: 'Periodo activo', acceso: 'sesion', exito: [200, ref('Periodo')], errores: [404] }),
    operacion('post', '/periodos', { tag: T.periodos, resumen: 'Crear periodo (planificado)', acceso: ADMIN, cuerpo: periodos.crear, exito: [201, ref('Periodo')], errores: [409] }),
    operacion('patch', '/periodos/:id', { tag: T.periodos, resumen: 'Configurar periodo', acceso: ADMIN, cuerpo: periodos.configurar, exito: [200, ref('Periodo')], errores: [404, 409], descripcion: 'Ponderaciones (deben sumar 100), nota mínima, nivel mínimo de reprobación y fecha de fin.' }),
    operacion('post', '/periodos/:id/activar', { tag: T.periodos, resumen: 'Activar periodo', acceso: ADMIN, exito: [200, ref('Periodo')], errores: [404, 409] }),
    operacion('post', '/periodos/:id/cerrar', { tag: T.periodos, resumen: 'Cerrar periodo', acceso: ADMIN, exito: [200, ref('Periodo')], errores: [404, 409] }),

    // ---------- Promoción ----------
    operacion('get', '/periodos/:id/promocion/vista-previa', { tag: T.promocion, resumen: 'Vista previa de la promoción de un curso', acceso: ADMIN, query: periodos.vistaPrevia, exito: [200, lista('ResultadoPromocion')], errores: [404], descripcion: 'Calcula quién aprueba o repite en un curso sin guardar nada.' }),
    operacion('get', '/periodos/:id/promocion', { tag: T.promocion, resumen: 'Estado del proceso de promoción', acceso: ADMIN, exito: [200, ref('EstadoPromocion')], errores: [404] }),
    operacion('post', '/periodos/:id/promocion', { tag: T.promocion, resumen: 'Iniciar la promoción hacia otro periodo', acceso: ADMIN, cuerpo: periodos.promocion, exito: [201, ref('EstadoPromocion')], errores: [404, 409],
        descripcion: 'El periodo de origen ({id}) debe estar cerrado. Prepara los cursos destino y copia la planta docente; luego hay que llamar a /procesar.' }),
    operacion('post', '/periodos/:id/promocion/procesar', { tag: T.promocion, resumen: 'Avanzar la promoción', acceso: ADMIN, exito: [200, ref('EstadoPromocion')], errores: [404, 409],
        descripcion: 'Procesa los cursos que caben en PROMOCION_PRESUPUESTO_MS (7 s por defecto) y guarda el avance. Repetir hasta que estado sea "completado". Un 409 indica que otra petición está procesando: reintentar en unos segundos.' }),

    // ---------- Académico ----------
    operacion('get', '/cursos', { tag: T.academico, resumen: 'Listar cursos', acceso: 'sesion', exito: [200, lista('Curso')] }),
    operacion('post', '/cursos', { tag: T.academico, resumen: 'Crear curso', acceso: ADMIN, cuerpo: academico.curso, exito: [201, ref('Curso')], errores: [409] }),
    operacion('get', '/asignaturas', { tag: T.academico, resumen: 'Listar asignaturas', acceso: 'sesion', exito: [200, lista('Asignatura')] }),
    operacion('post', '/asignaturas', { tag: T.academico, resumen: 'Crear asignatura', acceso: ADMIN, cuerpo: academico.asignatura, exito: [201, ref('Asignatura')], errores: [409] }),
    operacion('patch', '/asignaturas/:id', { tag: T.academico, resumen: 'Actualizar asignatura', acceso: ADMIN, cuerpo: academico.actualizarAsignatura, exito: [200, ref('Asignatura')], errores: [404] }),
    operacion('get', '/clases', { tag: T.academico, resumen: 'Listar clases', acceso: DOCENTES, query: academico.listarClases, exito: [200, lista('Clase')], descripcion: 'El administrador ve todas (con filtros); el profesor solo las suyas.' }),
    operacion('post', '/clases', { tag: T.academico, resumen: 'Crear clase', acceso: ADMIN, cuerpo: academico.clase, exito: [201, ref('Clase')], errores: [404, 409] }),
    operacion('patch', '/clases/:id', { tag: T.academico, resumen: 'Cambiar el profesor de una clase', acceso: ADMIN, cuerpo: academico.cambiarProfesor, exito: [200, ref('Clase')], errores: [404, 409] }),
    operacion('delete', '/clases/:id', { tag: T.academico, resumen: 'Desactivar clase', acceso: ADMIN, exito: [204], errores: [404] }),

    // ---------- Estudiantes y matrículas ----------
    operacion('post', '/estudiantes', { tag: T.estudiantes, resumen: 'Crear estudiante', acceso: ADMIN, cuerpo: estudiantes.crear, exito: [201, ref('Estudiante')], errores: [404, 409], descripcion: 'Si se indica curso, lo matricula en el periodo activo en la misma transacción.' }),
    operacion('get', '/estudiantes/mios', { tag: T.estudiantes, resumen: 'Mis estudiantes (representante)', acceso: ['representante'], query: consultaPeriodo, descripcionQuery: descPeriodo, exito: [200, lista('EstudianteConCurso')] }),
    operacion('get', '/estudiantes/:id', { tag: T.estudiantes, resumen: 'Ver estudiante', acceso: 'sesion', query: consultaPeriodo, descripcionQuery: descPeriodo, prohibido: 'Solo admin, sus profesores o sus representantes', exito: [200, ref('EstudianteDetalle')], errores: [404] }),
    operacion('patch', '/estudiantes/:id', { tag: T.estudiantes, resumen: 'Actualizar estudiante', acceso: ADMIN, cuerpo: estudiantes.actualizar, exito: [200, ref('Estudiante')], errores: [404, 409] }),
    operacion('delete', '/estudiantes/:id', { tag: T.estudiantes, resumen: 'Desactivar estudiante', acceso: ADMIN, exito: [204], errores: [404] }),
    operacion('post', '/estudiantes/:id/representantes', { tag: T.estudiantes, resumen: 'Vincular representante', acceso: ADMIN, cuerpo: estudiantes.representante, exito: [204], errores: [404] }),
    operacion('delete', '/estudiantes/:id/representantes/:representanteId', { tag: T.estudiantes, resumen: 'Desvincular representante', acceso: ADMIN, exito: [204], errores: [404] }),
    operacion('post', '/matriculas', { tag: T.estudiantes, resumen: 'Matricular estudiante', acceso: ADMIN, cuerpo: estudiantes.matricular, exito: [201, ref('Matricula')], errores: [404, 409] }),
    operacion('patch', '/matriculas/:id', { tag: T.estudiantes, resumen: 'Cambiar de curso', acceso: ADMIN, cuerpo: estudiantes.cambiarCurso, exito: [200, ref('Matricula')], errores: [404, 409] }),
    operacion('post', '/matriculas/:id/retiro', { tag: T.estudiantes, resumen: 'Retirar matrícula', acceso: ADMIN, exito: [200, ref('Matricula')], errores: [404, 409] }),
    operacion('get', '/cursos/:cursoId/estudiantes', { tag: T.estudiantes, resumen: 'Estudiantes de un curso', acceso: DOCENTES, query: consultaPeriodo, descripcionQuery: descPeriodo, exito: [200, lista('EstudianteDeCurso')], descripcion: 'El profesor solo puede consultar cursos donde dicta clases.' }),

    // ---------- Evaluaciones y calificaciones ----------
    operacion('post', '/clases/:claseId/evaluaciones', { tag: T.calificaciones, resumen: 'Crear evaluación', acceso: DOCENTES, cuerpo: calificaciones.crear, multipart: true, exito: [201, ref('Evaluacion')], errores: [404, 409], descripcion: 'Solo el profesor de la clase (o un admin). Se envía como multipart/form-data para permitir la foto de evidencia.' }),
    operacion('get', '/clases/:claseId/evaluaciones', { tag: T.calificaciones, resumen: 'Listar evaluaciones de una clase', acceso: DOCENTES, query: calificaciones.listar, exito: [200, lista('Evaluacion')], errores: [404] }),
    operacion('patch', '/evaluaciones/:id', { tag: T.calificaciones, resumen: 'Actualizar evaluación', acceso: DOCENTES, cuerpo: calificaciones.actualizar, multipart: true, exito: [200, ref('Evaluacion')], errores: [404, 409] }),
    operacion('delete', '/evaluaciones/:id', { tag: T.calificaciones, resumen: 'Eliminar evaluación y sus notas', acceso: DOCENTES, exito: [204], errores: [404, 409] }),
    operacion('get', '/evaluaciones/:id/calificaciones', { tag: T.calificaciones, resumen: 'Planilla de notas de una evaluación', acceso: DOCENTES, exito: [200, ref('Planilla')], errores: [404] }),
    operacion('put', '/evaluaciones/:id/calificaciones', { tag: T.calificaciones, resumen: 'Registrar o corregir notas', acceso: DOCENTES, cuerpo: calificaciones.calificaciones, exito: [200, { type: 'object', properties: { registradas: { type: 'integer' } } }], errores: [404, 409], descripcion: 'Idempotente: registrar y corregir es la misma operación. Solo estudiantes del curso de la clase.' }),
    operacion('get', '/estudiantes/:id/boletin', { tag: T.calificaciones, resumen: 'Boletín del estudiante', acceso: 'sesion', query: calificaciones.boletin, descripcionQuery: descPeriodo, prohibido: 'Solo admin, sus profesores o sus representantes', exito: [200, ref('Boletin')], errores: [404] }),

    // ---------- Asistencia ----------
    operacion('put', '/cursos/:cursoId/asistencias', { tag: T.asistencias, resumen: 'Registrar la asistencia del día', acceso: DOCENTES, cuerpo: asistencias.registrar, exito: [200, { type: 'object', properties: { registradas: { type: 'integer' }, fecha: { type: 'string', format: 'date-time' } } }], errores: [404], descripcion: 'Idempotente. Si no se indica fecha, se usa la de hoy en Ecuador. No admite fechas futuras.' }),
    operacion('get', '/cursos/:cursoId/asistencias', { tag: T.asistencias, resumen: 'Lista de asistencia del día', acceso: DOCENTES, query: asistencias.fecha, exito: [200, ref('ListaAsistencia')], errores: [404] }),
    operacion('patch', '/asistencias/:id/justificacion', { tag: T.asistencias, resumen: 'Justificar ausencia o atraso', acceso: ADMIN, cuerpo: asistencias.justificar, exito: [200, ref('Asistencia')], errores: [404, 409] }),
    operacion('get', '/estudiantes/:id/asistencias', { tag: T.asistencias, resumen: 'Historial de asistencia', acceso: 'sesion', query: asistencias.periodo, descripcionQuery: descPeriodo, prohibido: 'Solo admin, sus profesores o sus representantes', exito: [200, ref('HistorialAsistencia')], errores: [404] }),

    // ---------- Observaciones ----------
    operacion('post', '/estudiantes/:id/observaciones', { tag: T.observaciones, resumen: 'Registrar observación', acceso: DOCENTES, cuerpo: observaciones.crear, exito: [201, ref('Observacion')], errores: [404], descripcion: 'Solo un profesor que dicta clases al estudiante (o un admin).' }),
    operacion('get', '/estudiantes/:id/observaciones', { tag: T.observaciones, resumen: 'Observaciones del estudiante', acceso: 'sesion', query: observaciones.periodo, descripcionQuery: descPeriodo, prohibido: 'Solo admin, sus profesores o sus representantes', exito: [200, lista('Observacion')], errores: [404] })
]

// ---------- Esquemas de respuesta (según los "mappers" de cada servicio) ----------
const id = { type: 'string', pattern: '^[a-f0-9]{24}$' }
const fecha = { type: 'string', format: 'date-time' }
const obj = (properties, extra = {}) => ({ type: 'object', properties, ...extra })
const personaCorta = obj({ id, nombre: { type: 'string' }, apellido: { type: 'string' } })
const ponderaciones = obj({ deber: { type: 'number' }, taller: { type: 'number' }, prueba: { type: 'number' }, examen: { type: 'number' } })

export const esquemasV2 = {
    ErrorV2: obj({ error: { type: 'string' }, detalles: { type: 'array', items: obj({ campo: { type: 'string' }, mensaje: { type: 'string' } }) } }, { required: ['error'] }),
    Mensaje: obj({ mensaje: { type: 'string' } }),
    Usuario: obj({ id, nombre: { type: 'string' }, apellido: { type: 'string' }, cedula: { type: 'string' }, email: { type: 'string', format: 'email' }, telefono: { type: 'string' }, direccion: { type: 'string' },
        roles: { type: 'array', items: { type: 'string', enum: ['admin', 'profesor', 'representante'] } }, activo: { type: 'boolean' }, emailConfirmado: { type: 'boolean' } }),
    SesionV2: obj({ token: { type: 'string', description: 'JWT para el encabezado Authorization: Bearer' }, usuario: ref('Usuario') }),
    Periodo: obj({ id, nombre: { type: 'string', example: '2025-2026' }, inicio: fecha, fin: { ...fecha, nullable: true }, estado: { type: 'string', enum: ['planificado', 'activo', 'cerrado'] },
        ponderaciones, notaMinima: { type: 'number' }, nivelMinimoReprobacion: { type: 'integer' } }),
    Curso: obj({ id, nivel: { type: 'integer', minimum: 1, maximum: 7 }, paralelo: { type: 'string' }, nombre: { type: 'string', example: 'Quinto A' } }),
    Asignatura: obj({ _id: id, nombre: { type: 'string' }, activo: { type: 'boolean' } }),
    Clase: obj({ id, periodo: id, curso: ref('Curso'), asignatura: obj({ id, nombre: { type: 'string' } }), profesor: personaCorta }),
    Estudiante: obj({ id, nombre: { type: 'string' }, apellido: { type: 'string' }, cedula: { type: 'string' }, activo: { type: 'boolean' } }),
    EstudianteConCurso: { allOf: [ref('Estudiante'), obj({ curso: { ...ref('Curso'), nullable: true } })] },
    EstudianteDeCurso: { allOf: [ref('Estudiante'), obj({ matricula: obj({ id, estado: { type: 'string' } }) })] },
    EstudianteDetalle: { allOf: [ref('Estudiante'), obj({
        representantes: { type: 'array', items: obj({ id, nombre: { type: 'string' }, apellido: { type: 'string' }, email: { type: 'string' }, telefono: { type: 'string' } }) },
        matricula: { nullable: true, ...obj({ id, estado: { type: 'string' }, curso: ref('Curso'), periodo: { type: 'string' } }) }
    })] },
    Matricula: obj({ _id: id, periodo: id, curso: id, estudiante: id, estado: { type: 'string', enum: ['activa', 'retirada', 'aprobada', 'reprobada'] } }),
    Evaluacion: obj({ id, clase: id, tipo: { type: 'string', enum: ['deber', 'taller', 'prueba', 'examen'] }, titulo: { type: 'string' }, descripcion: { type: 'string' }, fecha, evidenciaUrl: { type: 'string', nullable: true } }),
    Planilla: obj({ evaluacion: ref('Evaluacion'), estudiantes: { type: 'array', items: obj({ id, nombre: { type: 'string' }, apellido: { type: 'string' }, cedula: { type: 'string' }, nota: { type: 'number', nullable: true } }) } }),
    Boletin: obj({
        periodo: obj({ id, nombre: { type: 'string' }, estado: { type: 'string' }, ponderaciones }),
        estudiante: id,
        materias: { type: 'array', items: obj({
            clase: ref('Clase'),
            promedio: obj({ porTipo: obj({ deber: { type: 'number', nullable: true }, taller: { type: 'number', nullable: true }, prueba: { type: 'number', nullable: true }, examen: { type: 'number', nullable: true } }), final: { type: 'number', nullable: true } }),
            evaluaciones: { type: 'array', items: { allOf: [ref('Evaluacion'), obj({ nota: { type: 'number', nullable: true } })] } }
        }) },
        resultado: obj({ aprueba: { type: 'boolean' }, clasesReprobadas: { type: 'integer' }, provisional: { type: 'boolean', description: 'true mientras el periodo no esté cerrado' } })
    }),
    Asistencia: obj({ _id: id, estudiante: id, curso: id, periodo: id, fecha, estado: { type: 'string', enum: ['presente', 'ausente', 'atraso', 'justificado'] }, justificacion: { type: 'string' } }),
    ListaAsistencia: obj({ fecha, registrada: { type: 'boolean' }, estudiantes: { type: 'array', items: obj({ id, nombre: { type: 'string' }, apellido: { type: 'string' }, estado: { type: 'string', nullable: true }, asistenciaId: { ...id, nullable: true } }) } }),
    HistorialAsistencia: obj({ periodo: { type: 'string' }, resumen: obj({ presente: { type: 'integer' }, ausente: { type: 'integer' }, atraso: { type: 'integer' }, justificado: { type: 'integer' } }),
        registros: { type: 'array', items: obj({ id, fecha, estado: { type: 'string' }, justificacion: { type: 'string' } }) } }),
    Observacion: obj({ id, texto: { type: 'string' }, fecha, autor: { ...personaCorta, nullable: true } }),
    ResultadoPromocion: obj({ estudiante: id, aprueba: { type: 'boolean' }, clasesReprobadas: { type: 'integer' }, nivelDestino: { type: 'integer', nullable: true, description: 'null = egresa' } }),
    EstadoPromocion: obj({ origen: id, destino: id, estado: { type: 'string', enum: ['en_progreso', 'completado'] }, total: { type: 'integer', description: 'Cursos a procesar' }, procesados: { type: 'integer' },
        resumen: obj({ promovidos: { type: 'integer' }, repiten: { type: 'integer' }, egresados: { type: 'integer' }, yaMatriculados: { type: 'integer' }, clasesCopiadas: { type: 'integer' } }), finalizado: { ...fecha, nullable: true } })
}
