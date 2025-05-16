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
    }    
}, {
    timestamps: true,
    collection: 'materias'
});

// Método para reemplazar el profesor de la materia
materiaSchema.methods.reemplazar_profesor = async function (profesorActual, nuevoProfesorId) {
    const { _id } = this;
    // Busca la materia por id y profesor actual, y actualiza el profesor asignado
    await this.model('Materia').findOneAndUpdate(
        { _id, profesor: profesorActual },
        { profesor: nuevoProfesorId }
    );
}

export default model('Materia', materiaSchema)