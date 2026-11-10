// Prueba de integración de la API v2 contra un MongoDB real (replica set, por las transacciones).
// Recorre un año escolar completo y verifica los permisos. Se omite si no hay MONGODB_URI_TEST.
//   npm run test:integracion   (usa mongodb://127.0.0.1:27017/?replicaSet=rs0 por defecto)
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

const URI = process.env.MONGODB_URI_TEST
const omitir = !URI && 'Defina MONGODB_URI_TEST para ejecutar la prueba de integración'

let mongoose, request, app, mailer, conexionV2
const tokenDeCorreo = (para) => {
    const correo = [...mailer.enviados].reverse().find(m => m.para === para)
    return correo?.html.match(/(?:activar|restablecer)\/([a-f0-9]{64})/)?.[1]
}

before(async () => {
    if (omitir) return
    Object.assign(process.env, {
        NODE_ENV: 'test', AUTH_LIMITE_INTENTOS: '1000', JWT_SECRET: 'secreto-de-prueba', MONGODB_DB_V2: `descubrir_v2_test_${Date.now()}`,
        ADMIN_EMAIL: 'admin@escuela.test', ADMIN_PASSWORD: 'AdminSegura123', ADMIN_CEDULA: '1700000001'
    })
    mongoose = (await import('mongoose')).default
    request = (await import('supertest')).default
    const express = (await import('express')).default
    const { crearApiV2 } = await import('../../src/v2/app.js')
    const { crearContenedor } = await import('../../src/v2/contenedor.js')
    const { crearMailerConsola } = await import('../../src/v2/infra/mail/mailer.js')
    const { inicializarV2 } = await import('../../src/v2/inicializar.js');
    ({ conexionV2 } = await import('../../src/v2/infra/db/conexion.js'))
    await mongoose.connect(URI)
    await inicializarV2()
    mailer = crearMailerConsola()
    app = express().use('/api/v2', crearApiV2(crearContenedor({ mailer })))
})

after(async () => {
    if (omitir) return
    await conexionV2.dropDatabase()
    await mongoose.disconnect()
})

test('año escolar completo con permisos', { skip: omitir }, async (t) => {
    const api = () => request(app)
    const como = (token) => ({
        get: (url) => api().get(url).set('Authorization', `Bearer ${token}`),
        post: (url) => api().post(url).set('Authorization', `Bearer ${token}`),
        put: (url) => api().put(url).set('Authorization', `Bearer ${token}`),
        patch: (url) => api().patch(url).set('Authorization', `Bearer ${token}`),
        delete: (url) => api().delete(url).set('Authorization', `Bearer ${token}`)
    })
    const login = async (email, password) => {
        const res = await api().post('/api/v2/auth/login').send({ email, password })
        assert.equal(res.status, 200, JSON.stringify(res.body))
        return res.body.token
    }
    const admin = como(await login('admin@escuela.test', 'AdminSegura123'))

    // ---------- Cuentas: se crean sin contraseña y se activan por correo ----------
    const crearYActivar = async (datos) => {
        const res = await admin.post('/api/v2/usuarios').send({ direccion: 'Av. Siempre Viva 123', telefono: '0999999999', ...datos })
        assert.equal(res.status, 201, JSON.stringify(res.body))
        assert.equal(JSON.stringify(res.body).includes('passwordHash'), false, 'nunca se expone el hash')
        const sinActivar = await api().post('/api/v2/auth/login').send({ email: datos.email, password: 'cualquiera1' })
        assert.equal(sinActivar.status, 401)
        const activar = await api().post('/api/v2/auth/activar').send({ token: tokenDeCorreo(datos.email), password: 'ClaveSegura1' })
        assert.equal(activar.status, 200, JSON.stringify(activar.body))
        return { id: res.body.id, http: como(await login(datos.email, 'ClaveSegura1')) }
    }
    const profe = await crearYActivar({ nombre: 'Ana', apellido: 'Profe', cedula: '1700000002', email: 'ana@escuela.test', roles: ['profesor'] })
    const otroProfe = await crearYActivar({ nombre: 'Luis', apellido: 'Otro', cedula: '1700000003', email: 'luis@escuela.test', roles: ['profesor'] })
    const mama = await crearYActivar({ nombre: 'Rosa', apellido: 'Madre', cedula: '1700000004', email: 'rosa@correo.test', roles: ['representante'] })
    const otraMama = await crearYActivar({ nombre: 'Elena', apellido: 'Ajena', cedula: '1700000005', email: 'elena@correo.test', roles: ['representante'] })

    await t.test('el token de activación es de un solo uso', async () => {
        const res = await api().post('/api/v2/auth/activar').send({ token: tokenDeCorreo('ana@escuela.test'), password: 'OtraClave123' })
        assert.equal(res.status, 400)
    })
    await t.test('un profesor no puede gestionar usuarios (403) y sin token es 401', async () => {
        assert.equal((await profe.http.get('/api/v2/usuarios')).status, 403)
        assert.equal((await api().get('/api/v2/usuarios')).status, 401)
    })

    // ---------- Periodo, cursos, asignatura y clases ----------
    const periodo = (await admin.post('/api/v2/periodos').send({
        nombre: '2024-2025', inicio: '2024-09-01', ponderaciones: { deber: 20, taller: 20, prueba: 20, examen: 40 }
    })).body
    assert.equal((await admin.post(`/api/v2/periodos/${periodo.id}/activar`)).status, 200)
    await t.test('las ponderaciones deben sumar 100', async () => {
        const res = await admin.patch(`/api/v2/periodos/${periodo.id}`).send({ ponderaciones: { deber: 50, taller: 50, prueba: 50, examen: 0 } })
        assert.equal(res.status, 400)
    })
    const quintoA = (await admin.post('/api/v2/cursos').send({ nivel: 5, paralelo: 'A' })).body
    const quintoB = (await admin.post('/api/v2/cursos').send({ nivel: 5, paralelo: 'B' })).body
    assert.equal(quintoA.nombre, 'Quinto A')
    const mate = (await admin.post('/api/v2/asignaturas').send({ nombre: 'Matemáticas' })).body
    const lengua = (await admin.post('/api/v2/asignaturas').send({ nombre: 'Lengua' })).body
    const claseMate = (await admin.post('/api/v2/clases').send({ curso: quintoA.id, asignatura: mate._id, profesor: profe.id })).body
    const claseLengua = (await admin.post('/api/v2/clases').send({ curso: quintoA.id, asignatura: lengua._id, profesor: profe.id })).body
    await admin.post('/api/v2/clases').send({ curso: quintoB.id, asignatura: mate._id, profesor: otroProfe.id })
    await t.test('no se puede duplicar una clase (índice único → 409)', async () => {
        const res = await admin.post('/api/v2/clases').send({ curso: quintoA.id, asignatura: mate._id, profesor: otroProfe.id })
        assert.equal(res.status, 409)
    })

    // ---------- Estudiantes: creación + matrícula en una transacción ----------
    const pedro = (await admin.post('/api/v2/estudiantes').send({ nombre: 'Pedro', apellido: 'Alumno', cedula: '1750000001', representantes: [mama.id], curso: quintoA.id })).body
    const juan = (await admin.post('/api/v2/estudiantes').send({ nombre: 'Juan', apellido: 'Alumno', cedula: '1750000002', representantes: [otraMama.id], curso: quintoA.id })).body
    const ajeno = (await admin.post('/api/v2/estudiantes').send({ nombre: 'Mario', apellido: 'OtroCurso', cedula: '1750000003', curso: quintoB.id })).body
    assert.ok(pedro.id && juan.id && ajeno.id)
    assert.ok(mailer.enviados.some(m => m.para === 'rosa@correo.test' && m.asunto.includes('Estudiante vinculado')))

    // ---------- Evaluaciones y calificaciones ----------
    const nuevaEval = async (clase, tipo, titulo) => {
        const res = await profe.http.post(`/api/v2/clases/${clase.id}/evaluaciones`).field('tipo', tipo).field('titulo', titulo)
            .attach('evidencia', Buffer.from('imagen'), { filename: 'foto.png', contentType: 'image/png' })
        assert.equal(res.status, 201, JSON.stringify(res.body))
        return res.body
    }
    const deber = await nuevaEval(claseMate, 'deber', 'Deber 1')
    const examen = await nuevaEval(claseMate, 'examen', 'Examen final')
    const examenLengua = await nuevaEval(claseLengua, 'examen', 'Examen final')
    assert.match(deber.evidenciaUrl, /^https:\/\//)
    const calificar = (http, evaluacion, lista) => http.put(`/api/v2/evaluaciones/${evaluacion.id}/calificaciones`).send({ calificaciones: lista })

    assert.equal((await calificar(profe.http, deber, [{ estudiante: pedro.id, nota: 9 }, { estudiante: juan.id, nota: 4 }])).status, 200)
    assert.equal((await calificar(profe.http, examen, [{ estudiante: pedro.id, nota: 8 }, { estudiante: juan.id, nota: 5 }])).status, 200)
    assert.equal((await calificar(profe.http, examenLengua, [{ estudiante: pedro.id, nota: 10 }, { estudiante: juan.id, nota: 9 }])).status, 200)

    await t.test('IDOR: otro profesor no puede calificar ni ver la clase ajena', async () => {
        assert.equal((await calificar(otroProfe.http, deber, [{ estudiante: pedro.id, nota: 1 }])).status, 403)
        assert.equal((await otroProfe.http.get(`/api/v2/evaluaciones/${deber.id}/calificaciones`)).status, 403)
        assert.equal((await otroProfe.http.get(`/api/v2/estudiantes/${pedro.id}/boletin`)).status, 403)
    })
    await t.test('no se puede calificar a un estudiante de otro curso', async () => {
        const res = await calificar(profe.http, deber, [{ estudiante: ajeno.id, nota: 10 }])
        assert.equal(res.status, 400)
    })
    await t.test('corregir una nota no la duplica (upsert)', async () => {
        await calificar(profe.http, deber, [{ estudiante: pedro.id, nota: 10 }])
        const planilla = (await profe.http.get(`/api/v2/evaluaciones/${deber.id}/calificaciones`)).body
        assert.equal(planilla.estudiantes.find(e => e.id === pedro.id).nota, 10)
        assert.equal(planilla.estudiantes.length, 2)
    })

    await t.test('boletín: el representante ve a su hijo, no a uno ajeno (IDOR de la v1)', async () => {
        const boletin = await mama.http.get(`/api/v2/estudiantes/${pedro.id}/boletin`)
        assert.equal(boletin.status, 200)
        const notasMate = boletin.body.materias.find(m => m.clase.asignatura.nombre === 'Matemáticas')
        // deber 10 (peso 20) y examen 8 (peso 40) → (10*20 + 8*40) / 60 = 8.67
        assert.equal(notasMate.promedio.final, 8.67)
        assert.equal(boletin.body.resultado.aprueba, true)
        assert.equal((await mama.http.get(`/api/v2/estudiantes/${juan.id}/boletin`)).status, 403)
        assert.equal((await mama.http.get(`/api/v2/estudiantes/${juan.id}/asistencias`)).status, 403)
        const mios = (await mama.http.get('/api/v2/estudiantes/mios')).body
        assert.deepEqual(mios.map(e => e.id), [pedro.id])
        assert.equal(mios[0].curso.nombre, 'Quinto A')
    })

    // ---------- Asistencia ----------
    await t.test('asistencia del día, idempotente, con justificación y faltas calculadas', async () => {
        const lista = { fecha: '2024-10-01', registros: [{ estudiante: pedro.id, estado: 'ausente' }, { estudiante: juan.id, estado: 'presente' }] }
        assert.equal((await profe.http.put(`/api/v2/cursos/${quintoA.id}/asistencias`).send(lista)).status, 200)
        assert.equal((await profe.http.put(`/api/v2/cursos/${quintoA.id}/asistencias`).send(lista)).status, 200)
        assert.equal((await otroProfe.http.put(`/api/v2/cursos/${quintoA.id}/asistencias`).send(lista)).status, 403)
        const delDia = (await profe.http.get(`/api/v2/cursos/${quintoA.id}/asistencias?fecha=2024-10-01`)).body
        const ausencia = delDia.estudiantes.find(e => e.id === pedro.id)
        assert.equal(ausencia.estado, 'ausente')
        assert.equal((await admin.patch(`/api/v2/asistencias/${ausencia.asistenciaId}/justificacion`).send({ justificacion: 'Cita médica' })).status, 200)
        const historial = (await mama.http.get(`/api/v2/estudiantes/${pedro.id}/asistencias`)).body
        assert.equal(historial.registros.length, 1, 'enviar la lista dos veces no duplica registros')
        assert.equal(historial.resumen.justificado, 1)
        assert.equal(historial.resumen.ausente, 0)
    })

    await t.test('observaciones: solo profesores del estudiante', async () => {
        assert.equal((await profe.http.post(`/api/v2/estudiantes/${pedro.id}/observaciones`).send({ texto: 'Excelente participación' })).status, 201)
        assert.equal((await otroProfe.http.post(`/api/v2/estudiantes/${pedro.id}/observaciones`).send({ texto: 'No es mi alumno' })).status, 403)
        const obs = (await mama.http.get(`/api/v2/estudiantes/${pedro.id}/observaciones`)).body
        assert.equal(obs.length, 1)
        assert.equal(obs[0].autor.nombre, 'Ana')
    })

    // ---------- Cierre y promoción ----------
    await t.test('promoción: aprueba quien tiene ≥ 7 en todo, repite quien no (bug de la v1)', async () => {
        assert.equal((await admin.post(`/api/v2/periodos/${periodo.id}/cerrar`)).status, 200)
        assert.equal((await calificar(profe.http, deber, [{ estudiante: pedro.id, nota: 1 }])).status, 409, 'periodo cerrado no admite cambios')
        const siguiente = (await admin.post('/api/v2/periodos').send({ nombre: '2025-2026', inicio: '2025-09-01' })).body
        const previa = (await admin.get(`/api/v2/periodos/${periodo.id}/promocion`)).body
        assert.equal(previa.find(r => r.estudiante === pedro.id).aprueba, true)
        assert.equal(previa.find(r => r.estudiante === juan.id).aprueba, false) // Matemáticas: (4*20+5*40)/60 = 4.67

        const res = await admin.post(`/api/v2/periodos/${periodo.id}/promocion`).send({ destino: siguiente.id })
        assert.equal(res.status, 200, JSON.stringify(res.body))
        assert.deepEqual(res.body, { promovidos: 2, repiten: 1, egresados: 0, yaMatriculados: 0, clasesCopiadas: 3 })

        const detalle = async (id) => (await admin.get(`/api/v2/estudiantes/${id}?periodo=${siguiente.id}`)).body.matricula.curso.nombre
        assert.equal(await detalle(pedro.id), 'Sexto A')
        assert.equal(await detalle(juan.id), 'Quinto A')
        assert.equal(await detalle(ajeno.id), 'Sexto B', 'sin notas no hay evidencia para reprobar')

        const repetida = await admin.post(`/api/v2/periodos/${periodo.id}/promocion`).send({ destino: siguiente.id })
        assert.equal(repetida.body.yaMatriculados, 3, 'ejecutar la promoción dos veces no duplica matrículas')
    })

    await t.test('el boletín del periodo anterior sigue disponible', async () => {
        const res = await mama.http.get(`/api/v2/estudiantes/${pedro.id}/boletin?periodo=${periodo.id}`)
        assert.equal(res.status, 200)
        assert.equal(res.body.resultado.provisional, false)
    })

    await t.test('recuperación de contraseña: no revela si el email existe y el enlace caduca tras usarse', async () => {
        const inexistente = await api().post('/api/v2/auth/recuperar').send({ email: 'nadie@x.test' })
        const existente = await api().post('/api/v2/auth/recuperar').send({ email: 'rosa@correo.test' })
        assert.equal(inexistente.status, 200)
        assert.deepEqual(inexistente.body, existente.body)
        const token = tokenDeCorreo('rosa@correo.test')
        assert.equal((await api().post('/api/v2/auth/restablecer').send({ token, password: 'NuevaClave99' })).status, 200)
        assert.equal((await api().post('/api/v2/auth/restablecer').send({ token, password: 'OtraVez1234' })).status, 400)
        await login('rosa@correo.test', 'NuevaClave99')
    })

    await t.test('una cuenta desactivada pierde el acceso aunque su token siga vigente', async () => {
        assert.equal((await otraMama.http.get('/api/v2/auth/perfil')).status, 200)
        assert.equal((await admin.delete(`/api/v2/usuarios/${otraMama.id}`)).status, 204)
        assert.equal((await otraMama.http.get('/api/v2/auth/perfil')).status, 401)
    })
})
