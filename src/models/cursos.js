import {Schema, model} from 'mongoose'
import Materias from './materias'

const cursoSchema = new Schema({
    nombre:{
        type: String,
        required: true,
        trim: true,
        unique: true
    }, 
    estudiantes:[{
        type: Schema.Types.ObjectId,
        ref: 'Estudiante'
    }],
    materias:[{
        type: Schema.Types.ObjectId,
        ref: 'Materia'
    }]    
},{
    timestamps: true,
    collection: 'cursos'
})

cursoSchema.methods.agregarEstudiante = async function(estudiante){
    this.estudiantes.push(estudiante)
    await this.save()
}

cursoSchema.methods.agregarMaterias = async function(materia){
    this.materias.push(materia)
    await this.save()
}

cursoSchema.methods.eliminarEstudiante = async function(estudianteId){
    this.estudiantes = this.estudiantes.filter(estudiante => estudiante._id !== estudianteId)
    await this.save()
}

cursoSchema.methods.buscarMateriasRegistradas = async function(nombre) {
    const materias = await Materias.find({ _id: { $in: this.materias }, nombre: nombre });
    return materias;
};

export default model('Curso', cursoSchema)