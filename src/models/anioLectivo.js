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
anioLectivoSchema.statics.iniciarPeriodo = async function () {
    const anioLectivoActivo = await this.findOne({ estado: true });
    if (anioLectivoActivo) throw new Error('Todavía existe un periodo activo, debe terminar el actual periodo para empezar otro');
    // const fecha = new Date();
    // const anio = `${fecha.getFullYear()}-${fecha.getFullYear() + 1}`;
    // const anioLectivoAnterior = await this.findOne({ periodo: anio });
    // if (anioLectivoAnterior) throw new Error(`Ya existe un periodo ${anio}`);
    const nuevoAnioLectivo = new this();
    await nuevoAnioLectivo.save();
    return nuevoAnioLectivo;
};

// Método para establecer la fecha de fin del periodo
anioLectivoSchema.methods.establecerFechaFin = async function (fechaFin) {
    if (this.fechaFin) throw new Error('El periodo ya tiene una fecha para terminar');
    this.fechaFin = fechaFin;
    await this.save();
};

// Método estático para terminar el periodo si la fecha de fin coincide con la actual
anioLectivoSchema.statics.terminarFechaFin = async function (res) {
    const anioLectivoActivo = await this.findOne({ estado: true });
    const fechaActual = new Date()
    if (anioLectivoActivo?.fechaFin === fechaActual) {
        await anioLectivoActivo.terminarPeriodo();
        return res.status(200).json("Periodo terminado");
    }
}

// Método para comprobar si el periodo está activo antes de realizar cambios
anioLectivoSchema.methods.comprobarAnio = async function (res) {
    if (!this.estado) {
        return res.status(400).json({ error: 'El periodo ya ha terminado, no se puede hacer ningún cambio' });
    }
}

export default model('AnioLectivo', anioLectivoSchema)