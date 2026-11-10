// Pruebas unitarias de reglas de la v1 (sin BDD)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import Asistencia from '../../src/models/asistencia.js'
import { promedioPonderado } from '../../src/models/notas.js'
import { decidirPromocion } from '../../src/services/promocion.js'

test('justificar acepta la fecha con ceros que envía el frontend (2026/12/05 = 2026/12/5)', async () => {
    const asistencia = new Asistencia({ estudiante: '6740a1b2c3d4e5f6a7b8c9d0', anioLectivo: '6740a1b2c3d4e5f6a7b8c9d1', faltas: 1,
        asistencia: [{ fecha: '2026/12/5', presente: false, justificacion: '' }] })
    asistencia.save = async () => {} // sin BDD
    const resultado = await asistencia.justificarInasistencia('2026/12/05', 'Cita médica')
    assert.equal(resultado, undefined, JSON.stringify(resultado))
    assert.equal(asistencia.asistencia[0].presente, true)
    assert.equal(asistencia.faltas, 0)
})

test('promedio ponderado de una materia v1', () => {
    const ponderaciones = { deberes: 20, talleres: 20, examenes: 40, pruebas: 20 }
    const evaluaciones = { deberes: [{ nota: 10 }, { descripcion: 'solo evidencia' }], talleres: [], pruebas: [], examenes: [{ nota: 8 }] }
    assert.ok(Math.abs(promedioPonderado(evaluaciones, ponderaciones) - (10 * 20 + 8 * 40) / 60) < 1e-9)
    assert.equal(promedioPonderado({ deberes: [], talleres: [], pruebas: [], examenes: [] }, ponderaciones), null, 'sin notas: null, no 0')
})

test('promoción v1: una materia sin notas no hace repetir; de 1.º a 4.º siempre se promueve', () => {
    assert.equal(decidirPromocion({ nivel: 5, promediosMaterias: [8.67, null] }), 'aprueba')
    assert.equal(decidirPromocion({ nivel: 5, promediosMaterias: [8.67, 6.5] }), 'repite')
    assert.equal(decidirPromocion({ nivel: 3, promediosMaterias: [2] }), 'aprueba')
    assert.equal(decidirPromocion({ nivel: 6, promediosMaterias: [] }), 'aprueba')
})
