import mongoose from 'mongoose'
import AnioLectivo from '../models/anioLectivo.js'
import Curso from '../models/cursos.js'
import CursoAsignado from '../models/cursoAsignado.js'
import Materia from '../models/materias.js'
import Estudiante from '../models/estudiantes.js'
import Notas, { promedioPonderado } from '../models/notas.js'
import Asistencia from '../models/asistencia.js'
import Observacion from '../models/observaciones.js'

// ============================================================================
// Promoción de año de la API v1 (la usa POST /api/iniciar-periodo).
//
// Antes: ~795 consultas a la BDD para un colegio de 1 050 alumnos (varias por curso y por materia),
// lo que en Vercel con MongoDB Atlas superaba el tiempo máximo por petición.
// Ahora: un número FIJO de consultas (~15), sin importar cuántos cursos o alumnos haya:
//   1. leer todo lo necesario de una vez,  2. decidir en memoria con Map,  3. escribir con operaciones masivas.
//
// Reglas (iguales a las de la v1, salvo los bugs corregidos que se indican):
//   - De 5.º en adelante repite quien tenga alguna materia con promedio < 7. Una materia SIN notas
//     no hace repetir (antes contaba como 0).
//   - De 1.º a 4.º siempre se promueve. 7.º aprobado egresa.
//   - Los estudiantes desactivados no pasan al año nuevo.
//   - Cada curso del año nuevo recibe una COPIA PROPIA de las materias del mismo curso del año
//     anterior (antes, cursos distintos con la misma materia y profesor compartían un único documento).
//   - Se aseguran los cursos de 1.º A-E. Asistencia y observaciones se crean para quien sigue en la
//     escuela (antes también para quien egresaba).
// ============================================================================
const NOMBRES_NIVEL = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo']
const PARALELOS_PRIMERO = ['A', 'B', 'C', 'D', 'E']
const NOTA_MINIMA = 7
const NIVEL_MINIMO_REPROBACION = 5
const clave = (nivel, paralelo) => `${nivel}-${paralelo}`

// Ejecuta fn dentro de una transacción si la BDD lo permite (replica set, como MongoDB Atlas).
// En una BDD local sin replica set se ejecuta igual, sin transacción.
export const enTransaccionSiEsPosible = async (fn) => {
    try {
        return await mongoose.connection.transaction((session) => fn(session))
    } catch (error) {
        const sinSoporte = error?.code === 20 || /replica set|Transaction numbers/i.test(error?.message ?? '')
        if (!sinSoporte) throw error
        return fn(null)
    }
}

// Decide el resultado de cada estudiante (función pura: recibe datos, devuelve datos)
export const decidirPromocion = ({ nivel, promediosMaterias }) => {
    if (nivel < NIVEL_MINIMO_REPROBACION) return 'aprueba'
    return promediosMaterias.some(p => p !== null && p < NOTA_MINIMA) ? 'repite' : 'aprueba'
}

export const promoverEstudiantes = async (anioAnteriorId, anioNuevoId, session = null) => {
    // ---------- 1. Lectura (todo de una vez) ----------
    const [anioAnterior, asignadosAnteriores, asignadosNuevos] = await Promise.all([
        AnioLectivo.findById(anioAnteriorId).session(session),
        CursoAsignado.find({ anioLectivo: anioAnteriorId }).populate('curso').session(session).lean(),
        CursoAsignado.find({ anioLectivo: anioNuevoId }).session(session).lean()
    ])
    const ponderaciones = anioAnterior?.obtenerPonderaciones() ?? null
    const idsEstudiantes = asignadosAnteriores.flatMap(ca => ca.estudiantes)
    const [estudiantes, notas, materias] = await Promise.all([
        Estudiante.find({ _id: { $in: idsEstudiantes } }, { estado: 1 }).session(session).lean(),
        Notas.find({ anioLectivo: anioAnteriorId, estudiante: { $in: idsEstudiantes } }, { estudiante: 1, evaluaciones: 1 }).session(session).lean(),
        Materia.find({ _id: { $in: asignadosAnteriores.flatMap(ca => ca.materias) } }).session(session).lean()
    ])

    // ---------- 2. Decisiones en memoria ----------
    const activos = new Set(estudiantes.filter(e => e.estado !== false).map(e => String(e._id)))
    const promediosPorEstudiante = new Map()
    for (const nota of notas) {
        const id = String(nota.estudiante)
        if (!promediosPorEstudiante.has(id)) promediosPorEstudiante.set(id, [])
        promediosPorEstudiante.get(id).push(promedioPonderado(nota.evaluaciones, ponderaciones))
    }
    const materiaPorId = new Map(materias.map(m => [String(m._id), m]))
    const anteriorPorCurso = new Map(asignadosAnteriores.filter(ca => ca.curso).map(ca => [clave(ca.curso.nivel, ca.curso.paralelo), ca]))
    const yaEnAnioNuevo = new Set(asignadosNuevos.flatMap(ca => ca.estudiantes.map(String)))

    // Cursos del año nuevo: { nivel, paralelo, estudiantes[] }
    const destinos = new Map()
    const destino = (nivel, paralelo) => {
        const k = clave(nivel, paralelo)
        if (!destinos.has(k)) destinos.set(k, { nivel, paralelo, estudiantes: [] })
        return destinos.get(k)
    }
    for (const p of PARALELOS_PRIMERO) destino(1, p)
    const continuan = []
    for (const ca of asignadosAnteriores) {
        if (!ca.curso) continue
        const { nivel, paralelo } = ca.curso
        destino(nivel, paralelo) // el mismo curso siempre existe en el año nuevo (para quien repite)
        // El curso siguiente existe si recibe estudiantes o si ya existía el año anterior
        if (nivel < 7 && anteriorPorCurso.has(clave(nivel + 1, paralelo))) destino(nivel + 1, paralelo)
        for (const idEstudiante of ca.estudiantes.map(String)) {
            if (!activos.has(idEstudiante) || yaEnAnioNuevo.has(idEstudiante)) continue
            yaEnAnioNuevo.add(idEstudiante)
            const resultado = decidirPromocion({ nivel, promediosMaterias: promediosPorEstudiante.get(idEstudiante) ?? [] })
            if (resultado === 'repite') destino(nivel, paralelo).estudiantes.push(idEstudiante)
            else if (nivel < 7) destino(nivel + 1, paralelo).estudiantes.push(idEstudiante)
            else continue // 7.º aprobado: egresa
            continuan.push(idEstudiante)
        }
    }

    // ---------- 3. Escritura masiva ----------
    // Cursos (catálogo): crea los que falten y los lee una vez
    await Curso.bulkWrite([...destinos.values()].map(({ nivel, paralelo }) => ({
        updateOne: {
            filter: { nivel, paralelo },
            update: { $setOnInsert: { nivel, paralelo, nombre: `${NOMBRES_NIVEL[nivel - 1]} ${paralelo}` } },
            upsert: true
        }
    })), { session })
    const cursos = await Curso.find({ $or: [...destinos.values()].map(({ nivel, paralelo }) => ({ nivel, paralelo })) }).session(session).lean()
    const cursoPorClave = new Map(cursos.map(c => [clave(c.nivel, c.paralelo), c._id]))
    const nuevoPorCurso = new Map(asignadosNuevos.map(ca => [String(ca.curso), ca]))

    // Materias: copia propia por curso, solo si el curso del año nuevo aún no tiene materias
    const materiasNuevas = []
    const materiasPorCurso = new Map()
    for (const [k, d] of destinos) {
        const existente = nuevoPorCurso.get(String(cursoPorClave.get(k)))
        if (existente?.materias?.length) continue
        const origen = anteriorPorCurso.get(clave(d.nivel, d.paralelo))
        const copias = (origen?.materias ?? []).map(id => materiaPorId.get(String(id)))
            .filter(m => m && m.estado !== false)
            .map(m => ({ _id: new mongoose.Types.ObjectId(), nombre: m.nombre, profesor: m.profesor, anioLectivo: anioNuevoId, estado: true }))
        materiasNuevas.push(...copias)
        materiasPorCurso.set(k, copias.map(m => m._id))
    }
    if (materiasNuevas.length) await Materia.insertMany(materiasNuevas, { session })

    // Cursos asignados del año nuevo: una operación por curso, todas en un solo bulkWrite
    await CursoAsignado.bulkWrite([...destinos.entries()].map(([k, d]) => ({
        updateOne: {
            filter: { curso: cursoPorClave.get(k), anioLectivo: anioNuevoId },
            update: {
                $addToSet: { estudiantes: { $each: d.estudiantes.map(id => new mongoose.Types.ObjectId(id)) } },
                ...(materiasPorCurso.has(k) && { $set: { materias: materiasPorCurso.get(k) } }),
                $setOnInsert: { estado: true, fechaAsignacion: new Date() }
            },
            upsert: true
        }
    })), { session })

    // Documentos de asistencia y observaciones para quien sigue en la escuela
    if (continuan.length) {
        const operaciones = continuan.map(id => ({
            updateOne: { filter: { estudiante: id, anioLectivo: anioNuevoId }, update: { $setOnInsert: { estudiante: id, anioLectivo: anioNuevoId } }, upsert: true }
        }))
        await Promise.all([Asistencia.bulkWrite(operaciones, { session }), Observacion.bulkWrite(operaciones, { session })])
    }
    return { mensaje: 'Promoción completada' }
}
