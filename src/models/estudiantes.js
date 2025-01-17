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
    observaciones:[{
        type:Schema.Types.ObjectId,
        ref:'Observacion'
    }],
    
}, {
    timestamps: true,
    collection: 'estudiantes'
});

export default model('Estudiante', estudianteSchema);