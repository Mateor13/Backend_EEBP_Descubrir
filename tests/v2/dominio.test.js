// Pruebas de reglas de negocio puras: no necesitan BDD ni servidor
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularPromedioClase, decidirPromocion, nivelDestino, validarPonderaciones } from '../../src/v2/modules/calificaciones/dominio/promedios.js'

const ponderaciones = { deber: 20, taller: 20, prueba: 20, examen: 40 }
const evaluaciones = [
    { _id: 'd1', tipo: 'deber' }, { _id: 'd2', tipo: 'deber' },
    { _id: 't1', tipo: 'taller' }, { _id: 'e1', tipo: 'examen' }
]

test('promedio ponderado por tipo de evaluación', () => {
    const notas = new Map([['d1', 10], ['d2', 8], ['t1', 6], ['e1', 7]])
    const { porTipo, final } = calcularPromedioClase({ evaluaciones, notasPorEvaluacion: notas, ponderaciones })
    assert.deepEqual(porTipo, { deber: 9, taller: 6, prueba: null, examen: 7 })
    // (9*20 + 6*20 + 7*40) / 80: "prueba" no tiene notas y no resta puntos
    assert.equal(final, 7.25)
})

test('las evaluaciones sin nota del estudiante no cuentan como cero', () => {
    const { final } = calcularPromedioClase({ evaluaciones, notasPorEvaluacion: new Map([['d1', 8]]), ponderaciones })
    assert.equal(final, 8)
})

test('sin ninguna nota el promedio es null', () => {
    const { final } = calcularPromedioClase({ evaluaciones, notasPorEvaluacion: new Map(), ponderaciones })
    assert.equal(final, null)
})

test('decidirPromocion respeta la nota mínima y el nivel mínimo de reprobación', () => {
    assert.deepEqual(decidirPromocion({ nivel: 5, promediosFinales: [8, 6.99, null] }), { aprueba: false, clasesReprobadas: 1 })
    assert.deepEqual(decidirPromocion({ nivel: 5, promediosFinales: [7, 9.5] }), { aprueba: true, clasesReprobadas: 0 })
    // De 1.º a 4.º no se repite (regla de la v1, ahora configurable por periodo)
    assert.equal(decidirPromocion({ nivel: 3, promediosFinales: [2] }).aprueba, true)
    assert.equal(decidirPromocion({ nivel: 3, promediosFinales: [2], nivelMinimoReprobacion: 1 }).aprueba, false)
})

test('nivelDestino: sube, repite o egresa', () => {
    assert.equal(nivelDestino({ nivel: 4, aprueba: true }), 5)
    assert.equal(nivelDestino({ nivel: 4, aprueba: false }), 4)
    assert.equal(nivelDestino({ nivel: 7, aprueba: true }), null)
})

test('las ponderaciones deben sumar 100', () => {
    assert.equal(validarPonderaciones(ponderaciones), true)
    assert.equal(validarPonderaciones({ deber: 50, taller: 50, prueba: 10, examen: 0 }), false)
})
