import { Schema, model } from 'mongoose'

// Esquema de asistencia para estudiantes
const asistenciaSchema = new Schema({
    // Lista de registros de asistencia por fecha
    asistencia: [{
        fecha: {
            type: String,
            required: true
        },
        presente: {
            type: Boolean,
            default: false
        },
        justificacion: {
            type: String,
            trim: true,
            default: ''
        }
    }],
    // Número total de faltas del estudiante
    faltas: {
        type: Number,
        default: 0
    },
    // Referencia al estudiante
    estudiante: {
        type: Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
    },
    // Referencia al año lectivo
    anioLectivo: {
        type: Schema.Types.ObjectId,
        ref: 'AnioLectivo',
        required: true
    }
}, {
    timestamps: true,
    collection: 'asistencias'
})

// Método para marcar la asistencia de un estudiante en la fecha actual
asistenciaSchema.methods.marcarAsistencia = async function (asistencia) {
    const fechaActual = new Date();
    const fechaSinHora = (`${fechaActual.getFullYear()}/${fechaActual.getMonth() + 1}/${fechaActual.getDate()}`);
    // Verifica si ya existe un registro de asistencia para la fecha
    const index = this.asistencia.findIndex(asis => asis.fecha === fechaSinHora)
    if (index !== -1) return { error: 'Ya se ha registrado la asistencia' }
    // Si el estudiante falta, incrementa el contador de faltas
    if (!asistencia.presente) { this.faltas = this.faltas + 1 }
    // Agrega el registro de asistencia
    this.asistencia.push({ presente: asistencia.presente, justificacion: asistencia.justificacion, fecha: fechaSinHora })
    await this.save()
}

// Método para justificar una inasistencia en una fecha específica
asistenciaSchema.methods.justificarInasistencia = async function (fecha, justificacion) {
    // Busca el registro de asistencia por fecha
    const index = this.asistencia.findIndex(asistencia => asistencia.fecha === fecha)
    if (index === -1) return { error: 'La fecha no existe' }
    // Verifica si ya está justificado
    if (this.asistencia[index].justificacion !== "") return { error: 'El estudiante ya está justificado' }
    // No permite justificar si el estudiante estuvo presente
    if (this.asistencia[index].presente) return { error: 'El estudiante está presente' }
    // Justifica la falta y la marca como presente
    this.asistencia[index].justificacion = justificacion
    this.asistencia[index].presente = true
    // Disminuye el contador de faltas si es posible
    if (this.faltas > 0) {
        this.faltas = this.faltas - 1
    }
    await this.save()
}

export default model('Asistencia', asistenciaSchema)