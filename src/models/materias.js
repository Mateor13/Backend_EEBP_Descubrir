import { Schema, model } from 'mongoose';

const materiaSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    profesor: {
        type: Schema.Types.ObjectId,
        ref: 'Profesor',
        required: true
    }    
}, {
    timestamps: true,
    collection: 'materias'
});

materiaSchema.methods.reemplazar_profesor = async function (profesorActual, nuevoProfesorId) {
    // Paso 1: Obtener los datos
    const { _id } = this;
    // Paso 2: Manipular la BDD
    await this.model('Materia').findOneAndUpdate(
        { _id, profesor: profesorActual },
        { profesor: nuevoProfesorId }
    );
}

export default model('Materia', materiaSchema)