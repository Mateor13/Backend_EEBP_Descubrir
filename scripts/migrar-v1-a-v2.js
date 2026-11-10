// ============================================================================
// Migra los datos de la BDD v1 a la BDD v2 (nuevo modelo). NO modifica la BDD v1.
// Es idempotente: se puede ejecutar varias veces (usa upserts por claves naturales),
// por ejemplo una vez para probar y otra justo antes de pasar el frontend a la v2.
//
//   npm run migrar:v2
//   Variables: MONGODB_URI_PRODUCTION (origen, BDD por defecto de la URI o MONGODB_DB_V1)
//              MONGODB_DB_V2 (destino, por defecto "descubrir_v2")
// ============================================================================
import { ObjectId } from 'mongodb'
import { pathToFileURL } from 'url'

const TIPOS = { deberes: 'deber', talleres: 'taller', pruebas: 'prueba', examenes: 'examen' }
const ROL_POR_COLECCION = { administradores: 'admin', profesores: 'profesor', representantes: 'representante' }

// "D/M/AAAA" (notas, observaciones) o "AAAA/M/D" (asistencias) -> Date a medianoche UTC
export const parsearFechaV1 = (texto, respaldo = null) => {
    if (texto instanceof Date) return new Date(Date.UTC(texto.getUTCFullYear(), texto.getUTCMonth(), texto.getUTCDate()))
    const partes = String(texto ?? '').split('/').map(Number)
    if (partes.length !== 3 || partes.some(Number.isNaN)) return respaldo
    const [a, m, d] = partes[0] > 31 ? partes : [partes[2], partes[1], partes[0]]
    return new Date(Date.UTC(a, m - 1, d))
}

const ponderacionesV2 = (p) => {
    const fuente = Array.isArray(p) ? p[0] : p
    const r = { deber: fuente?.deberes ?? 0, taller: fuente?.talleres ?? 0, prueba: fuente?.pruebas ?? 0, examen: fuente?.examenes ?? 0 }
    const total = r.deber + r.taller + r.prueba + r.examen
    return total === 100 ? r : { deber: 25, taller: 25, prueba: 25, examen: 25 } // la v1 permitía periodos sin ponderaciones
}

export const migrarV1aV2 = async ({ origen, destino, log = console.log }) => {
    const reporte = {}
    const contar = (clave, n = 1) => { reporte[clave] = (reporte[clave] ?? 0) + n }
    const col = (nombre) => destino.collection(nombre)
    const ahora = new Date()
    const conFechas = (doc) => ({ ...doc, createdAt: doc.createdAt ?? ahora, updatedAt: ahora })

    // ---------- 1. Usuarios: 3 colecciones -> 1, fusionando roles por email ----------
    const usuarioV2 = new Map() // `${coleccion}:${idV1}` -> idV2
    for (const [coleccion, rol] of Object.entries(ROL_POR_COLECCION)) {
        for (const u of await origen.collection(coleccion).find().toArray()) {
            const email = String(u.email).toLowerCase().trim()
            const existente = await col('usuarios').findOne({ email })
            if (existente) {
                await col('usuarios').updateOne({ _id: existente._id }, { $addToSet: { roles: rol } })
                usuarioV2.set(`${coleccion}:${u._id}`, existente._id)
                contar('usuariosFusionados')
                continue
            }
            const conflictoCedula = await col('usuarios').findOne({ cedula: u.cedula })
            if (conflictoCedula) { usuarioV2.set(`${coleccion}:${u._id}`, conflictoCedula._id); contar('usuariosConCedulaDuplicada'); continue }
            await col('usuarios').insertOne(conFechas({
                _id: u._id, nombre: u.nombre, apellido: u.apellido, cedula: u.cedula, email,
                telefono: u.telefono, direccion: u.direccion, roles: [rol],
                passwordHash: u.password, // mismo hash bcrypt: las contraseñas actuales siguen funcionando
                emailConfirmado: Boolean(u.confirmEmail), activo: u.estado !== false, createdAt: u.createdAt
            }))
            usuarioV2.set(`${coleccion}:${u._id}`, u._id)
            contar('usuarios')
        }
    }
    const profesorV2 = (id) => usuarioV2.get(`profesores:${id}`)

    // ---------- 2. Periodos ----------
    const anios = await origen.collection('anioLectivo').find().sort({ fechaInicio: 1 }).toArray()
    const ultimoActivo = [...anios].reverse().find(a => a.estado)
    const periodoV2 = new Map()
    const nombresUsados = new Set()
    for (const a of anios) {
        let nombre = a.periodo
        for (let i = 2; nombresUsados.has(nombre); i++) nombre = `${a.periodo} (${i})` // la v1 permitía nombres repetidos
        nombresUsados.add(nombre)
        await col('periodos').updateOne({ _id: a._id }, {
            $set: {
                nombre, inicio: a.fechaInicio ?? a.createdAt ?? ahora, fin: a.fechaFin ?? null,
                estado: a._id.equals(ultimoActivo?._id) ? 'activo' : 'cerrado',
                ponderaciones: ponderacionesV2(a.ponderaciones), notaMinima: 7, nivelMinimoReprobacion: 5, updatedAt: ahora
            },
            $setOnInsert: { createdAt: a.createdAt ?? ahora }
        }, { upsert: true })
        periodoV2.set(String(a._id), a._id)
        contar('periodos')
    }

    // ---------- 3. Cursos ----------
    const cursoV2 = new Map()
    for (const c of await origen.collection('cursos').find().toArray()) {
        const r = await col('cursos').findOneAndUpdate(
            { nivel: c.nivel, paralelo: c.paralelo },
            { $setOnInsert: { _id: c._id, createdAt: c.createdAt ?? ahora, updatedAt: ahora } },
            { upsert: true, returnDocument: 'after' }
        )
        cursoV2.set(String(c._id), r._id)
        contar('cursos')
    }

    // ---------- 4. Asignaturas (catálogo, por nombre) y clases (antes "materias") ----------
    const materias = new Map((await origen.collection('materias').find().toArray()).map(m => [String(m._id), m]))
    const asignaturaV2 = new Map()
    for (const m of materias.values()) {
        const nombre = m.nombre.trim()
        const clave = nombre.toLocaleLowerCase('es')
        if (asignaturaV2.has(clave)) continue
        const r = await col('asignaturas').findOneAndUpdate(
            { nombre: { $regex: `^${nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
            { $setOnInsert: { nombre, activo: true, createdAt: ahora, updatedAt: ahora } },
            { upsert: true, returnDocument: 'after' }
        )
        asignaturaV2.set(clave, r._id)
    }
    reporte.asignaturas = asignaturaV2.size

    const claseV2 = new Map() // idMateriaV1 -> { _id, profesor }
    const matriculaCurso = new Map() // `${periodo}:${estudiante}` -> curso
    const cursosAsignados = await origen.collection('cursosAsignados').find().toArray()
    for (const ca of cursosAsignados) {
        const periodo = periodoV2.get(String(ca.anioLectivo))
        const curso = cursoV2.get(String(ca.curso))
        if (!periodo || !curso) { contar('cursosAsignadosOmitidos'); continue }
        for (const idMateria of ca.materias ?? []) {
            const m = materias.get(String(idMateria))
            const profesor = m && profesorV2(m.profesor)
            if (!m || !profesor) { contar('materiasOmitidas'); continue }
            const asignatura = asignaturaV2.get(m.nombre.trim().toLocaleLowerCase('es'))
            const r = await col('clases').findOneAndUpdate(
                { periodo, curso, asignatura },
                { $setOnInsert: { _id: m._id, profesor, activo: m.estado !== false, createdAt: m.createdAt ?? ahora, updatedAt: ahora } },
                { upsert: true, returnDocument: 'after' }
            )
            claseV2.set(String(m._id), { _id: r._id, profesor: r.profesor })
            contar('clases')
        }
        // ---------- 5. Matrículas (antes: array de estudiantes en CursoAsignado) ----------
        for (const estudiante of ca.estudiantes ?? []) {
            const clave = `${periodo}:${estudiante}`
            if (matriculaCurso.has(clave)) { contar('matriculasDuplicadasOmitidas'); continue }
            matriculaCurso.set(clave, curso)
            await col('matriculas').updateOne(
                { periodo, estudiante },
                { $setOnInsert: { curso, estado: 'activa', createdAt: ahora, updatedAt: ahora } },
                { upsert: true }
            )
            contar('matriculas')
        }
    }

    // ---------- 6. Estudiantes con sus representantes ----------
    const representantesDe = new Map()
    for (const r of await origen.collection('representantes').find({}, { projection: { estudiantes: 1 } }).toArray()) {
        for (const e of r.estudiantes ?? []) {
            const lista = representantesDe.get(String(e)) ?? []
            lista.push(usuarioV2.get(`representantes:${r._id}`))
            representantesDe.set(String(e), lista)
        }
    }
    for (const e of await origen.collection('estudiantes').find().toArray()) {
        await col('estudiantes').updateOne({ _id: e._id }, {
            $set: { nombre: e.nombre, apellido: e.apellido, cedula: e.cedula, activo: e.estado !== false, updatedAt: ahora },
            $addToSet: { representantes: { $each: (representantesDe.get(String(e._id)) ?? []).filter(Boolean) } },
            $setOnInsert: { createdAt: e.createdAt ?? ahora }
        }, { upsert: true })
        contar('estudiantes')
    }

    // ---------- 7. Evaluaciones (una por clase) y calificaciones (una por alumno) ----------
    const evaluacionV2 = new Map()
    for (const n of await origen.collection('notas').find().toArray()) {
        const clase = claseV2.get(String(n.materia))
        if (!clase) { contar('documentosNotasOmitidos'); continue }
        for (const [tipoV1, tipo] of Object.entries(TIPOS)) {
            for (const ev of n.evaluaciones?.[tipoV1] ?? []) {
                const titulo = String(ev.descripcion ?? '').trim() || `${tipo} sin título`
                const clave = `${clase._id}:${tipo}:${titulo}`
                if (!evaluacionV2.has(clave)) {
                    const r = await col('evaluaciones').findOneAndUpdate(
                        { clase: clase._id, tipo, titulo },
                        { $setOnInsert: { _id: new ObjectId(), descripcion: '', fecha: parsearFechaV1(ev.fecha, n.createdAt ?? ahora), evidenciaUrl: ev.evidenciaUrl ?? null, creadaPor: clase.profesor, createdAt: ahora, updatedAt: ahora } },
                        { upsert: true, returnDocument: 'after' }
                    )
                    evaluacionV2.set(clave, r)
                    contar('evaluaciones')
                }
                const evaluacion = evaluacionV2.get(clave)
                if (!evaluacion.evidenciaUrl && ev.evidenciaUrl) {
                    await col('evaluaciones').updateOne({ _id: evaluacion._id }, { $set: { evidenciaUrl: ev.evidenciaUrl } })
                    evaluacion.evidenciaUrl = ev.evidenciaUrl
                }
                if (typeof ev.nota !== 'number') continue // evaluaciones solo con evidencia: sin nota todavía
                await col('calificaciones').updateOne(
                    { evaluacion: evaluacion._id, estudiante: n.estudiante },
                    { $set: { nota: ev.nota, registradaPor: clase.profesor, updatedAt: ahora }, $setOnInsert: { createdAt: ahora } },
                    { upsert: true }
                )
                contar('calificaciones')
            }
        }
    }

    // ---------- 8. Asistencias: array por alumno -> un documento por día ----------
    for (const a of await origen.collection('asistencias').find().toArray()) {
        const periodo = periodoV2.get(String(a.anioLectivo))
        const curso = matriculaCurso.get(`${periodo}:${a.estudiante}`)
        if (!periodo || !curso) { contar('asistenciasOmitidas', a.asistencia?.length ?? 0); continue }
        for (const r of a.asistencia ?? []) {
            const fecha = parsearFechaV1(r.fecha)
            if (!fecha) { contar('asistenciasConFechaInvalida'); continue }
            const justificado = r.presente && r.justificacion
            await col('asistencias').updateOne(
                { estudiante: a.estudiante, fecha },
                { $set: { periodo, curso, estado: justificado ? 'justificado' : (r.presente ? 'presente' : 'ausente'), justificacion: r.justificacion ?? '', updatedAt: ahora }, $setOnInsert: { createdAt: ahora } },
                { upsert: true }
            )
            contar('asistencias')
        }
    }

    // ---------- 9. Observaciones: array por alumno -> un documento por observación ----------
    for (const o of await origen.collection('observaciones').find().toArray()) {
        const periodo = periodoV2.get(String(o.anioLectivo))
        for (const ob of o.observaciones ?? []) {
            const autor = profesorV2(ob.profesor)
            if (!periodo || !autor || !ob.observacion) { contar('observacionesOmitidas'); continue }
            const fecha = parsearFechaV1(ob.fecha, o.createdAt ?? ahora)
            await col('observaciones').updateOne(
                { estudiante: o.estudiante, autor, texto: ob.observacion, fecha },
                { $setOnInsert: { periodo, createdAt: ahora, updatedAt: ahora } },
                { upsert: true }
            )
            contar('observaciones')
        }
    }

    log('[migración] Resultado:', reporte)
    return reporte
}

// Ejecución desde la línea de comandos
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    await import('../src/config/env.js')
    const mongoose = (await import('mongoose')).default
    const { inicializarV2 } = await import('../src/v2/inicializar.js')
    const { NOMBRE_BD_V2 } = await import('../src/v2/infra/db/conexion.js')
    await mongoose.connect(process.env.MONGODB_URI_PRODUCTION)
    const client = mongoose.connection.getClient()
    const origen = process.env.MONGODB_DB_V1 ? client.db(process.env.MONGODB_DB_V1) : mongoose.connection.db
    if (origen.databaseName === NOMBRE_BD_V2) throw new Error('La BDD de origen y destino no pueden ser la misma')
    console.log(`[migración] ${origen.databaseName} -> ${NOMBRE_BD_V2}`)
    const destino = client.db(NOMBRE_BD_V2)
    // Crea colecciones e índices únicos ANTES de migrar, para que la BDD rechace duplicados
    const adminEmail = process.env.ADMIN_EMAIL
    delete process.env.ADMIN_EMAIL // no crear el admin inicial: viene en la migración
    await inicializarV2()
    process.env.ADMIN_EMAIL = adminEmail
    await migrarV1aV2({ origen, destino })
    await mongoose.disconnect()
}
