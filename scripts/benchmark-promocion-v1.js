// Mide la promoción de año de la v1 (POST /api/iniciar-periodo) con un volumen realista.
// Crea una BDD temporal, la llena con datos con la forma de la v1 y la borra al terminar.
//   MONGODB_URI_TEST="mongodb://127.0.0.1:27017/?replicaSet=rs0&directConnection=true" node scripts/benchmark-promocion-v1.js
// Parámetros: CURSOS=35 ALUMNOS=30 MATERIAS=10 EVALUACIONES=40 LATENCIA_MS=5 (latencia estimada Vercel -> Atlas por consulta)
const P = {
    cursos: Number(process.env.CURSOS) || 35,
    alumnos: Number(process.env.ALUMNOS) || 30,
    materias: Number(process.env.MATERIAS) || 10,
    evaluaciones: Number(process.env.EVALUACIONES) || 40,
    latencia: Number(process.env.LATENCIA_MS ?? 5)
}
const url = new URL(process.env.MONGODB_URI_TEST)
url.pathname = `/bench_v1_${Date.now()}`
Object.assign(process.env, { NODE_ENV: 'test', JWT_SECRET: 'x', MONGODB_URI_PRODUCTION: url.toString() })

const mongoose = (await import('mongoose')).default
const AnioLectivo = (await import('../src/models/anioLectivo.js')).default
const Curso = (await import('../src/models/cursos.js')).default
const CursoAsignado = (await import('../src/models/cursoAsignado.js')).default
const { promoverEstudiantes } = await import('../src/services/promocion.js')
const Materia = (await import('../src/models/materias.js')).default
const Estudiante = (await import('../src/models/estudiantes.js')).default
const Notas = (await import('../src/models/notas.js')).default
const Asistencia = (await import('../src/models/asistencia.js')).default
const Observacion = (await import('../src/models/observaciones.js')).default
const Profesor = (await import('../src/models/profesor.js')).default

await mongoose.connect(process.env.MONGODB_URI_PRODUCTION)
const t0 = Date.now()
const profesor = await Profesor.create({ nombre: 'P', apellido: 'P', email: 'p@b.test', password: 'x', telefono: '0999999999', direccion: 'Calle 123', cedula: '1700000000' })
const anterior = await AnioLectivo.create({ estado: false, fechaFin: new Date(), ponderaciones: [{ deberes: 20, talleres: 20, examenes: 40, pruebas: 20 }] })
const tipos = ['deberes', 'talleres', 'pruebas', 'examenes']
for (let c = 0; c < P.cursos; c++) {
    const nivel = (c % 7) + 1
    const paralelo = 'ABCDE'[Math.floor(c / 7) % 5]
    const curso = await Curso.create({ nivel, paralelo, nombre: `${nivel} ${paralelo}` })
    const estudiantes = await Estudiante.insertMany(Array.from({ length: P.alumnos }, (_, a) => ({ nombre: 'E', apellido: 'E', cedula: String(1800000000 + c * 1000 + a) })))
    const materias = await Materia.insertMany(Array.from({ length: P.materias }, (_, m) => ({ nombre: `Materia ${m}`, profesor: profesor._id, anioLectivo: anterior._id })))
    await CursoAsignado.create({ curso: curso._id, anioLectivo: anterior._id, estudiantes: estudiantes.map(e => e._id), materias: materias.map(m => m._id) })
    const notas = []
    for (const [idx, e] of estudiantes.entries()) {
        for (const m of materias) {
            const evaluaciones = Object.fromEntries(tipos.map(t => [t, []]))
            for (let i = 0; i < P.evaluaciones; i++) {
                evaluaciones[tipos[i % 4]].push({ descripcion: `${tipos[i % 4]} ${i}`, nota: idx % 10 === 0 ? 5 : 8 + (idx % 3), fecha: '1/10/2024' })
            }
            notas.push({ estudiante: e._id, materia: m._id, anioLectivo: anterior._id, evaluaciones })
        }
    }
    await Notas.insertMany(notas, { lean: true })
}
const nuevo = await AnioLectivo.create({})
console.log(`Datos v1: ${P.cursos} cursos, ${P.cursos * P.alumnos} alumnos, ${P.cursos * P.materias} materias, ${P.cursos * P.alumnos * P.materias} documentos de notas con ${P.evaluaciones} evaluaciones c/u (carga: ${((Date.now() - t0) / 1000).toFixed(1)} s)`)

// Cuenta las consultas a la BDD durante la promoción
let consultas = 0
mongoose.set('debug', () => { consultas++ })
const inicio = Date.now()
const resultado = await promoverEstudiantes(anterior._id, nuevo._id)
const segundos = (Date.now() - inicio) / 1000
mongoose.set('debug', false)
const reprobados = await CursoAsignado.aggregate([{ $match: { anioLectivo: nuevo._id } }, { $lookup: { from: 'cursos', localField: 'curso', foreignField: '_id', as: 'c' } }, { $unwind: '$c' }, { $group: { _id: '$c.nivel', alumnos: { $sum: { $size: '$estudiantes' } } } }, { $sort: { _id: 1 } }])
console.log(`Promoción v1: ${segundos.toFixed(2)} s locales, ${consultas} consultas a la BDD`,
    `(≈ ${(segundos + consultas * P.latencia / 1000).toFixed(1)} s con ${P.latencia} ms de latencia por consulta)`, resultado)
console.log('Alumnos por nivel en el año nuevo:', reprobados.map(r => `${r._id}º: ${r.alumnos}`).join(', '),
    '| asistencias:', await Asistencia.countDocuments({ anioLectivo: nuevo._id }), '| observaciones:', await Observacion.countDocuments({ anioLectivo: nuevo._id }),
    '| materias nuevas:', await Materia.countDocuments({ anioLectivo: nuevo._id }))
await mongoose.connection.dropDatabase()
await mongoose.disconnect()
