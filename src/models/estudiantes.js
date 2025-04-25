import { Schema, model } from 'mongoose';

const estudianteSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    cedula: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    estado: {
        type: Boolean,
        default: true
    },
    cursoAsignado: {
        type: Schema.Types.ObjectId,
        ref: 'CursoAsignado'
    }
}, {
    timestamps: true,
    collection: 'estudiantes'
});

export default model('Estudiante', estudianteSchema);