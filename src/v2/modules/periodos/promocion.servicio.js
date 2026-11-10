import { ConflictoError, NoEncontradoError } from '../../shared/errores.js'
import { decidirPromocion, nivelDestino, promedioFinalDesdeTipos } from '../calificaciones/dominio/promedios.js'

// Tiempo de trabajo por petición. Debe quedar por debajo del límite de la plataforma
// (en Vercel depende del plan); el resto se procesa en las siguientes peticiones.
export const PRESUPUESTO_POR_DEFECTO_MS = Number(process.env.PROMOCION_PRESUPUESTO_MS) || 7000
const MARGEN_CANDADO_MS = 60 * 1000
const claveCurso = (nivel, paralelo) => `${nivel}-${paralelo}`

// ============================================================================
// Promoción de año por partes (un curso a la vez), reanudable y segura ante cortes:
//   1. iniciar():  valida, prepara cursos destino, copia la planta docente y guarda la lista de cursos.
//   2. procesar(): avanza cursos hasta agotar el presupuesto de tiempo. Cada curso es una transacción
//                  que incluye su avance, así un corte a mitad no deja nada a medias ni duplicado.
// Los promedios se agrupan con Map en una sola pasada (sin recorrer listas anidadas).
// Con 1 050 alumnos y 420 000 notas, la v2 inicial tardaba 54 s en una sola petición.
// ============================================================================
export const crearPromocionServicio = ({ periodosRepo, estudiantesRepo, academicoRepo, calificacionesRepo, procesosRepo, enTransaccion }) => {
    const obtenerPeriodos = async (origenId, destinoId) => {
        const [origen, destino] = await Promise.all([periodosRepo.buscarPorId(origenId), destinoId && periodosRepo.buscarPorId(destinoId)])
        if (!origen || (destinoId && !destino)) throw new NoEncontradoError('Periodo')
        return { origen, destino }
    }

    // Resultado de cada estudiante de UN curso (no escribe nada)
    const calcularCurso = async (origen, curso) => {
        const [matriculas, clases] = await Promise.all([
            estudiantesRepo.matriculasVigentesDelCurso(curso._id, origen._id),
            academicoRepo.clasesDelCurso(curso._id, origen._id)
        ])
        const promedios = await calificacionesRepo.promediosPorTipo(clases.map(c => c._id))
        // porEstudiante: idEstudiante -> idClase -> { tipo: promedio }
        const porEstudiante = new Map()
        for (const { _id: { estudiante, clase, tipo }, promedio } of promedios) {
            const e = String(estudiante)
            if (!porEstudiante.has(e)) porEstudiante.set(e, new Map())
            const clases = porEstudiante.get(e)
            if (!clases.has(String(clase))) clases.set(String(clase), {})
            clases.get(String(clase))[tipo] = promedio
        }
        return matriculas.filter(m => m.estudiante?.activo).map((m) => {
            const promediosFinales = [...(porEstudiante.get(String(m.estudiante._id))?.values() ?? [])]
                .map(porTipo => promedioFinalDesdeTipos(porTipo, origen.ponderaciones))
            const { aprueba, clasesReprobadas } = decidirPromocion({
                nivel: curso.nivel, promediosFinales,
                notaMinima: origen.notaMinima, nivelMinimoReprobacion: origen.nivelMinimoReprobacion
            })
            return { matricula: m, estudiante: m.estudiante._id, aprueba, clasesReprobadas, nivelDestino: nivelDestino({ nivel: curso.nivel, aprueba }) }
        })
    }

    const aEstado = (p) => p && ({
        origen: String(p.origen), destino: String(p.destino), estado: p.estado, total: p.total,
        procesados: p.total - p.cursosPendientes.length, resumen: p.resumen, finalizado: p.finalizado
    })

    return {
        async vistaPrevia(origenId, cursoId) {
            const { origen } = await obtenerPeriodos(origenId)
            const [curso] = await academicoRepo.buscarCursos([cursoId])
            if (!curso) throw new NoEncontradoError('Curso')
            return (await calcularCurso(origen, curso)).map(({ estudiante, aprueba, clasesReprobadas, nivelDestino }) => ({
                estudiante: String(estudiante), aprueba, clasesReprobadas, nivelDestino
            }))
        },

        async estado(origenId) {
            const proceso = await procesosRepo.buscarPorOrigen(origenId)
            if (!proceso) throw new NoEncontradoError('Proceso de promoción')
            return aEstado(proceso)
        },

        async iniciar({ origen: origenId, destino: destinoId, copiarClases = true }, usuarioId) {
            const { origen, destino } = await obtenerPeriodos(origenId, destinoId)
            if (origen.estado !== 'cerrado') throw new ConflictoError('Cierre el periodo de origen antes de promover')
            if (destino.estado === 'cerrado') throw new ConflictoError('El periodo de destino está cerrado')
            const existente = await procesosRepo.buscarPorOrigen(origen._id)
            if (existente && String(existente.destino) !== String(destino._id)) {
                throw new ConflictoError('Este periodo ya se promovió hacia otro periodo de destino')
            }
            if (existente?.estado === 'en_progreso') return aEstado(existente) // continuar el que ya existe

            // Cursos destino necesarios (mismo nivel para quien repite, siguiente para quien aprueba)
            const cursos = await academicoRepo.buscarCursos(await estudiantesRepo.cursosConMatriculas(origen._id))
            const pares = cursos.flatMap(c => [{ nivel: c.nivel, paralelo: c.paralelo }, ...(c.nivel < 7 ? [{ nivel: c.nivel + 1, paralelo: c.paralelo }] : [])])
            if (pares.length) await academicoRepo.asegurarCursos(pares)

            // Copia la planta docente una sola vez (una inserción masiva)
            let clasesCopiadas = 0
            if (copiarClases) {
                const existentes = new Set((await academicoRepo.clasesDelPeriodo(destino._id)).map(c => `${c.curso}-${c.asignatura}`))
                const copias = (await academicoRepo.clasesDelPeriodo(origen._id))
                    .filter(c => !existentes.has(`${c.curso}-${c.asignatura}`))
                    .map(({ curso, asignatura, profesor }) => ({ periodo: destino._id, curso, asignatura, profesor }))
                if (copias.length) await academicoRepo.insertarClases(copias)
                clasesCopiadas = copias.length
            }
            return aEstado(await procesosRepo.guardar(origen._id, {
                destino: destino._id, copiarClases, estado: 'en_progreso', total: cursos.length,
                cursosPendientes: cursos.map(c => c._id), bloqueadoHasta: null, finalizado: null, iniciadoPor: usuarioId,
                resumen: { promovidos: 0, repiten: 0, egresados: 0, yaMatriculados: 0, clasesCopiadas }
            }))
        },

        // Avanza todo lo que quepa en el presupuesto de tiempo y devuelve el progreso
        async procesar(origenId, { presupuestoMs = PRESUPUESTO_POR_DEFECTO_MS } = {}) {
            const inicio = Date.now()
            const actual = await procesosRepo.buscarPorOrigen(origenId)
            if (!actual) throw new NoEncontradoError('Proceso de promoción')
            if (actual.estado === 'completado') return aEstado(actual)
            const limite = Number.isFinite(presupuestoMs) ? presupuestoMs : 24 * 60 * 60 * 1000
            const proceso = await procesosRepo.bloquear(origenId, new Date(inicio + limite + MARGEN_CANDADO_MS))
            if (!proceso) throw new ConflictoError('La promoción se está procesando en otra petición; intente en unos segundos')

            try {
                const { origen } = await obtenerPeriodos(proceso.origen)
                const pendientes = await academicoRepo.buscarCursos(proceso.cursosPendientes)
                // Cursos destino indexados por nivel-paralelo (se crearon en iniciar)
                const destinos = new Map()
                for (const c of await academicoRepo.listarCursos()) destinos.set(claveCurso(c.nivel, c.paralelo), c._id)

                let duracionMaxima = 0
                let procesadosAhora = 0
                for (const curso of pendientes) {
                    // Siempre avanza al menos un curso (garantiza progreso). Después se detiene si el
                    // SIGUIENTE curso podría no alcanzar a terminar dentro del presupuesto.
                    if (procesadosAhora > 0 && Date.now() - inicio + duracionMaxima > limite) break
                    const inicioCurso = Date.now()
                    const resultados = await calcularCurso(origen, curso)
                    await enTransaccion(async (session) => {
                        const ya = new Set((await estudiantesRepo.estudiantesMatriculadosEn(proceso.destino, resultados.map(r => r.estudiante), session)).map(String))
                        const inc = { 'resumen.promovidos': 0, 'resumen.repiten': 0, 'resumen.egresados': 0, 'resumen.yaMatriculados': 0 }
                        const nuevas = []
                        for (const r of resultados) {
                            if (r.nivelDestino === null) { inc['resumen.egresados']++; continue }
                            if (ya.has(String(r.estudiante))) { inc['resumen.yaMatriculados']++; continue }
                            nuevas.push({ periodo: proceso.destino, curso: destinos.get(claveCurso(r.nivelDestino, curso.paralelo)), estudiante: r.estudiante })
                            inc[r.aprueba ? 'resumen.promovidos' : 'resumen.repiten']++
                        }
                        if (nuevas.length) await estudiantesRepo.insertarMatriculas(nuevas, session)
                        if (resultados.length) {
                            await estudiantesRepo.actualizarEstadosMatricula(resultados.map(r => ({
                                updateOne: { filter: { _id: r.matricula._id }, update: { estado: r.aprueba ? 'aprobada' : 'reprobada' } }
                            })), session)
                        }
                        await procesosRepo.marcarCursoProcesado(proceso._id, curso._id, inc, session)
                    })
                    duracionMaxima = Math.max(duracionMaxima, Date.now() - inicioCurso)
                    procesadosAhora++
                }
                return aEstado(await procesosRepo.completar(proceso._id) ?? await procesosRepo.buscarPorOrigen(origenId))
            } finally {
                await procesosRepo.liberar(origenId)
            }
        },

        // Todo de una vez (para el script de consola o pruebas): sin límite de tiempo
        async promover(datos, usuarioId) {
            await this.iniciar(datos, usuarioId)
            return this.procesar(datos.origen, { presupuestoMs: Infinity })
        }
    }
}
