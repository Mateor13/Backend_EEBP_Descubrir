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
        type: String,
        required: true,
        default: function () {
            const fecha = new Date()
            const año = `${fecha.getFullYear()}/${fecha.getMonth() + 1}/${fecha.getDate()}`
            return año;
        }
    },
    // Fecha de fin del periodo
    fechaFin: {
        type: String
    },
    // Estado del periodo (activo/inactivo)
    estado: {
        type: Boolean,
        required: true,
        default: true
    },
    // Ponderaciones para cada tipo de evaluación
    ponderaciones: {
        deberes: {
            type: Number,
            required: true,
            default: 0
        },
        talleres: {
            type: Number,
            required: true,
            default: 0
        },
        examenes: {
            type: Number,
            required: true,
            default: 0
        },
        pruebas: {
            type: Number,
            required: true,
            default: 0
        }
    }
}, {
    timestamps: true,
    collection: 'anioLectivo'
})

// Método para terminar el periodo actual (cambia estado y asigna fecha de fin)
anioLectivoSchema.methods.terminarPeriodo = async function () {
    this.estado = false
    const fechaFin = new Date()
    this.fechaFin = `${fechaFin.getFullYear()}/${fechaFin.getMonth() + 1}/${fechaFin.getDate()}`
    await this.save()
}

// Método estático para iniciar un nuevo periodo académico
anioLectivoSchema.statics.iniciarPeriodo = async function (res) {
    const anioLectivoActivo = await this.findOne({ estado: true });
    const fecha = new Date()
    const año = `${fecha.getFullYear()}-${fecha.getFullYear() + 1}`
    const anioLectivoAnterior = await this.findOne({ periodo: año });
    if (anioLectivoAnterior) return res.status(400).json({ error: `Ya existe un periodo ${año}` });
    if (anioLectivoActivo) return res.status(400).json({ error: 'Todavia existe un periodo activo, debe terminar el actual periodo para empezar otro' });
    const nuevoAnioLectivo = new this();
    await nuevoAnioLectivo.save();
    const anio = {
        periodo: nuevoAnioLectivo.periodo,
        fechaInicio: nuevoAnioLectivo.fechaInicio,
        estado: nuevoAnioLectivo.estado
    }
    return res.status(201).json({ msg: "Año Lectivo iniciado correctamente", anio });
}

// Método para establecer la fecha de fin del periodo
anioLectivoSchema.methods.establecerFechaFin = async function (res, fechaFin) {
    if (this.fechaFin) return res.status(400).json({ error: 'El periodo ya tiene una fecha para terminar' });
    this.fechaFin = fechaFin;
    await this.save();
    return res.status(200).json("Fecha de fin de periodo agregada");
};

// Método estático para terminar el periodo si la fecha de fin coincide con la actual
anioLectivoSchema.statics.terminarFechaFin = async function (res) {
    const anioLectivoActivo = await this.findOne({ estado: true });
    const verificarFechaFin = new Date()
    const fFin = `${verificarFechaFin.getFullYear()}/${verificarFechaFin.getMonth() + 1}/${verificarFechaFin.getDate()}`
    if (anioLectivoActivo?.fechaFin === fFin) {
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