import js from '@eslint/js'
import globals from 'globals'

// Lint para el código v2, los scripts y las pruebas (la v1 se deja como está hasta retirarla)
export default [
    js.configs.recommended,
    {
        files: ['src/v2/**/*.js', 'scripts/**/*.js', 'tests/**/*.js'],
        languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node } },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always', { null: 'ignore' }]
        }
    }
]
