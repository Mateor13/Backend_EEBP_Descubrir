import { Schema, model } from 'mongoose'

// Esquema para el modelo de Curso
const cursoSchema = new Schema({
    // Nombre del curso (ej: "Primero A")
    nombre: {
        type: String,
        required: true,
    },
    // Nivel del curso (1 a 7)
    nivel: {
        type: Number,
        enum: [1, 2, 3, 4, 5, 6, 7],
        required: true
    },
    // Paralelo del curso (A-E)
    paralelo: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D', 'E']
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt
    collection: 'cursos'
})

// Método para asignar el nombre del curso basado en nivel y paralelo
cursoSchema.methods.asignarNombre = async function () {
    const cursos = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo']
    this.nombre = `${cursos[this.nivel - 1]} ${this.paralelo}`
    await this.save()
}

export default model('Curso', cursoSchema)