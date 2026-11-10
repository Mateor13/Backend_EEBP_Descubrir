// Robustez de la promoción por partes: cortes a mitad de camino y peticiones simultáneas.
// Se omite si no hay MONGODB_URI_TEST.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

const URI = process.env.MONGODB_URI_TEST
const omitir = !URI && 'Defina MONGODB_URI_TEST para ejecutar la prueba de integración'
let mongoose, M, conexionV2, crearContenedor, origen, destino

before(async () => {
    if (omitir) return
    Object.assign(process.env, { NODE_ENV: 'test', MONGODB_DB_V2: `descubrir_v2_promo_${Date.now()}` })
    mongoose = (await import('mongoose')).default
    M = await import('../../src/v2/infra/db/modelos.js');
    ({ conexionV2 } = await import('../../src/v2/infra/db/conexion.js'));
    ({ crearContenedor } = await import('../../src/v2/contenedor.js'))
    const { inicializarV2 } = await import('../../src/v2/inicializar.js')
    await mongoose.connect(URI)
    await inicializarV2()

    // 3 cursos de 5.º a 7.º con 4 alumnos; el alumno 0 de cada curso tiene un 5 en un examen
    const profesor = await M.Usuario.create({ nombre: 'P', apellido: 'P', cedula: '1700000000', email: 'p@t.test', roles: ['profesor'], passwordHash: 'x' })
    origen = await M.Periodo.create({ nombre: '2024-2025', inicio: new Date('2024-09-01'), estado: 'cerrado' })
    destino = await M.Periodo.create({ nombre: '2025-2026', inicio: new Date('2025-09-01') })
    const asignatura = await M.Asignatura.create({ nombre: 'Matemáticas' })
    for (const nivel of [5, 6, 7]) {
        const curso = await M.Curso.create({ nivel, paralelo: 'A' })
        const clase = await M.Clase.create({ periodo: origen._id, curso: curso._id, asignatura: asignatura._id, profesor: profesor._id })
        const examen = await M.Evaluacion.create({ clase: clase._id, tipo: 'examen', titulo: 'Final', fecha: new Date() })
        const alumnos = await M.Estudiante.insertMany([0, 1, 2, 3].map(i => ({ nombre: 'E', apellido: 'E', cedula: `18000${nivel}000${i}` })))
        await M.Matricula.insertMany(alumnos.map(a => ({ periodo: origen._id, curso: curso._id, estudiante: a._id })))
        await M.Calificacion.insertMany(alumnos.map((a, i) => ({ evaluacion: examen._id, estudiante: a._id, nota: i === 0 ? 5 : 9 })))
    }
})

after(async () => {
    if (omitir) return
    await conexionV2.dropDatabase()
    await mongoose.disconnect()
})

test('un corte a mitad de un curso no deja datos a medias y el proceso se reanuda', { skip: omitir }, async () => {
    // Transacción que hace todo el trabajo y luego "se corta" (como un timeout de Vercel): MongoDB la revierte
    const contenedorQueFalla = crearContenedor({
        enTransaccion: (fn) => conexionV2.transaction(async (session) => { await fn(session); throw new Error('corte simulado') })
    })
    const { promocionServicio } = crearContenedor()
    await promocionServicio.iniciar({ origen: origen._id, destino: destino._id })
    await assert.rejects(contenedorQueFalla.promocionServicio.procesar(origen._id, { presupuestoMs: 0 }), /corte simulado/)

    assert.equal(await M.Matricula.countDocuments({ periodo: destino._id }), 0, 'no quedaron matrículas a medias')
    const tras = await promocionServicio.estado(origen._id)
    assert.equal(tras.procesados, 0, 'el curso cortado sigue pendiente')

    // presupuesto 0 = un curso por petición: se necesitan 3 peticiones
    const avances = []
    let estado
    do {
        estado = await promocionServicio.procesar(origen._id, { presupuestoMs: 0 })
        avances.push(estado.procesados)
    } while (estado.estado !== 'completado')
    assert.deepEqual(avances, [1, 2, 3])
    // 5.º y 6.º: 1 repite y 3 promueven en cada uno. 7.º: 1 repite y 3 egresan.
    assert.deepEqual(estado.resumen, { promovidos: 6, repiten: 3, egresados: 3, yaMatriculados: 0, clasesCopiadas: 3 })
    assert.equal(await M.Matricula.countDocuments({ periodo: destino._id }), 9)
})

test('dos peticiones simultáneas no procesan lo mismo (candado)', { skip: omitir }, async () => {
    const { promocionServicio } = crearContenedor()
    await promocionServicio.iniciar({ origen: origen._id, destino: destino._id }) // reinicia (ya completado)
    const resultados = await Promise.allSettled([
        promocionServicio.procesar(origen._id, { presupuestoMs: Infinity }),
        promocionServicio.procesar(origen._id, { presupuestoMs: Infinity })
    ])
    const rechazadas = resultados.filter(r => r.status === 'rejected')
    assert.equal(rechazadas.length, 1)
    assert.match(rechazadas[0].reason.message, /otra petición/)
    const { resumen } = await promocionServicio.estado(origen._id)
    assert.equal(resumen.yaMatriculados, 9, 'la segunda ejecución reconoce lo ya matriculado')
    assert.equal(await M.Matricula.countDocuments({ periodo: destino._id }), 9, 'sin duplicados')
})
