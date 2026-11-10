// ============================================================================
// Documentación OpenAPI de la API v1 (/api/...), la que usa hoy el frontend.
// Los ejemplos de respuesta son respuestas REALES grabadas por la prueba de contrato
// (tests/v1/contrato.snapshot.json): si la API cambia, el ejemplo cambia con ella.
// ============================================================================
import fs from 'node:fs'
import { aRutaOpenAPI, desnormalizar, parametrosDeRuta, respuesta, DESCRIPCION_CODIGO } from './comun.js'

const FOTO = JSON.parse(fs.readFileSync(new URL('../../tests/v1/contrato.snapshot.json', import.meta.url), 'utf8'))
const pasoDeContrato = (nombre) => {
    const paso = FOTO.find(p => p.paso === nombre)
    if (!paso) throw new Error(`Documentación v1: no existe el paso "${nombre}" en la prueba de contrato`)
    return { status: paso.status, ejemplo: desnormalizar(paso.cuerpo) }
}

// ---------- Campos reutilizables ----------
const S = {
    id: { type: 'string', pattern: '^[a-f0-9]{24}$', example: '6740a1b2c3d4e5f6a7b80008' },
    nombre: { type: 'string', description: 'Solo letras y espacios', example: 'Carla' },
    apellido: { type: 'string', description: 'Solo letras y espacios', example: 'Mora' },
    email: { type: 'string', format: 'email', example: 'carla@escuela.edu.ec' },
    telefono: { type: 'string', pattern: '^\\d{10}$', example: '0991234567' },
    cedula: { type: 'string', pattern: '^\\d{10}$', example: '1712345678' },
    direccion: { type: 'string', minLength: 5, maxLength: 100, example: 'Av. Amazonas N24-100' },
    password: { type: 'string', minLength: 6, example: 'MiClave123' },
    tipoEvaluacion: { type: 'string', enum: ['deberes', 'talleres', 'examenes', 'pruebas'] }
}
const persona = {
    propiedades: { nombre: S.nombre, apellido: S.apellido, email: S.email, telefono: S.telefono, cedula: S.cedula, direccion: S.direccion },
    requeridos: ['nombre', 'apellido', 'email', 'telefono', 'cedula', 'direccion']
}

const MENSAJE_ROL = {
    administrador: 'Lo sentimos, no tienes permisos de administrador para realizar esta acción',
    profesor: 'Lo sentimos, no tienes permisos de profesor para realizar esta acción',
    representante: 'Lo sentimos, no tienes permisos para realizar esta acción'
}

// ---------- Constructor de operaciones ----------
const operacion = (metodo, ruta, d) => {
    const respuestas = {}
    const agregar = (codigo, fuente, descripcion) => {
        const { ejemplo } = typeof fuente === 'string' ? pasoDeContrato(fuente) : { ejemplo: fuente }
        const esError = codigo >= 400
        respuestas[codigo] = respuesta(descripcion ?? DESCRIPCION_CODIGO[codigo], ejemplo, esError ? { $ref: '#/components/schemas/Error' } : d.esquemaExito)
    }
    if (d.exito) {
        const { status } = typeof d.exito === 'string' ? pasoDeContrato(d.exito) : { status: d.exito.status }
        agregar(status, typeof d.exito === 'string' ? d.exito : d.exito.ejemplo)
    }
    for (const [codigo, fuente] of Object.entries(d.errores ?? {})) agregar(Number(codigo), fuente)
    if (d.rol) {
        respuestas[401] ??= respuesta(DESCRIPCION_CODIGO[401], pasoDeContrato('perfil sin token').ejemplo)
        if (d.rol !== 'cualquiera') respuestas[403] ??= respuesta(`${DESCRIPCION_CODIGO[403]} (requiere rol ${d.rol})`, { error: MENSAJE_ROL[d.rol] })
    }
    if (d.limiteIntentos) respuestas[429] = respuesta(DESCRIPCION_CODIGO[429], { error: 'Demasiados intentos, por favor intente de nuevo en 15 minutos' })

    let requestBody
    if (d.cuerpo) {
        const esquema = { type: 'object', properties: d.cuerpo.propiedades, required: d.cuerpo.requeridos }
        requestBody = {
            required: true,
            content: {
                [d.multipart ? 'multipart/form-data' : 'application/json']: { schema: esquema, ...(d.cuerpo.ejemplo && { example: d.cuerpo.ejemplo }) }
            }
        }
    }
    return [metodo, `/api${aRutaOpenAPI(ruta)}`, {
        tags: [d.tag],
        summary: d.resumen,
        ...(d.descripcion && { description: d.descripcion }),
        operationId: `v1_${metodo}_${ruta.replace(/[/:-]+/g, '_').replace(/^_|_$/g, '')}`,
        ...(d.rol ? { security: [{ tokenV1: [] }] } : { security: [] }),
        ...(ruta.includes(':') && { parameters: parametrosDeRuta(ruta, d.parametros) }),
        ...(requestBody && { requestBody }),
        responses: respuestas
    }]
}

const T = {
    auth: 'v1 · Autenticación y perfil', admins: 'v1 · Administradores', profes: 'v1 · Gestión de profesores',
    reps: 'v1 · Gestión de representantes', estudiantes: 'v1 · Estudiantes', cursos: 'v1 · Cursos', materias: 'v1 · Materias',
    asistencia: 'v1 · Asistencia', anio: 'v1 · Año lectivo', profesor: 'v1 · Profesor', representante: 'v1 · Representante'
}

export const tagsV1 = [
    { name: T.auth, description: 'Inicio de sesión, confirmación de cuenta, recuperación de contraseña y perfil. Login devuelve un JWT de 1 hora que incluye el rol y el año lectivo elegido.' },
    { name: T.admins, description: 'Gestión de cuentas de administrador (rol administrador).' },
    { name: T.profes, description: 'Gestión de cuentas de profesor (rol administrador).' },
    { name: T.reps, description: 'Gestión de cuentas de representante (rol administrador).' },
    { name: T.estudiantes, description: 'Registro y gestión de estudiantes (rol administrador).' },
    { name: T.cursos, description: 'Cursos del año lectivo (rol administrador).' },
    { name: T.materias, description: 'Materias de cada curso y su profesor (rol administrador).' },
    { name: T.asistencia, description: 'Registro y justificación de asistencia (rol administrador).' },
    { name: T.anio, description: 'Ciclo del año lectivo: ponderaciones, fecha de fin, cierre e inicio con promoción automática de estudiantes.' },
    { name: T.profesor, description: 'Funciones del profesor: notas, evidencias y observaciones de sus materias.' },
    { name: T.representante, description: 'Consultas del representante sobre SUS estudiantes.' }
]

export const operacionesV1 = [
    // ---------- Autenticación y perfil ----------
    operacion('get', '/listar-anios', { tag: T.auth, resumen: 'Listar años lectivos', descripcion: 'Público. El frontend lo usa para elegir el año lectivo en el login.', exito: 'listar años' }),
    operacion('post', '/login', {
        tag: T.auth, resumen: 'Iniciar sesión', limiteIntentos: true,
        descripcion: 'Devuelve un JWT (1 hora) y el rol. El año lectivo elegido queda dentro del token y determina qué datos se ven.',
        cuerpo: { propiedades: { email: S.email, password: S.password, anioLectivo: { ...S.id, description: 'Id de un año lectivo (de /api/listar-anios)' } }, requeridos: ['email', 'password', 'anioLectivo'],
            ejemplo: { email: 'carla@escuela.edu.ec', password: 'MiClave123', anioLectivo: '6740a1b2c3d4e5f6a7b80001' } },
        exito: 'login admin', errores: { 400: 'login credenciales incorrectas' }
    }),
    operacion('get', '/confirmar-cuenta/:token', { tag: T.auth, resumen: 'Confirmar cuenta', descripcion: 'Marca la cuenta como confirmada. El mismo token sirve después, durante 1 hora, para crear la contraseña con PATCH /api/nuevo-password/{token}.', exito: 'confirmar cuenta carla@escuela.test', errores: { 400: { error: 'El token no es válido' } } }),
    operacion('post', '/recuperar-password', { tag: T.auth, resumen: 'Solicitar recuperación de contraseña', limiteIntentos: true, descripcion: 'Envía un correo con un enlace válido por 1 hora.',
        cuerpo: { propiedades: { email: S.email }, requeridos: ['email'], ejemplo: { email: 'carla@escuela.edu.ec' } }, exito: 'recuperar contraseña', errores: { 400: 'recuperar contraseña email inexistente' } }),
    operacion('patch', '/nuevo-password/:token', { tag: T.auth, resumen: 'Crear o restablecer contraseña', limiteIntentos: true, descripcion: 'Usa el token del correo de confirmación o de recuperación. El token queda inutilizado después.',
        cuerpo: { propiedades: { password: S.password, confirmPassword: S.password }, requeridos: ['password', 'confirmPassword'], ejemplo: { password: 'MiClave123', confirmPassword: 'MiClave123' } },
        exito: 'crear contraseña carla@escuela.test', errores: { 400: { error: 'El token no es válido' } } }),
    operacion('get', '/perfil', { tag: T.auth, resumen: 'Ver mi perfil', rol: 'cualquiera', exito: 'profesor: perfil' }),
    operacion('patch', '/cambiar-password', { tag: T.auth, resumen: 'Cambiar mi contraseña', rol: 'cualquiera',
        cuerpo: { propiedades: { password: { ...S.password, description: 'Contraseña actual' }, newPassword: S.password, confirmPassword: S.password }, requeridos: ['password', 'newPassword', 'confirmPassword'],
            ejemplo: { password: 'MiClave123', newPassword: 'Nueva1234', confirmPassword: 'Nueva1234' } },
        exito: 'profesor: cambiar contraseña', errores: { 400: 'profesor: cambiar contraseña incorrecta' } }),
    operacion('patch', '/cambiar-datos', { tag: T.auth, resumen: 'Cambiar mis datos', rol: 'cualquiera', descripcion: 'Si cambia el email, se avisa al email anterior.',
        cuerpo: { propiedades: { nombre: S.nombre, apellido: S.apellido, email: S.email, telefono: S.telefono, direccion: S.direccion }, requeridos: ['email', 'telefono', 'direccion'],
            ejemplo: { nombre: 'Carla', apellido: 'Mora', email: 'carla@escuela.edu.ec', telefono: '0991234567', direccion: 'Av. Amazonas N24-100' } },
        exito: 'profesor: cambiar datos', errores: { 400: { error: 'El email ya está registrado' } } }),

    // ---------- Administradores ----------
    operacion('post', '/registro', { tag: T.admins, resumen: 'Registrar administrador', rol: 'administrador', descripcion: 'Envía al correo las credenciales y el enlace de confirmación.', cuerpo: { ...persona, ejemplo: { nombre: 'Beatriz', apellido: 'Paredes', email: 'beatriz@escuela.edu.ec', telefono: '0991234567', cedula: '1712345678', direccion: 'Av. Amazonas N24-100' } }, exito: 'registrar admin', errores: { 400: 'registrar admin duplicado' } }),
    operacion('get', '/administradores', { tag: T.admins, resumen: 'Listar administradores activos', rol: 'administrador', exito: 'listar administradores' }),
    operacion('patch', '/modificar-administrador/:id', { tag: T.admins, resumen: 'Modificar administrador', rol: 'administrador', cuerpo: persona, exito: 'modificar administrador', errores: { 400: 'modificar representante con email inválido' } }),
    operacion('delete', '/eliminar-administrador/:id', { tag: T.admins, resumen: 'Desactivar administrador', rol: 'administrador', descripcion: 'Borrado lógico. No permite dejar el sistema sin administradores.', exito: 'eliminar administrador' }),

    // ---------- Profesores ----------
    operacion('post', '/registro-profesor', { tag: T.profes, resumen: 'Registrar profesor', rol: 'administrador', cuerpo: persona, exito: 'registrar profesor 1', errores: { 400: 'registrar admin duplicado' } }),
    operacion('get', '/profesores', { tag: T.profes, resumen: 'Listar profesores activos', rol: 'administrador', exito: 'listar profesores' }),
    operacion('patch', '/modificar-profesor/:id', { tag: T.profes, resumen: 'Modificar profesor', rol: 'administrador', cuerpo: persona, exito: 'modificar profesor' }),
    operacion('delete', '/eliminar-profesor/:id', { tag: T.profes, resumen: 'Desactivar profesor', rol: 'administrador', descripcion: 'No se permite si el profesor tiene materias asignadas.', exito: { status: 200, ejemplo: { msg: 'Profesor eliminado correctamente' } }, errores: { 400: 'eliminar profesor' } }),

    // ---------- Representantes ----------
    operacion('post', '/registro-representante', { tag: T.reps, resumen: 'Registrar representante', rol: 'administrador', cuerpo: persona, exito: 'registrar representante 1' }),
    operacion('get', '/representantes/:cursoId', { tag: T.reps, resumen: 'Listar representantes de un curso', rol: 'administrador', descripcion: 'Incluye solo los estudiantes del curso de cada representante.', exito: 'listar representantes del curso' }),
    operacion('patch', '/modificar-representante/:id', { tag: T.reps, resumen: 'Modificar representante', rol: 'administrador', cuerpo: persona, exito: 'modificar representante', errores: { 400: 'modificar representante con email inválido' } }),
    operacion('delete', '/eliminar-representante/:id', { tag: T.reps, resumen: 'Desactivar representante', rol: 'administrador', exito: 'eliminar representante' }),

    // ---------- Estudiantes ----------
    operacion('post', '/registro-estudiante', { tag: T.estudiantes, resumen: 'Registrar estudiante', rol: 'administrador', descripcion: 'Lo matricula en el curso, lo vincula al representante y crea sus registros de notas, asistencia y observaciones.',
        cuerpo: { propiedades: { nombre: S.nombre, apellido: S.apellido, cedula: S.cedula, curso: { ...S.id, description: 'Id del curso' }, cedulaRepresentante: S.cedula }, requeridos: ['nombre', 'apellido', 'cedula', 'curso', 'cedulaRepresentante'],
            ejemplo: { nombre: 'Pedro', apellido: 'Paz', cedula: '1750000001', curso: '6740a1b2c3d4e5f6a7b80008', cedulaRepresentante: '1700000006' } },
        exito: 'registrar estudiante 1', errores: { 400: 'registrar estudiante sin curso válido' } }),
    operacion('get', '/cursos/:cursoId/estudiantes', { tag: T.estudiantes, resumen: 'Listar estudiantes de un curso', rol: 'administrador', exito: 'listar estudiantes del curso', errores: { 404: 'nuevo año: estudiantes 6A (promovidos)' } }),
    operacion('patch', '/modificar-estudiante/:id', { tag: T.estudiantes, resumen: 'Modificar estudiante', rol: 'administrador',
        cuerpo: { propiedades: { nombre: S.nombre, apellido: S.apellido, cedula: S.cedula }, requeridos: ['nombre', 'apellido', 'cedula'] }, exito: 'modificar estudiante' }),
    operacion('delete', '/eliminar-estudiante/:id', { tag: T.estudiantes, resumen: 'Desactivar estudiante', rol: 'administrador', exito: 'eliminar estudiante' }),
    operacion('post', '/asignar-representante', { tag: T.estudiantes, resumen: 'Vincular un estudiante a otro representante', rol: 'administrador',
        cuerpo: { propiedades: { cedulaEstudiante: S.cedula, cedulaRepresentante: S.cedula }, requeridos: ['cedulaEstudiante', 'cedulaRepresentante'] }, exito: 'asignar representante' }),
    operacion('patch', '/reasignar-curso/:idCurso/:idEstudiante', { tag: T.estudiantes, resumen: 'Cambiar de curso a un estudiante', rol: 'administrador', exito: 'reasignar curso' }),

    // ---------- Cursos ----------
    operacion('post', '/registro-curso', { tag: T.cursos, resumen: 'Registrar curso en el año activo', rol: 'administrador',
        cuerpo: { propiedades: { nivel: { type: 'integer', minimum: 1, maximum: 7 }, paralelo: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E'] } }, requeridos: ['nivel', 'paralelo'], ejemplo: { nivel: 5, paralelo: 'A' } },
        exito: 'registrar curso 5A', errores: { 400: 'registrar curso duplicado' } }),
    operacion('get', '/cursos', { tag: T.cursos, resumen: 'Listar cursos del año de la sesión', rol: 'administrador', descripcion: 'Ordenados por nivel y paralelo.', exito: 'listar cursos' }),
    operacion('delete', '/eliminar-curso/:id', { tag: T.cursos, resumen: 'Desactivar curso', rol: 'administrador', descripcion: 'No se permite si tiene estudiantes activos.', exito: { status: 200, ejemplo: { msg: 'Curso eliminado correctamente' } }, errores: { 400: 'eliminar curso con estudiantes' } }),

    // ---------- Materias ----------
    operacion('post', '/registro-materia', { tag: T.materias, resumen: 'Registrar materia en un curso', rol: 'administrador',
        cuerpo: { propiedades: { nombre: { type: 'string', example: 'Matemáticas' }, curso: { ...S.id, description: 'Id del curso' }, cedulaProfesor: S.cedula }, requeridos: ['nombre', 'curso', 'cedulaProfesor'] },
        exito: 'registrar materia' }),
    operacion('get', '/materias/:cursoId', { tag: T.materias, resumen: 'Listar materias de un curso', rol: 'administrador', exito: 'listar materias del curso' }),
    operacion('patch', '/reasignar-materia/:idMateria/:idProfesorNuevo', { tag: T.materias, resumen: 'Renombrar materia o cambiar su profesor', rol: 'administrador',
        cuerpo: { propiedades: { nombre: { type: 'string', example: 'Lengua y Literatura' } }, requeridos: ['nombre'] }, exito: 'reasignar materia a otro profesor y volver' }),
    operacion('delete', '/eliminar-materia/:id', { tag: T.materias, resumen: 'Desactivar materia', rol: 'administrador', exito: 'eliminar materia' }),

    // ---------- Asistencia ----------
    operacion('post', '/registro-asistencia', { tag: T.asistencia, resumen: 'Registrar la asistencia del día de un curso', rol: 'administrador',
        cuerpo: { propiedades: { curso: S.id, asistencias: { type: 'object', description: 'Mapa idEstudiante → presente (true/false)', additionalProperties: { type: 'boolean' } } }, requeridos: ['curso', 'asistencias'],
            ejemplo: { curso: '6740a1b2c3d4e5f6a7b80008', asistencias: { '6740a1b2c3d4e5f6a7b80012': false, '6740a1b2c3d4e5f6a7b80013': true } } },
        exito: 'registrar asistencia', errores: { 400: 'registrar asistencia repetida' } }),
    operacion('patch', '/justificar-inasistencia', { tag: T.asistencia, resumen: 'Justificar una inasistencia', rol: 'administrador',
        cuerpo: { propiedades: { cedula: S.cedula, fecha: { type: 'string', pattern: '^\\d{4}/\\d{1,2}/\\d{1,2}$', example: '2026/11/05', description: 'AAAA/MM/DD (con o sin ceros)' }, justificacion: { type: 'string', minLength: 5, maxLength: 300 } }, requeridos: ['cedula', 'fecha', 'justificacion'] },
        exito: 'justificar inasistencia', errores: { 400: { error: 'La fecha no está registrada' } } }),

    // ---------- Año lectivo ----------
    operacion('post', '/asignar-ponderaciones', { tag: T.anio, resumen: 'Asignar ponderaciones del año activo', rol: 'administrador', descripcion: 'Porcentajes por tipo de evaluación; deben sumar 100.',
        cuerpo: { propiedades: { deberes: { type: 'number' }, talleres: { type: 'number' }, examenes: { type: 'number' }, pruebas: { type: 'number' } }, requeridos: ['deberes', 'talleres', 'examenes', 'pruebas'], ejemplo: { deberes: 20, talleres: 20, examenes: 40, pruebas: 20 } },
        exito: 'asignar ponderaciones', errores: { 400: 'asignar ponderaciones que no suman 100' } }),
    operacion('patch', '/fecha-fin-periodo', { tag: T.anio, resumen: 'Registrar fecha de fin del año activo', rol: 'administrador', descripcion: 'Al llegar esa fecha el año se cierra automáticamente.',
        cuerpo: { propiedades: { fechaFin: { type: 'string', pattern: '^\\d{4}-\\d{1,2}-\\d{1,2}$', example: '2027-07-15' } }, requeridos: ['fechaFin'] }, exito: 'registrar fecha fin' }),
    operacion('patch', '/terminar-periodo', { tag: T.anio, resumen: 'Terminar el año lectivo activo', rol: 'administrador', exito: 'terminar periodo' }),
    operacion('post', '/iniciar-periodo', { tag: T.anio, resumen: 'Iniciar un año lectivo y promover estudiantes', rol: 'administrador',
        descripcion: 'Crea el año nuevo y, si el anterior está cerrado, promueve automáticamente: de 5.º en adelante repite quien tenga alguna materia con promedio menor a 7 (una materia sin notas no hace repetir); 7.º aprobado egresa. Cada curso recibe una copia de las materias del año anterior. Todo en una transacción.',
        exito: 'iniciar periodo (promoción)', errores: { 400: 'iniciar periodo con uno activo' } }),

    // ---------- Profesor ----------
    operacion('get', '/profesor/cursos', { tag: T.profesor, resumen: 'Mis cursos', rol: 'profesor', exito: 'profesor: cursos' }),
    operacion('get', '/profesor/:cursoId/materias', { tag: T.profesor, resumen: 'Mis materias en un curso', rol: 'profesor', exito: 'profesor: materias del curso' }),
    operacion('get', '/estudiantes/:cursoId', { tag: T.profesor, resumen: 'Estudiantes de un curso donde dicto clases', rol: 'profesor', exito: 'profesor: estudiantes del curso' }),
    operacion('post', '/subir-evidencia/:materiaId/:cursoId', { tag: T.profesor, resumen: 'Crear una evaluación con foto de evidencia', rol: 'profesor', multipart: true,
        descripcion: 'Crea la siguiente evaluación del tipo (p. ej. "Deber 3") para todo el curso, con la imagen como evidencia. Imagen JPEG, PNG o GIF de hasta 20 MB.',
        cuerpo: { propiedades: { imagen: { type: 'string', format: 'binary' }, tipo: S.tipoEvaluacion }, requeridos: ['imagen', 'tipo'] },
        exito: 'profesor: subir evidencia' }),
    operacion('post', '/registro-nota/:materiaId', { tag: T.profesor, resumen: 'Registrar notas de la última evaluación', rol: 'profesor',
        cuerpo: { propiedades: { tipo: S.tipoEvaluacion, notas: { type: 'object', description: 'Mapa idEstudiante → nota (0 a 10)', additionalProperties: { type: 'number', minimum: 0, maximum: 10 } } }, requeridos: ['tipo', 'notas'],
            ejemplo: { tipo: 'deberes', notas: { '6740a1b2c3d4e5f6a7b80012': 9, '6740a1b2c3d4e5f6a7b80013': 7.5 } } },
        exito: 'profesor: registrar notas', errores: { 400: 'profesor: nota fuera de rango' } }),
    operacion('patch', '/actualizar-nota/:materiaId', { tag: T.profesor, resumen: 'Corregir notas de una evaluación', rol: 'profesor',
        cuerpo: { propiedades: { tipo: S.tipoEvaluacion, descripcion: { type: 'string', example: 'Deber 1' }, notas: { type: 'object', additionalProperties: { type: 'number', minimum: 0, maximum: 10 } } }, requeridos: ['tipo', 'descripcion', 'notas'] },
        exito: 'profesor: actualizar notas', errores: { 400: 'profesor: materia ajena' } }),
    operacion('get', '/tipos/:materiaId/:tipo', { tag: T.profesor, resumen: 'Evaluaciones de un tipo en una materia', rol: 'profesor', parametros: { tipo: { schema: S.tipoEvaluacion } }, exito: 'profesor: tipos de evaluación' }),
    operacion('post', '/descripcion/:cursoId/:materiaId/:tipo', { tag: T.profesor, resumen: 'Notas del curso en una evaluación', rol: 'profesor', parametros: { tipo: { schema: S.tipoEvaluacion } },
        descripcion: 'Consulta (usa POST por compatibilidad con el frontend).', cuerpo: { propiedades: { descripcion: { type: 'string', example: 'Deber 1' } }, requeridos: ['descripcion'] }, exito: 'profesor: estudiantes por descripción' }),
    operacion('post', '/observacion-estudiante', { tag: T.profesor, resumen: 'Registrar observación de un estudiante', rol: 'profesor',
        cuerpo: { propiedades: { cedula: S.cedula, observacion: { type: 'string', example: 'Participa mucho en clase' } }, requeridos: ['cedula', 'observacion'] }, exito: 'profesor: observación' }),

    // ---------- Representante ----------
    operacion('get', '/estudiantes-registrados', { tag: T.representante, resumen: 'Mis estudiantes', rol: 'representante', exito: 'representante: estudiantes' }),
    operacion('get', '/materias-estudiante/:idEstudiante', { tag: T.representante, resumen: 'Materias de mi estudiante', rol: 'representante', exito: 'representante: materias', errores: { 400: { error: 'El estudiante no existe o no está asociado a usted' } } }),
    operacion('get', '/ver-notas-estudiante/:idEstudiante/:idMateria', { tag: T.representante, resumen: 'Notas de mi estudiante en una materia', rol: 'representante', exito: 'representante: notas', errores: { 400: 'representante ajeno: notas de otro alumno' } }),
    operacion('get', '/ver-observaciones-estudiante/:idEstudiante', { tag: T.representante, resumen: 'Observaciones de mi estudiante', rol: 'representante', exito: 'representante: observaciones' }),
    operacion('get', '/ver-asistencia-estudiante/:idEstudiante', { tag: T.representante, resumen: 'Asistencia de mi estudiante', rol: 'representante', exito: 'representante: asistencia' })
]
