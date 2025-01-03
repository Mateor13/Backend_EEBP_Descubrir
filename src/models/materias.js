import { Schema, model } from 'mongoose';

const materiaSchema = new Schema({
    estudiante: {
        type: Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
    },
    cedula: {
        type: String,
        required: true,
        trim: true
    },
    profesor: {
        type: Schema.Types.ObjectId,
        ref: 'Profesor',
        required: true
    },
    nombreEstudiante: {
        type: String,
        required: true
    },
    materias: {
        type: [{
            nombre: {
                type: String,
                required: true
            },
            notas: [{
                motivo: {
                    type: String,
                    required: true
                },
                nota: {
                    type: Number,
                    required: true
                }
            }]
        }],
        default: () => [
            { nombre: 'Lenguaje', notas: [] },
            { nombre: 'Matemáticas', notas: [] },
            { nombre: 'Ciencias Naturales', notas: [] },
            { nombre: 'Estudios Sociales', notas: [] }
        ]
    }
}, {
    timestamps: true,
    collection: 'materias'
});

materiaSchema.methods.crearMateria = async function(nombre) {
    const index = this.materias.findIndex(materia => materia.nombre === nombre);
    if (index !== -1) return { error: 'La materia ya existe' };
    this.materias.push({ nombre, notas: [] });
    await this.save();
};

materiaSchema.methods.agregarNota = async function(nombre, motivo, nota) {
    const index = this.materias.findIndex(materia => materia.nombre === nombre);
    if (index === -1) return { error: 'La materia no existe' };
    const indexMotivo = this.materias[index].notas.findIndex(nota => nota.motivo === motivo);
    if (indexMotivo !== -1) return { error: 'El motivo ya existe' };
    this.materias[index].notas.push({ motivo, nota });
    await this.save();
};

materiaSchema.methods.actualizarNota = async function(nombre, motivo, nuevaNota) {
    const index = this.materias.findIndex(materia => materia.nombre === nombre);
    if (index === -1) return { error: 'La materia no existe' };
    const indexNota = this.materias[index].notas.findIndex(nota => nota.motivo.toString() === motivo);
    if (indexNota === -1) return { error: 'La nota no existe' };
    this.materias[index].notas[indexNota].nota = nuevaNota;
    await this.save();
};

export default model('Materia', materiaSchema)