import {Schema, model} from 'mongoose'

const asistenciaSchema = new Schema({
    asistencia:[{
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
    }, 
    atraso:{
        type: Boolean,
        default: false
    }
}],
    faltas:{
        type: Number,
        default: 0
    },
    cedula:{
        type: String,
        required: true,
        trim: true        
    },
    estudiante:{
        type: Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
    },
    profesor:{
        type: Schema.Types.ObjectId,
        ref: 'Profesor',
        required: true
    },
    nombreEstudiante:{
        type: String,
        required: true
    }

},{
    timestamps: true,
    collection: 'asistencias'
})

asistenciaSchema.methods.marcarAsistencia = async function(asistencia){
    const fechaActual = new Date();
    const fechaSinHora = (`${fechaActual.getFullYear()} - ${fechaActual.getMonth()+1} - ${fechaActual.getDate()}`);
    const index = this.asistencia.findIndex(asis => asis.fecha === fechaSinHora)
    if(index !== -1) return {error: 'Ya se ha registrado la asistencia'}
    if(!asistencia.presente) {this.faltas = this.faltas + 1}
    this.asistencia.push({presente: asistencia.presente, justificacion: asistencia.justificacion, fecha: fechaSinHora, atraso: asistencia.atraso})
    await this.save()
}

asistenciaSchema.methods.justificarInasistencia = async function(fecha, justificacion){
    const index = this.asistencia.findIndex(asistencia => asistencia.fecha === fecha)
    if(index === -1) return {error: 'La fecha no existe'}
    this.asistencia[index].justificacion = justificacion
    this.asistencia[index].presente = true
    this.asistencia[index].faltas = this.faltas - 1
    await this.save()
}

export default model('Asistencia', asistenciaSchema)