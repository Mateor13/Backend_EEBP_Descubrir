import {Schema, model} from 'mongoose'

const notaSchema = new Schema({
    estudiante:{
        type: Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
    },
    materia:{
        type: Schema.Types.ObjectId,
        ref: 'Materia',
        required: true
    },
    notas:[{
    nota:{
        type: Number,
        required: true
    },
    motivo:{
        type: String,
        required: true
    }
}]
},{
    timestamps: true,
    collection: 'notas'
})

notaSchema.methods.agregarNota = async function(nota, motivo){
    this.notas.push({nota, motivo})
    await this.save()
}

notaSchema.methods.actualizarNota = async function(nota, motivo){
    const index = this.notas.findIndex(nota => nota.motivo === motivo)
    if(index === -1) return {error: 'La nota no existe'}
    this.notas[index].nota = nota
    await this.save()
}

export default model('Nota', notaSchema)