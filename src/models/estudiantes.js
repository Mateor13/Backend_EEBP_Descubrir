import { Schema, model } from 'mongoose';

// Esquema para el modelo de Estudiante
const estudianteSchema = new Schema({
    // Nombre del estudiante
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    // Apellido del estudiante
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    // Cédula única del estudiante
    cedula: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    // Estado del estudiante (activo/inactivo)
    estado: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true, // Agrega campos createdAt y updatedAt
    collection: 'estudiantes' // Nombre de la colección en MongoDB
});

export default model('Estudiante', estudianteSchema);