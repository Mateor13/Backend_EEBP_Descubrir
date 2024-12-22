import mongoose, { Schema, model } from 'mongoose';

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
    nombreRepresentante: {
        type: String,
        required: true,
        trim: true
    },
    telefonoRepresentante: {
        type: String,
        required: true,
        trim: true
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
        default: [
            { nombre: 'Lenguaje', notas: [] },
            { nombre: 'Matemáticas', notas: [] },
            { nombre: 'Ciencias Naturales', notas: [] },
            { nombre: 'Estudios Sociales', notas: [] }
        ]
    },
    asistencias: [{
        fecha: {
            type: Date,
            required: true,
            default: Date.now()
        },
        presente: {
            type: Boolean,
            default: false
        },
        justificacion: {
            type: Boolean,
            default: false
        }
    }],
    observaciones:[{
        fecha:{
            type: Date,
            required: true
        },
        observacion:{
            type: String,
            required: true
        }
    }],
    representanteId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Representante'
    }
}, {
    timestamps: true,
    collection: 'estudiantes'
});

estudianteSchema.methods.registrarAsistencia = async function (asistencia) {
    this.asistencias.push(asistencia);
    await this.save();
}

estudianteSchema.methods.registrarNota = async function (materia, nota) {
    const materiaIndex = this.materias.findIndex(m => m.nombre === materia);
    if (materiaIndex === -1) return 'La materia no existe';
    this.materias[materiaIndex].notas.push(nota);
    await this.save();
}

estudianteSchema.methods.registrarObservacion = async function (observacion) {
    this.observaciones.push(observacion);
    await this.save();
}

export default model('Estudiante', estudianteSchema);