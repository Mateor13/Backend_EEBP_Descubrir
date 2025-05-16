import mongoose, {Schema, model} from 'mongoose'  
import Materias from './materias.js'

// Esquema para el modelo de Curso
const cursoSchema = new Schema({
    // Nombre del curso (ej: "Primero A")
    nombre:{
        type: String,
        unique: true
    },
    // Nivel del curso (1 a 7)
    nivel:{
        type:Number,
        enum:[1,2,3,4,5,6,7],
        required:true
    },
    // Paralelo del curso (A-E)
    paralelo:{
        type:String,
        required:true,
        enum:['A','B','C','D','E']
    },
    // Materias asociadas al curso
    materias:[{
        type: Schema.Types.ObjectId,
        ref: 'Materia'
    }]    
},{
    timestamps: true, // Agrega createdAt y updatedAt
    collection: 'cursos'
})

// Método para asignar el nombre del curso basado en nivel y paralelo
cursoSchema.methods.asignarNombre = async function() {
    const cursos = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo']
    this.nombre = `${cursos[this.nivel - 1]} ${this.paralelo}`
    await this.save()
}

// Método para agregar una materia al curso (evita duplicados)
cursoSchema.methods.agregarMaterias = async function(materia){
    const existeMateria = this.materias.includes(materia)
    if(existeMateria)return {error: 'La materia ya está registrada en este curso'}
    this.materias.push(materia)
    await this.save()
}

export default model('Curso', cursoSchema)