import {Schema, model} from 'mongoose'

const observacionSchema = new Schema({
    observaciones:[{
        fecha: {
            type: String,
            required: true,
            default: function(){
                const date = new Date()
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
            }
        },
        observacion: {
            type: String,
            required: true
        },
        profesor: {
            type: Schema.Types.ObjectId,
            ref: 'Profesor',
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