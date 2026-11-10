import { Schema, model } from 'mongoose';

// Esquema para almacenar observaciones de estudiantes
const observacionSchema = new Schema({
    // Lista de observaciones realizadas al estudiante
    observaciones: [{
        _id: false,
        fecha: {
            type: String,
            required: true,
            // Por defecto, la fecha actual en formato D/M/AAAA (igual que el controlador).
            // Antes usaba una variable "date" no declarada (ReferenceError en módulos ES).
            default: function () {
                const date = new Date();
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
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
    // Número total de observaciones registradas
    numeroObservaciones: {
        type: Number,
        default: 0
    },
    // Referencia al estudiante
    estudiante: {
        type: Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
    },
    // Referencia al año lectivo
    anioLectivo: {
        type: Schema.Types.ObjectId,
        ref: 'AnioLectivo',
        required: true
    }
}, {
    timestamps: true,
    collection: 'observaciones'
});

// Método para registrar una nueva observación
observacionSchema.methods.registrarObservacion = async function (observacion) {
    this.observaciones.push(observacion);
    this.numeroObservaciones = this.numeroObservaciones + 1;
    await this.save();
};

export default model('Observacion', observacionSchema);