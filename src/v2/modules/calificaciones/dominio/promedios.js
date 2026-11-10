// ============================================================================
// Reglas de negocio PURAS sobre notas: no usan BDD, Express ni fechas del sistema.
// Reciben datos y devuelven datos, por eso se prueban con tests simples (tests/v2/dominio).
// ============================================================================
import { TIPOS_EVALUACION } from '../../../infra/db/modelos.js'

const redondear = (n) => Math.round(n * 100) / 100

// Valida que las ponderaciones sumen 100
export const validarPonderaciones = (ponderaciones) => {
    const total = TIPOS_EVALUACION.reduce((acc, t) => acc + (Number(ponderaciones?.[t]) || 0), 0)
    return Math.abs(total - 100) < 1e-9
}

/**
 * Promedio de un estudiante en una clase.
 * - Promedio simple por tipo (deber, taller, prueba, examen) de las evaluaciones con nota.
 *   Una evaluación sin nota del estudiante no cuenta (no se asume 0); el docente decide registrar 0.
 * - Promedio final ponderado, normalizado con los pesos de los tipos que sí tienen notas.
 * @returns {{ porTipo: Record<string, number|null>, final: number|null }}
 */
export const calcularPromedioClase = ({ evaluaciones, notasPorEvaluacion, ponderaciones }) => {
    const porTipo = {}
    let suma = 0
    let pesoUsado = 0
    for (const tipo of TIPOS_EVALUACION) {
        const notas = evaluaciones
            .filter(e => e.tipo === tipo)
            .map(e => notasPorEvaluacion.get(String(e._id)))
            .filter(n => typeof n === 'number')
        if (notas.length === 0) { porTipo[tipo] = null; continue }
        const promedio = notas.reduce((a, b) => a + b, 0) / notas.length
        porTipo[tipo] = redondear(promedio)
        const peso = Number(ponderaciones?.[tipo]) || 0
        suma += promedio * peso
        pesoUsado += peso
    }
    return { porTipo, final: pesoUsado === 0 ? null : redondear(suma / pesoUsado) }
}

/**
 * Decide si un estudiante aprueba el año.
 * Reprueba si su nivel es >= nivelMinimoReprobacion y alguna clase tiene promedio final
 * menor a la nota mínima. Una clase sin notas no hace reprobar (no hay evidencia para decidir).
 */
export const decidirPromocion = ({ nivel, promediosFinales, notaMinima = 7, nivelMinimoReprobacion = 5 }) => {
    if (nivel < nivelMinimoReprobacion) return { aprueba: true, clasesReprobadas: 0 }
    const clasesReprobadas = promediosFinales.filter(p => typeof p === 'number' && p < notaMinima).length
    return { aprueba: clasesReprobadas === 0, clasesReprobadas }
}

// Destino de un estudiante al terminar el año: siguiente nivel, mismo nivel o egresa (7.º aprobado)
export const nivelDestino = ({ nivel, aprueba }) => {
    if (!aprueba) return nivel
    return nivel >= 7 ? null : nivel + 1
}
