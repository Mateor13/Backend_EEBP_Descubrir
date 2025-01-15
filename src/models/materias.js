import { Schema, model } from 'mongoose';

const materiaSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    profesores: {
        type: Schema.Types.ObjectId,
        ref: 'Profesor',
        required: true
    }    
}, {
    timestamps: true,
    collection: 'materias'
});

export default model('Materia', materiaSchema)