import {Schema, model} from 'mongoose'

const observacionSchema = new Schema({
    observaciones:[{
        fecha: {
            type: Date,
            required: true,
            default: Date.now()
        },
        observacion: {
            type: String,
            required: true
        },
        autor: {
            type: String,
            required: true
        }
    }],
    numeroObservaciones:{
        type: Number,
        default: 0
    },
    cedula:{
        type: String,
        required: true,
        trim: true
    },
    nombreEstudiante:{
        type: String,
        required: true
    },
    estudiante:{
        type: Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
    },
    profesor:{
        type: Schema.Types.ObjectId,
        ref: 'Profesor',
        required: true
    }

},{
    timestamps: true,
    collection: 'observaciones'
})

observacionSchema.methods.registrarObservacion = async function(fecha, observacion){
    this.observaciones.push({fecha, observacion})
    this.numeroObservaciones = this.numeroObservaciones + 1
    await this.save()
}

export default model('Observacion', observacionSchema)