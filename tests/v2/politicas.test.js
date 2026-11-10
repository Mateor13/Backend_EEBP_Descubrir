// Prueba de un servicio con dependencias FALSAS (sin BDD): posible gracias a la inyección de dependencias
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { crearPoliticas } from '../../src/v2/shared/politicas.js'
import { ProhibidoError } from '../../src/v2/shared/errores.js'

const academicoRepo = {
    existeClaseDeProfesorEnCurso: async (profesorId, cursoId) => profesorId === 'prof-1' && cursoId === 'curso-A'
}
const estudiantesRepo = {
    esRepresentante: async (estudianteId, usuarioId) => estudianteId === 'est-1' && usuarioId === 'rep-1',
    matriculaDe: async (estudianteId) => (estudianteId === 'est-1' ? { curso: { _id: 'curso-A' } } : null)
}
const politicas = crearPoliticas({ academicoRepo, estudiantesRepo })
const admin = { id: 'adm', roles: ['admin'] }
const profesor = { id: 'prof-1', roles: ['profesor'] }
const otroProfesor = { id: 'prof-2', roles: ['profesor'] }
const representante = { id: 'rep-1', roles: ['representante'] }
const otroRepresentante = { id: 'rep-2', roles: ['representante'] }

test('el representante solo accede a su propio estudiante (corrige el IDOR de la v1)', async () => {
    await politicas.asegurarAccesoEstudiante(representante, 'est-1', 'p')
    await assert.rejects(politicas.asegurarAccesoEstudiante(otroRepresentante, 'est-1', 'p'), ProhibidoError)
})

test('el profesor solo accede a estudiantes de cursos donde dicta clases', async () => {
    await politicas.asegurarAccesoEstudiante(profesor, 'est-1', 'p')
    await assert.rejects(politicas.asegurarAccesoEstudiante(otroProfesor, 'est-1', 'p'), ProhibidoError)
})

test('solo el profesor de la clase (o un admin) puede operar sobre ella', () => {
    const clase = { profesor: 'prof-1' }
    assert.doesNotThrow(() => politicas.asegurarDictaClase(profesor, clase))
    assert.doesNotThrow(() => politicas.asegurarDictaClase(admin, clase))
    assert.throws(() => politicas.asegurarDictaClase(otroProfesor, clase), ProhibidoError)
})

test('un representante que no es profesor no puede registrar observaciones', async () => {
    await assert.rejects(politicas.asegurarProfesorDelEstudiante(representante, 'est-1', 'p'), ProhibidoError)
    await politicas.asegurarProfesorDelEstudiante(profesor, 'est-1', 'p')
})
