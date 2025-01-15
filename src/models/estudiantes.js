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
    curso:{
        type: String,
        required: true,
        trim: true
    },
    numeroObservaciones:{
        type: Number,
        default: 0
    },
    representante:[{
        type:Schema.Types.ObjectId,
        ref:'Representante'
    }],
    notas:[{
        type:Schema.Types.ObjectId,
        ref:'Nota'
    }],
    observaciones:[{
        type:Schema.Types.ObjectId,
        ref:'Observacion'
    }],
    
}, {
    timestamps: true,
    collection: 'estudiantes'
});

estudianteSchema.methods.asignarRepresentante = async function (representanteId) {
    if (this.representante.includes(representanteId)) {
        return { error: 'El representante ya está asignado' };
    }
    this.representante.push(representanteId);
    await this.save();
}

export default model('Estudiante', estudianteSchema);