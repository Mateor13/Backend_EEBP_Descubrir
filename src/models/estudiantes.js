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
    if (materiaIndex === -1) return {error:'La materia no existe'};
    this.materias[materiaIndex].notas.push(nota);
    await this.save();
}

estudianteSchema.methods.registrarObservacion = async function (observacion) {
    this.observaciones.push(observacion);
    await this.save();
}

estudianteSchema.methods.actualizarNota = async function (materia, idTrabajo, nuevaNota) {
    const materiaIndex = this.materias.findIndex(m => m.nombre === materia);
    if (materiaIndex === -1) return { error: 'La materia no existe' };
    const notaIndex = this.materias[materiaIndex].notas.findIndex(n => n._id.toString() === idTrabajo);
    if (notaIndex === -1) {
        return { error: 'Nota no encontrada' };
    } else {
        this.materias[materiaIndex].notas[notaIndex].nota = nuevaNota;
    }
    await this.save();
    return { msg: 'Nota actualizada correctamente' };
};

export default model('Estudiante', estudianteSchema);