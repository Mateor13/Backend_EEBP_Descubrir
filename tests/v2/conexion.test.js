// Nombre de la BDD v2: un valor con punto (p. ej. el host del clúster) rompía la conexión de toda la app
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarNombreBD } from '../../src/v2/infra/db/conexion.js'

test('acepta nombres válidos y quita espacios alrededor', () => {
    assert.equal(validarNombreBD('descubrir_v2'), 'descubrir_v2')
    assert.equal(validarNombreBD(' descubrir-v2 '), 'descubrir-v2')
})

test('rechaza con un mensaje claro los nombres que MongoDB no admite', () => {
    for (const malo of ['descubrir.v2', 'cluster0.abcd.mongodb.net', 'mongodb+srv://u:p@c.net/x', 'a b', '', 'x'.repeat(64)]) {
        assert.throws(() => validarNombreBD(malo), /MONGODB_DB_V2 no es un nombre de base de datos válido/, malo)
    }
})
