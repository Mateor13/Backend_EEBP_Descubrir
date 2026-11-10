import { Schema, model } from 'mongoose'

// Esquema para el modelo de Año Lectivo
const anioLectivoSchema = new Schema({
    // Periodo académico (ej: "2024-2025")
    periodo: {
        type: String,
        required: true,
        default: function () {
            const fecha = new Date()
            const año = `${fecha.getFullYear()}-${fecha.getFullYear() + 1}`
            return año;
        }
    },
    // Fecha de inicio del periodo
    fechaInicio: {
        type: Date,
        required: true,
        default: function () {
            return new Date()
        }
    },
    // Fecha de fin del periodo ()
    fechaFin: {
        type: Date
    },

    // Estado del periodo (activo/inactivo)
    estado: {
        type: Boolean,
        required: true,
        default: true
    },
    // Ponderaciones para cada tipo de evaluación
    ponderaciones: [{
        _id: false,
        deberes: { type: Number, required: true, default: 0 },
        talleres: { type: Number, required: true, default: 0 },
        examenes: { type: Number, required: true, default: 0 },
        pruebas: { type: Number, required: true, default: 0 }
    }]
}, {
    timestamps: true,
    collection: 'anioLectivo'
})

// Método para terminar el periodo actual (cambia estado y asigna fecha de fin)
anioLectivoSchema.methods.terminarPeriodo = async function () {
    this.estado = false
    this.fechaFin = new Date()
    await this.save()
}

// Método estático para iniciar un nuevo periodo académico
anioLectivoSchema.statics.iniciarPeriodo = async function (session = null) {
    const anioLectivoActivo = await this.findOne({ estado: true }).session(session);
    if (anioLectivoActivo) throw new Error('Todavía existe un periodo activo, debe terminar el actual periodo para empezar otro');
    const [nuevoAnioLectivo] = await this.create([{}], { session });
    return nuevoAnioLectivo;
};

// Método para establecer la fecha de fin del periodo
anioLectivoSchema.methods.establecerFechaFin = async function (fechaFin) {
    if (this.fechaFin) throw new Error('El periodo ya tiene una fecha para terminar');
    this.fechaFin = fechaFin;
    await this.save();
};

// Devuelve las ponderaciones como objeto. En la BDD se guardan como array de un elemento,
// pero el código las leía como objeto (ponderaciones['deberes'] === undefined).
anioLectivoSchema.methods.obtenerPonderaciones = function () {
    const p = Array.isArray(this.ponderaciones) ? this.ponderaciones[0] : this.ponderaciones;
    if (!p) return null;
    return { deberes: p.deberes, talleres: p.talleres, examenes: p.examenes, pruebas: p.pruebas };
};

// Termina el periodo activo si su fecha de fin ya pasó.
// Antes comparaba dos Date con === (compara referencias, nunca es true) y usaba un "res" inexistente.
anioLectivoSchema.statics.terminarFechaFin = async function () {
    const anioLectivoActivo = await this.findOne({ estado: true });
    if (anioLectivoActivo?.fechaFin && anioLectivoActivo.fechaFin.getTime() <= Date.now()) {
        await anioLectivoActivo.terminarPeriodo();
        return true;
    }
    return false;
};

export default model('AnioLectivo', anioLectivoSchema)