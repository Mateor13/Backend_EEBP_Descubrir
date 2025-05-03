import mongoose, {Schema, model} from 'mongoose'  
import Materias from './materias.js'

const cursoSchema = new Schema({
    nombre:{
        type: String,
        unique: true
    },
    nivel:{
        type:Number,
        enum:[1,2,3,4,5,6,7],
        required:true
    },
    paralelo:{
        type:String,
        required:true,
        enum:['A','B','C','D','E']
    },
    materias:[{
        type: Schema.Types.ObjectId,
        ref: 'Materia'
    }]    
},{
    timestamps: true,
    collection: 'cursos'
})

cursoSchema.methods.asignarNombre = async function() {
const cursos = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo']
this.nombre = `${cursos[this.nivel - 1]} ${this.paralelo}`
await this.save()
}

cursoSchema.methods.agregarMaterias = async function(materia){
    const existeMateria = this.materias.includes(materia)
    if(existeMateria)return {error: 'La materia ya está registrada en este curso'}
    this.materias.push(materia)
    await this.save()
}

cursoSchema.methods.buscarMateriasRegistradas = async function(nombre) {
    const materias = await Materias.find({ _id: { $in: this.materias }, nombre: nombre });
    return materias;
};

export default model('Curso', cursoSchema)