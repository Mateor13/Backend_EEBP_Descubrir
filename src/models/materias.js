import { Schema, model } from 'mongoose';

// Esquema para el modelo de Materia
const materiaSchema = new Schema({
    // Nombre de la materia
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    // Referencia al profesor asignado
    profesor: {
        type: Schema.Types.ObjectId,
        ref: 'Profesor',
        required: true
    },
    // Estado de la materia (activa/inactiva)
    estado: {
        type: Boolean,
        default: true
    },
    // Referencia al año lectivo
    anioLectivo: {
        type: Schema.Types.ObjectId,
        ref: 'AnioLectivo',
        required: true
    }
}, {
    timestamps: true,
    collection: 'materias'
});

// Método para reemplazar el profesor de la materia
materiaSchema.methods.reemplazar_profesor = async function (nuevoProfesorId) {
    this.profesor = nuevoProfesorId;
    await this.save();
}

export default model('Materia', materiaSchema)