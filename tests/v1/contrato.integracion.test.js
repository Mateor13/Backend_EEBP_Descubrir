// ============================================================================
// PRUEBA DE CONTRATO DE LA API v1 ("golden master").
// Recorre, en el mismo orden que un uso real, todos los endpoints v1 que usa el frontend
// (Mateor13/descubrirFrontend) y los de representante, y compara el código HTTP y el cuerpo de
// cada respuesta con una "foto" guardada en tests/v1/contrato.snapshot.json.
//
// Si un cambio (refactor, actualización de dependencias) altera algo que el frontend recibe,
// esta prueba falla mostrando el paso exacto. Los IDs, fechas y tokens se normalizan porque
// cambian en cada ejecución.
//
//   npm run test:integracion                     comparar contra la foto
//   ACTUALIZAR_CONTRATO=1 npm run test:integracion   regrabar la foto (solo para cambios intencionales,
//                                                    revisando el diff en git)
// ============================================================================
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const URI = process.env.MONGODB_URI_TEST
const omitir = !URI && 'Defina MONGODB_URI_TEST para ejecutar la prueba de integración'
const ARCHIVO_FOTO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'contrato.snapshot.json')
const BD = `descubrir_v1_contrato_${Date.now()}`
const AHORA = new Date()

let mongoose, request, app, modelos

before(async () => {
    if (omitir) return
    const url = new URL(URI)
    url.pathname = `/${BD}`
    Object.assign(process.env, {
        NODE_ENV: 'test', JWT_SECRET: 'secreto-contrato', MONGODB_URI_PRODUCTION: url.toString(),
        MONGODB_DB_V2: `${BD}_v2`, AUTH_LIMITE_INTENTOS: '1000',
        ADMIN_EMAIL: 'admin@escuela.test', ADMIN_PASSWORD: 'AdminClave123', ADMIN_NAME: 'Ana', ADMIN_LASTNAME: 'Admin',
        ADMIN_CEDULA: '1700000001', ADMIN_PHONE: '0990000001', ADMIN_ADDRESS: 'Av. Principal 100'
    })
    mongoose = (await import('mongoose')).default
    request = (await import('supertest')).default
    app = (await import('../../src/server.js')).default
    modelos = {
        Administrador: (await import('../../src/models/administradores.js')).default,
        Profesor: (await import('../../src/models/profesor.js')).default,
        Representante: (await import('../../src/models/representante.js')).default
    }
    await mongoose.connect(process.env.MONGODB_URI_PRODUCTION)
    await modelos.Administrador.inicializarAdmin()
})

after(async () => {
    if (omitir) return
    await mongoose.connection.dropDatabase()
    await mongoose.connection.useDb(`${BD}_v2`).dropDatabase()
    await mongoose.disconnect()
})

// ---------- Normalización: lo que cambia en cada ejecución se reemplaza por marcadores ----------
const ordenarClaves = (v) => Array.isArray(v) ? v.map(ordenarClaves)
    : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, ordenarClaves(v[k])])) : v

const crearNormalizador = () => {
    const ids = new Map()
    const anio = AHORA.getFullYear()
    let registrarIds = true
    const normalizarTexto = (s) => s
        .replace(/[a-f0-9]{24}/g, (id) => {
            if (!ids.has(id)) {
                if (!registrarIds) return '<id-nuevo>' // en pasos sin orden fijo, los IDs nuevos no se numeran
                ids.set(id, `<id${ids.size + 1}>`)
            }
            return ids.get(id)
        })
        .replace(/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/, '<jwt>')
        .replace(/^[a-f0-9]{64}$/, '<token>')
        .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g, '<fecha-iso>')
        .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '<fecha-dma>')
        .replace(/\b\d{4}\/\d{1,2}\/\d{1,2}\b/g, '<fecha-amd>')
        .replace(new RegExp(`\\b${anio}-${anio + 1}\\b`, 'g'), '<periodo-actual>')
        .replace(new RegExp(`\\b${anio + 1}-${anio + 2}\\b`, 'g'), '<periodo-siguiente>')
    const normalizar = (v) => typeof v === 'string' ? normalizarTexto(v)
        : Array.isArray(v) ? v.map(normalizar)
        : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, normalizar(x)])) : v
    return (cuerpo, { sinOrden = false } = {}) => {
        registrarIds = !sinOrden
        const resultado = normalizar(ordenarClaves(cuerpo))
        registrarIds = true
        return sinOrden && Array.isArray(resultado)
            ? resultado.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
            : resultado
    }
}

test('contrato de la API v1 con el frontend', { skip: omitir }, async () => {
    const pasos = []
    const normalizar = crearNormalizador()
    const api = () => request(app)
    // Ejecuta una petición, la registra en la "foto" y devuelve la respuesta original
    // { sinOrden: true } para respuestas cuyo orden no es determinista en la v1 (p. ej. cursos creados con Promise.all)
    const paso = async (nombre, peticion, { sinOrden = false } = {}) => {
        const res = await peticion
        const tipo = res.headers['content-type'] ?? ''
        const cuerpo = normalizar(tipo.includes('json') ? res.body : res.text.slice(0, 80), { sinOrden })
        pasos.push({ paso: nombre, status: res.status, cuerpo })
        return res
    }
    const con = (token) => ({
        get: (u) => api().get(`/api${u}`).set('Authorization', `Bearer ${token}`),
        post: (u) => api().post(`/api${u}`).set('Authorization', `Bearer ${token}`),
        patch: (u) => api().patch(`/api${u}`).set('Authorization', `Bearer ${token}`),
        delete: (u) => api().delete(`/api${u}`).set('Authorization', `Bearer ${token}`)
    })
    const usuario = (n, extra = {}) => ({ nombre: 'Nombre', apellido: 'Apellido', email: `u${n}@escuela.test`, telefono: `09900000${String(n).padStart(2, '0')}`, cedula: `17000000${String(n).padStart(2, '0')}`, direccion: 'Calle Falsa 123', ...extra })
    const activar = async (Modelo, email, password) => {
        const { token } = await Modelo.findOne({ email })
        await paso(`confirmar cuenta ${email}`, api().get(`/api/confirmar-cuenta/${token}`))
        await paso(`crear contraseña ${email}`, api().patch(`/api/nuevo-password/${token}`).send({ password, confirmPassword: password }))
    }

    // ---------- Público y login ----------
    const anios = await paso('listar años', api().get('/api/listar-anios'))
    const anioId = anios.body[0]._id
    await paso('login credenciales incorrectas', api().post('/api/login').send({ email: 'admin@escuela.test', password: 'mala', anioLectivo: anioId }))
    await paso('login sin año lectivo', api().post('/api/login').send({ email: 'admin@escuela.test', password: 'AdminClave123' }))
    const loginAdmin = await paso('login admin', api().post('/api/login').send({ email: 'admin@escuela.test', password: 'AdminClave123', anioLectivo: anioId }))
    const admin = con(loginAdmin.body.token)
    await paso('perfil admin', admin.get('/perfil'))
    await paso('perfil sin token', api().get('/api/perfil'))
    await paso('perfil token inválido', api().get('/api/perfil').set('Authorization', 'Bearer basura'))
    await paso('ruta inexistente', api().get('/api/no-existe'))
    await paso('página de inicio', api().get('/'))

    // ---------- Administradores, profesores, representantes ----------
    await paso('registrar admin', admin.post('/registro').send(usuario(2)))
    await paso('registrar admin duplicado', admin.post('/registro').send(usuario(2)))
    await paso('registrar admin inválido', admin.post('/registro').send({ ...usuario(3), email: 'no-es-email' }))
    const admins = await paso('listar administradores', admin.get('/administradores'))
    const admin2 = admins.body.find(a => a.email === 'u2@escuela.test')
    await paso('modificar administrador', admin.patch(`/modificar-administrador/${admin2._id}`).send(usuario(2, { nombre: 'Beatriz' })))
    await paso('registrar profesor 1', admin.post('/registro-profesor').send(usuario(4, { nombre: 'Carla', email: 'carla@escuela.test' })))
    await paso('registrar profesor 2', admin.post('/registro-profesor').send(usuario(5, { nombre: 'Diego', email: 'diego@escuela.test' })))
    const profesores = await paso('listar profesores', admin.get('/profesores'))
    const [carla, diego] = ['carla@escuela.test', 'diego@escuela.test'].map(e => profesores.body.find(p => p.email === e))
    await paso('modificar profesor', admin.patch(`/modificar-profesor/${diego._id}`).send(usuario(5, { nombre: 'Diego', apellido: 'Ruiz', email: 'diego@escuela.test' })))
    await paso('registrar representante 1', admin.post('/registro-representante').send(usuario(6, { nombre: 'Elena', email: 'elena@correo.test' })))
    await paso('registrar representante 2', admin.post('/registro-representante').send(usuario(7, { nombre: 'Fabio', email: 'fabio@correo.test' })))
    const representantes = await modelos.Representante.find().sort({ cedula: 1 }).lean()
    await paso('modificar representante', admin.patch(`/modificar-representante/${representantes[1]._id}`).send(usuario(7, { nombre: 'Fabio', apellido: 'Vera', email: 'fabio@correo.test' })))
    await paso('modificar representante con email inválido', admin.patch(`/modificar-representante/${representantes[1]._id}`).send(usuario(7, { email: 'malo' })))

    // ---------- Cursos, materias, ponderaciones ----------
    await paso('registrar curso 5A', admin.post('/registro-curso').send({ nivel: 5, paralelo: 'A' }))
    await paso('registrar curso 6A', admin.post('/registro-curso').send({ nivel: 6, paralelo: 'A' }))
    await paso('registrar curso duplicado', admin.post('/registro-curso').send({ nivel: 5, paralelo: 'A' }))
    const cursos = await paso('listar cursos', admin.get('/cursos'))
    const [quintoA, sextoA] = [5, 6].map(n => cursos.body.find(c => c.nivel === n))
    await paso('registrar materia', admin.post('/registro-materia').send({ nombre: 'Matemáticas', curso: quintoA._id, cedulaProfesor: '1700000004' }))
    await paso('registrar materia 2', admin.post('/registro-materia').send({ nombre: 'Lengua', curso: quintoA._id, cedulaProfesor: '1700000004' }))
    const materias = await paso('listar materias del curso', admin.get(`/materias/${quintoA._id}`))
    const [mate, lengua] = ['Matemáticas', 'Lengua'].map(n => materias.body.find(m => m.nombre === n))
    await paso('asignar ponderaciones que no suman 100', admin.post('/asignar-ponderaciones').send({ deberes: 50, talleres: 50, examenes: 50, pruebas: 0 }))
    await paso('asignar ponderaciones', admin.post('/asignar-ponderaciones').send({ deberes: 20, talleres: 20, examenes: 40, pruebas: 20 }))

    // ---------- Estudiantes ----------
    await paso('registrar estudiante 1', admin.post('/registro-estudiante').send({ nombre: 'Pedro', apellido: 'Paz', cedula: '1750000001', curso: quintoA._id, cedulaRepresentante: '1700000006' }))
    await paso('registrar estudiante 2', admin.post('/registro-estudiante').send({ nombre: 'Juan', apellido: 'Luna', cedula: '1750000002', curso: quintoA._id, cedulaRepresentante: '1700000007' }))
    await paso('registrar estudiante sin curso válido', admin.post('/registro-estudiante').send({ nombre: 'X', apellido: 'Y', cedula: '1750000009', curso: 'abc', cedulaRepresentante: '1700000007' }))
    const estudiantes = await paso('listar estudiantes del curso', admin.get(`/cursos/${quintoA._id}/estudiantes`))
    const [pedro, juan] = ['1750000001', '1750000002'].map(c => estudiantes.body.find(e => e.cedula === c))
    await paso('listar representantes del curso', admin.get(`/representantes/${quintoA._id}`))
    await paso('asignar representante', admin.post('/asignar-representante').send({ cedulaEstudiante: '1750000002', cedulaRepresentante: '1700000006' }))
    await paso('modificar estudiante', admin.patch(`/modificar-estudiante/${juan._id}`).send({ nombre: 'Juan', apellido: 'Luna Sol', cedula: '1750000002' }))
    await paso('reasignar materia a otro profesor y volver', admin.patch(`/reasignar-materia/${lengua._id}/${diego._id}`).send({ nombre: 'Lengua y Literatura', idProfesorNuevo: diego._id }))

    // ---------- Profesor ----------
    await activar(modelos.Profesor, 'carla@escuela.test', 'CarlaClave1')
    const loginCarla = await paso('login profesor', api().post('/api/login').send({ email: 'carla@escuela.test', password: 'CarlaClave1', anioLectivo: anioId }))
    const profe = con(loginCarla.body.token)
    await paso('profesor: perfil', profe.get('/perfil'))
    await paso('profesor: rol sin permiso', profe.get('/profesores'))
    await paso('profesor: cursos', profe.get('/profesor/cursos'))
    await paso('profesor: materias del curso', profe.get(`/profesor/${quintoA._id}/materias`))
    await paso('profesor: estudiantes del curso', profe.get(`/estudiantes/${quintoA._id}`))
    await paso('profesor: subir evidencia', profe.post(`/subir-evidencia/${mate._id}/${quintoA._id}`).field('tipo', 'deberes')
        .attach('imagen', Buffer.from('imagen'), { filename: 'foto.png', contentType: 'image/png' }))
    await paso('profesor: registrar notas', profe.post(`/registro-nota/${mate._id}`).send({ tipo: 'deberes', notas: { [pedro._id]: 9, [juan._id]: 4 } }))
    await paso('profesor: registrar notas de examen', profe.post(`/registro-nota/${mate._id}`).send({ tipo: 'examenes', notas: { [pedro._id]: 8, [juan._id]: 5 } }))
    await paso('profesor: nota fuera de rango', profe.post(`/registro-nota/${mate._id}`).send({ tipo: 'deberes', notas: { [pedro._id]: 11 } }))
    await paso('profesor: materia ajena', profe.post(`/registro-nota/${lengua._id}`).send({ tipo: 'deberes', notas: { [pedro._id]: 7 } }))
    await paso('profesor: tipos de evaluación', profe.get(`/tipos/${mate._id}/deberes`))
    await paso('profesor: estudiantes por descripción', profe.post(`/descripcion/${quintoA._id}/${mate._id}/deberes`).send({ descripcion: 'Deber 1' }))
    await paso('profesor: actualizar notas', profe.patch(`/actualizar-nota/${mate._id}`).send({ tipo: 'deberes', descripcion: 'Deber 1', notas: { [pedro._id]: 10, [juan._id]: 4 } }))
    await paso('profesor: observación', profe.post('/observacion-estudiante').send({ cedula: '1750000001', observacion: 'Participa mucho en clase' }))
    await paso('profesor: cambiar datos', profe.patch('/cambiar-datos').send({ nombre: 'Carla', apellido: 'Mora', email: 'carla@escuela.test', telefono: '0990000004', direccion: 'Calle Nueva 456' }))
    await paso('profesor: cambiar contraseña incorrecta', profe.patch('/cambiar-password').send({ password: 'mala123', newPassword: 'Nueva1234', confirmPassword: 'Nueva1234' }))
    await paso('profesor: cambiar contraseña', profe.patch('/cambiar-password').send({ password: 'CarlaClave1', newPassword: 'Nueva1234', confirmPassword: 'Nueva1234' }))

    // ---------- Asistencia (admin) ----------
    await paso('registrar asistencia', admin.post('/registro-asistencia').send({ curso: quintoA._id, asistencias: { [pedro._id]: false, [juan._id]: true } }))
    await paso('registrar asistencia repetida', admin.post('/registro-asistencia').send({ curso: quintoA._id, asistencias: { [pedro._id]: false, [juan._id]: true } }))
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date()).replaceAll('-', '/') // formato del frontend: AAAA/MM/DD
    await paso('justificar inasistencia', admin.patch('/justificar-inasistencia').send({ cedula: '1750000001', justificacion: 'Cita médica', fecha: hoy }))

    // ---------- Representante ----------
    await activar(modelos.Representante, 'elena@correo.test', 'ElenaClave1')
    const loginElena = await paso('login representante', api().post('/api/login').send({ email: 'elena@correo.test', password: 'ElenaClave1', anioLectivo: anioId }))
    const rep = con(loginElena.body.token)
    await paso('representante: estudiantes', rep.get('/estudiantes-registrados'))
    await paso('representante: materias', rep.get(`/materias-estudiante/${pedro._id}`))
    await paso('representante: notas', rep.get(`/ver-notas-estudiante/${pedro._id}/${mate._id}`))
    await paso('representante: observaciones', rep.get(`/ver-observaciones-estudiante/${pedro._id}`))
    await paso('representante: asistencia', rep.get(`/ver-asistencia-estudiante/${pedro._id}`))
    await activar(modelos.Representante, 'fabio@correo.test', 'FabioClave1')
    const fabio = con((await api().post('/api/login').send({ email: 'fabio@correo.test', password: 'FabioClave1', anioLectivo: anioId })).body.token)
    await paso('representante ajeno: notas de otro alumno', fabio.get(`/ver-notas-estudiante/${pedro._id}/${mate._id}`))
    await paso('recuperar contraseña', api().post('/api/recuperar-password').send({ email: 'elena@correo.test' }))
    await paso('recuperar contraseña email inexistente', api().post('/api/recuperar-password').send({ email: 'nadie@correo.test' }))

    // ---------- Reasignación y cierre de año ----------
    await paso('reasignar curso', admin.patch(`/reasignar-curso/${sextoA._id}/${juan._id}`).send({ idCurso: sextoA._id, idEstudiante: juan._id }))
    await paso('reasignar curso de vuelta', admin.patch(`/reasignar-curso/${quintoA._id}/${juan._id}`).send({ idCurso: quintoA._id, idEstudiante: juan._id }))
    const fin = new Date(AHORA.getTime() + 200 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    await paso('registrar fecha fin', admin.patch('/fecha-fin-periodo').send({ fechaFin: fin }))
    await paso('iniciar periodo con uno activo', admin.post('/iniciar-periodo').send({}))
    await paso('terminar periodo', admin.patch('/terminar-periodo').send({}))
    await paso('iniciar periodo (promoción)', admin.post('/iniciar-periodo').send({}))
    const anios2 = await paso('listar años tras promoción', api().get('/api/listar-anios'))
    const nuevoAnio = anios2.body.find(a => a.estado)._id
    const admin2Login = await api().post('/api/login').send({ email: 'admin@escuela.test', password: 'AdminClave123', anioLectivo: nuevoAnio })
    const adminNuevo = con(admin2Login.body.token)
    await paso('nuevo año: cursos', adminNuevo.get('/cursos'), { sinOrden: true })
    await paso('nuevo año: estudiantes 5A (repiten)', adminNuevo.get(`/cursos/${quintoA._id}/estudiantes`))
    await paso('nuevo año: estudiantes 6A (promovidos)', adminNuevo.get(`/cursos/${sextoA._id}/estudiantes`))
    await paso('nuevo año: materias 5A copiadas', adminNuevo.get(`/materias/${quintoA._id}`))

    // ---------- Eliminaciones ----------
    const materiasNuevas = (await adminNuevo.get(`/materias/${quintoA._id}`)).body
    await paso('eliminar materia', adminNuevo.delete(`/eliminar-materia/${materiasNuevas[0]._id}`))
    await paso('eliminar estudiante', adminNuevo.delete(`/eliminar-estudiante/${juan._id}`))
    await paso('eliminar representante', adminNuevo.delete(`/eliminar-representante/${(await modelos.Representante.findOne({ email: 'fabio@correo.test' }))._id}`))
    await paso('eliminar profesor', adminNuevo.delete(`/eliminar-profesor/${diego._id}`))
    await paso('eliminar curso con estudiantes', adminNuevo.delete(`/eliminar-curso/${sextoA._id}`))
    await paso('eliminar administrador', adminNuevo.delete(`/eliminar-administrador/${admin2._id}`))
    await paso('eliminar id inválido', adminNuevo.delete('/eliminar-profesor/123'))
    void carla

    // ---------- Comparación con la foto ----------
    if (process.env.ACTUALIZAR_CONTRATO === '1' || !fs.existsSync(ARCHIVO_FOTO)) {
        fs.writeFileSync(ARCHIVO_FOTO, JSON.stringify(pasos, null, 2) + '\n')
        return
    }
    const foto = JSON.parse(fs.readFileSync(ARCHIVO_FOTO, 'utf8'))
    for (let i = 0; i < Math.max(foto.length, pasos.length); i++) {
        assert.deepEqual(pasos[i], foto[i], `El contrato cambió en el paso ${i + 1}: "${foto[i]?.paso ?? pasos[i]?.paso}"`)
    }
})
