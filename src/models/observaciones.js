import { Schema, model } from 'mongoose';

const observacionSchema = new Schema({
    observaciones: [{
        fecha: {
            type: String,
            required: true,
            default: function() {
                return date = new Date();
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
    numeroObservaciones: {
        type: Number,
        default: 0
    },
    estudiante: {
        type: Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
    }
}, {
    timestamps: true,
    collection: 'observaciones'
});

observacionSchema.methods.registrarObservacion = async function(observacion) {
    this.observaciones.push(observacion);
    this.numeroObservaciones = this.numeroObservaciones + 1;
    await this.save();
};

export default model('Observacion', observacionSchema);