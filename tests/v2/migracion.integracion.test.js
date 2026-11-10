// Prueba de la migración v1 -> v2 con datos con la forma exacta de la v1 (fechas como texto,
// ponderaciones como array, usuarios en 3 colecciones). Se omite si no hay MONGODB_URI_TEST.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'

const URI = process.env.MONGODB_URI_TEST
const omitir = !URI && 'Defina MONGODB_URI_TEST para ejecutar la prueba de integración'
const sufijo = Date.now()
let mongoose, client, origen, destino

before(async () => {
    if (omitir) return
    process.env.MONGODB_DB_V2 = `descubrir_v2_mig_${sufijo}`
    Object.assign(process.env, { NODE_ENV: 'test', JWT_SECRET: 'secreto', AUTH_LIMITE_INTENTOS: '1000' })
    mongoose = (await import('mongoose')).default
    await mongoose.connect(URI)
    client = mongoose.connection.getClient()
    origen = client.db(`descubrir_v1_mig_${sufijo}`)
    destino = client.db(process.env.MONGODB_DB_V2)
})

after(async () => {
    if (omitir) return
    await origen.dropDatabase()
    await destino.dropDatabase()
    await mongoose.disconnect()
})

test('migra los datos de la v1 al modelo v2 y la v2 puede usarlos', { skip: omitir }, async () => {
    const { ObjectId } = mongoose.Types
    const id = () => new ObjectId()
    const [admin, profe, mama, anio, quintoA, mate, pedro] = Array.from({ length: 7 }, id)
    const hash = await bcrypt.hash('ClaveDeSiempre1', 10)
    const usuario = (extra) => ({ apellido: 'X', telefono: '0999999999', direccion: 'Calle 123', password: hash, confirmEmail: true, estado: true, ...extra })

    await origen.collection('administradores').insertOne(usuario({ _id: admin, nombre: 'Admin', email: 'admin@v1.test', cedula: '1700000001' }))
    await origen.collection('profesores').insertOne(usuario({ _id: profe, nombre: 'Ana', email: 'ana@v1.test', cedula: '1700000002' }))
    await origen.collection('representantes').insertOne(usuario({ _id: mama, nombre: 'Rosa', email: 'Rosa@V1.test', cedula: '1700000003', estudiantes: [pedro] }))
    await origen.collection('anioLectivo').insertOne({ _id: anio, periodo: '2024-2025', fechaInicio: new Date('2024-09-01'), estado: true,
        ponderaciones: [{ deberes: 20, talleres: 20, examenes: 40, pruebas: 20 }] })
    await origen.collection('cursos').insertOne({ _id: quintoA, nombre: 'Quinto A', nivel: 5, paralelo: 'A' })
    await origen.collection('estudiantes').insertOne({ _id: pedro, nombre: 'Pedro', apellido: 'Alumno', cedula: '1750000001', estado: true })
    await origen.collection('materias').insertOne({ _id: mate, nombre: 'Matemáticas ', profesor: profe, anioLectivo: anio, estado: true })
    await origen.collection('cursosAsignados').insertOne({ curso: quintoA, anioLectivo: anio, estudiantes: [pedro], materias: [mate] })
    await origen.collection('notas').insertOne({ estudiante: pedro, materia: mate, anioLectivo: anio, evaluaciones: {
        deberes: [{ descripcion: 'Deber 1', nota: 10, fecha: '5/10/2024', evidenciaUrl: 'https://i.imgur.com/a.png' }, { descripcion: 'Deber 2', fecha: '6/10/2024' }],
        talleres: [], pruebas: [], examenes: [{ descripcion: 'Examen 1', nota: 8, fecha: '20/12/2024' }]
    } })
    await origen.collection('asistencias').insertOne({ estudiante: pedro, anioLectivo: anio, faltas: 1, asistencia: [
        { fecha: '2024/10/1', presente: false, justificacion: '' },
        { fecha: '2024/10/2', presente: true, justificacion: 'Cita médica' },
        { fecha: '2024/10/3', presente: true, justificacion: '' }
    ] })
    await origen.collection('observaciones').insertOne({ estudiante: pedro, anioLectivo: anio, numeroObservaciones: 1,
        observaciones: [{ fecha: '7/10/2024', observacion: 'Muy participativo', profesor: profe }] })

    const { inicializarV2 } = await import('../../src/v2/inicializar.js')
    const { migrarV1aV2 } = await import('../../scripts/migrar-v1-a-v2.js')
    await inicializarV2()
    const reporte = await migrarV1aV2({ origen, destino, log: () => {} })
    assert.equal(reporte.usuarios, 3)
    assert.equal(reporte.evaluaciones, 3)
    assert.equal(reporte.calificaciones, 2)
    assert.equal(reporte.asistencias, 3)

    // Idempotente: una segunda ejecución no duplica nada
    await migrarV1aV2({ origen, destino, log: () => {} })
    assert.equal(await destino.collection('usuarios').countDocuments(), 3)
    assert.equal(await destino.collection('evaluaciones').countDocuments(), 3)
    assert.equal(await destino.collection('asistencias').countDocuments(), 3)

    const periodo = await destino.collection('periodos').findOne()
    assert.deepEqual(periodo.ponderaciones, { deber: 20, taller: 20, prueba: 20, examen: 40 })
    assert.equal(periodo.estado, 'activo')
    const estados = (await destino.collection('asistencias').find().sort({ fecha: 1 }).toArray()).map(a => a.estado)
    assert.deepEqual(estados, ['ausente', 'justificado', 'presente'])

    // La v2 funciona sobre los datos migrados, con la MISMA contraseña de la v1
    const request = (await import('supertest')).default
    const express = (await import('express')).default
    const { crearApiV2 } = await import('../../src/v2/app.js')
    const { crearContenedor } = await import('../../src/v2/contenedor.js')
    const app = express().use('/api/v2', crearApiV2(crearContenedor()))
    const login = await request(app).post('/api/v2/auth/login').send({ email: 'rosa@v1.test', password: 'ClaveDeSiempre1' })
    assert.equal(login.status, 200, JSON.stringify(login.body))
    const boletin = await request(app).get(`/api/v2/estudiantes/${pedro}/boletin`).set('Authorization', `Bearer ${login.body.token}`)
    assert.equal(boletin.status, 200, JSON.stringify(boletin.body))
    const materia = boletin.body.materias[0]
    assert.equal(materia.clase.asignatura.nombre, 'Matemáticas')
    assert.equal(materia.promedio.final, 8.67) // (10*20 + 8*40) / 60
    assert.equal(materia.evaluaciones.find(e => e.titulo === 'Deber 1').evidenciaUrl, 'https://i.imgur.com/a.png')
})
