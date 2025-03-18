import {Schema, model} from 'mongoose'

const anioLectivoSchema = new Schema({
    periodo: {
        type: String, 
        required: true,
        default: function(){
            const fecha = new Date()
            const año = `${fecha.getFullYear()}-${fecha.getFullYear()+1}`
            return año;
        }
    },
    fechaInicio: {
        type: String,
        required: true,
        default: function(){
            const fecha = new Date()
            const año = `${fecha.getFullYear()}/${fecha.getMonth()+1}/${fecha.getDate()}`
            return año;
        }
    },
    fechaFin: {
        type: String
    },
    estado: {
        type: Boolean,
        required: true,
        default: true
    },
    cursos: [{
        type: Schema.Types.ObjectId,
        ref: 'Curso'
    }]
},{
    timestamps: true,
    collection: 'anioLectivo'
})

anioLectivoSchema.methods.agregarCurso = async function(cursoId){
    this.cursos.push(cursoId)
    await this.save()
}

anioLectivoSchema.methods.terminarPeriodo = async function(){
    this.estado = false
    const fechaFin = new Date()
    this.fechaFin = `${fechaFin.getFullYear()}/${fechaFin.getMonth()+1}/${fechaFin.getDate()}`
    await this.save()
}

anioLectivoSchema.statics.iniciarPeriodo = async function(res){
    const anioLectivoActivo = await this.findOne({ estado: true });
    const fecha = new Date()
    const año = `${fecha.getFullYear()}-${fecha.getFullYear()+1}`
    const anioLectivoAnterior = await this.findOne({ periodo: año });
    if (anioLectivoAnterior) return res.status(400).json({ error: `Ya existe un periodo ${año}` });
    if (anioLectivoActivo) return res.status(400).json({ error: 'Todavia existe un periodo activo, debe terminar el actual periodo para empezar otro' });
    const nuevoAnioLectivo = new this();
    await nuevoAnioLectivo.save();
    const anio = {
        periodo: nuevoAnioLectivo.periodo,
        fechaInicio: nuevoAnioLectivo.fechaInicio,
        estado: nuevoAnioLectivo.estado}
    return res.status(201).json({msg:"Año Lectivo iniciado correctamente", anio});
}

anioLectivoSchema.methods.establecerFechaFin = async function(res, fechaFin) {
    if (this.fechaFin) return res.status(400).json({ error: 'El periodo ya tiene una fecha para terminar' });
    this.fechaFin = fechaFin;
    await this.save();
    return res.status(200).json("Fecha de fin de periodo agregada");
};

anioLectivoSchema.statics.terminarFechaFin = async function(res){
    const anioLectivoActivo = await this.findOne({ estado: true });
    const verificarFechaFin = new Date()
    const fFin = `${verificarFechaFin.getFullYear()}/${verificarFechaFin.getMonth()+1}/${verificarFechaFin.getDate()}`
    if (anioLectivoActivo?.fechaFin === fFin) {
        await anioLectivoActivo.terminarPeriodo();
        return res.status(200).json("Periodo terminado");
    }
}

anioLectivoSchema.methods.comprobarAnio = async function(res){
    if (!this.estado) {
        return res.status(400).json({ error: 'El periodo ya ha terminado, no se puede hacer ningún cambio' });
    }
}

export default model('AnioLectivo', anioLectivoSchema)