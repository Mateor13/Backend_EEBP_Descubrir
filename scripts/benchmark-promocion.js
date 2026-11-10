// Mide el tiempo de la promoción de año con un volumen realista de datos.
// Crea una BDD temporal, la llena y la borra al terminar. NO usar contra producción.
//   MONGODB_URI_TEST="mongodb://127.0.0.1:27017/?replicaSet=rs0&directConnection=true" node scripts/benchmark-promocion.js
// Parámetros opcionales: CURSOS=35 ALUMNOS=30 CLASES=10 EVALUACIONES=40 ANIOS=1 (años de historial)
//   MODO=lotes (por partes, por defecto) | completo (todo en una llamada), PRESUPUESTO_MS=7000
process.env.MONGODB_DB_V2 = `bench_promocion_${Date.now()}`
process.env.NODE_ENV = 'test'
const P = {
    cursos: Number(process.env.CURSOS) || 35,
    alumnos: Number(process.env.ALUMNOS) || 30,
    clases: Number(process.env.CLASES) || 10,
    evaluaciones: Number(process.env.EVALUACIONES) || 40,
    anios: Number(process.env.ANIOS) || 1
}

const mongoose = (await import('mongoose')).default
const { ObjectId } = mongoose.Types
const { conexionV2 } = await import('../src/v2/infra/db/conexion.js')
const M = await import('../src/v2/infra/db/modelos.js')
const { inicializarV2 } = await import('../src/v2/inicializar.js')
const { crearContenedor } = await import('../src/v2/contenedor.js')

await mongoose.connect(process.env.MONGODB_URI_TEST)
await inicializarV2()
const t0 = Date.now()
const profesor = await M.Usuario.create({ nombre: 'P', apellido: 'P', cedula: '1700000000', email: 'p@b.test', roles: ['profesor'], passwordHash: 'x' })
const asignaturas = await M.Asignatura.insertMany(Array.from({ length: P.clases }, (_, i) => ({ nombre: `Asignatura ${i}` })))
const tipos = ['deber', 'taller', 'prueba', 'examen']
const cursos = []
for (let c = 0; c < P.cursos; c++) cursos.push(await M.Curso.create({ nivel: (c % 7) + 1, paralelo: 'ABCDE'[Math.floor(c / 7) % 5] }))
let totalCalificaciones = 0
let origen
// Cada año tiene sus propios datos completos; se promueve solo el último (los anteriores son historial)
for (let anio = 0; anio < P.anios; anio++) {
    const inicioAnio = 2024 - P.anios + 1 + anio
    origen = await M.Periodo.create({ nombre: `${inicioAnio}-${inicioAnio + 1}`, inicio: new Date(`${inicioAnio}-09-01`), estado: 'cerrado', ponderaciones: { deber: 20, taller: 20, prueba: 20, examen: 40 } })
    for (const [c, curso] of cursos.entries()) {
        const estudiantes = await M.Estudiante.insertMany(Array.from({ length: P.alumnos }, (_, a) => ({ nombre: 'E', apellido: 'E', cedula: String(1000000000 + anio * 10000000 + c * 1000 + a) })))
        await M.Matricula.insertMany(estudiantes.map(e => ({ periodo: origen._id, curso: curso._id, estudiante: e._id })))
        const clases = await M.Clase.insertMany(asignaturas.map(a => ({ periodo: origen._id, curso: curso._id, asignatura: a._id, profesor: profesor._id })))
        const evaluaciones = clases.flatMap(cl => Array.from({ length: P.evaluaciones }, (_, i) => ({ _id: new ObjectId(), clase: cl._id, tipo: tipos[i % 4], titulo: `E${i}`, fecha: new Date() })))
        await M.Evaluacion.insertMany(evaluaciones)
        // ~10% de alumnos con notas bajas para que haya reprobados
        const calificaciones = evaluaciones.flatMap(ev => estudiantes.map((e, idx) => ({ evaluacion: ev._id, estudiante: e._id, nota: idx % 10 === 0 ? 5 : 8 + (idx % 3) })))
        await M.Calificacion.insertMany(calificaciones, { ordered: false, lean: true })
        totalCalificaciones += calificaciones.length
    }
}
const destino = await M.Periodo.create({ nombre: '2025-2026', inicio: new Date('2025-09-01'), estado: 'planificado' })
console.log(`Datos: ${P.anios} año(s), por año ${P.cursos} cursos, ${P.cursos * P.alumnos} alumnos, ${P.cursos * P.clases} clases, ` +
    `${P.cursos * P.clases * P.evaluaciones} evaluaciones; ${totalCalificaciones} calificaciones en total (carga: ${((Date.now() - t0) / 1000).toFixed(1)} s)`)

const { promocionServicio } = crearContenedor()
const medir = async (etiqueta, fn) => {
    const inicio = Date.now()
    const resultado = await fn()
    console.log(`${etiqueta}: ${((Date.now() - inicio) / 1000).toFixed(2)} s`, resultado ?? '')
}
const modo = process.env.MODO || 'lotes'
if (modo === 'completo') {
    await medir('Promoción completa en una sola petición', () => promocionServicio.promover({ origen: origen._id, destino: destino._id }))
} else {
    // Modo por lotes: varias "peticiones" cortas hasta terminar
    await medir('Iniciar proceso (cursos a procesar)', async () => (await promocionServicio.iniciar({ origen: origen._id, destino: destino._id }, profesor._id)).total)
    let peticiones = 0
    let estado
    const inicio = Date.now()
    do {
        const t = Date.now()
        estado = await promocionServicio.procesar(origen._id, { presupuestoMs: Number(process.env.PRESUPUESTO_MS) || 8000 })
        peticiones++
        console.log(`  petición ${peticiones}: ${((Date.now() - t) / 1000).toFixed(2)} s, ${estado.procesados}/${estado.total} cursos`)
    } while (estado.estado !== 'completado')
    console.log(`Total en ${peticiones} peticiones: ${((Date.now() - inicio) / 1000).toFixed(2)} s`, estado.resumen)
}
await conexionV2.dropDatabase()
await mongoose.disconnect()
