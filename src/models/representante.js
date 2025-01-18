import {Schema, model} from 'mongoose'
import bcrypt from 'bcryptjs'

const representanteSchema = new Schema({
    nombre:{
        type: String,
        required: true,
        trim: true
    }, 
    apellido:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    telefono:{
        type: String,
        required: true,
        trim: true
    },
    password:{
        type: String,
        required: true,
        trim: true
    },
    token:{
        type: String,
        trim: true,
        default: null
    },
    confirmEmail:{
        type: Boolean,
        default: false
    },
    cedula:{
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    estado:{
        type: Boolean,
        default: true
    },
    estudiantes:[{
        type: Schema.Types.ObjectId,
        ref: 'Estudiante'
    }]
},{
    timestamps: true,
    collection: 'representantes'
})

representanteSchema.methods.generarToken = async function () {
    const token = Math.random().toString(36).slice(2)
    this.token = token
    await this.save()
    return token
}

representanteSchema.methods.generarPassword = async function () {
    const password = Math.random().toString(36).slice(2, 7)
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash('eebpd-'+password, salt)
    return 'eebpd-' + password
};

representanteSchema.methods.compararPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

representanteSchema.methods.asignarEstudiante = async function(estudianteId){
    const existeEstudiante = this.estudiantes.includes(estudianteId)
    if(existeEstudiante)return {error: 'El estudiante ya está registrado en este representante'}
    this.estudiantes.push(estudianteId)
    await this.save()
}

representanteSchema.methods.encriptarPassword = async function(password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(password, salt)
    this.save()
}

export default model('Representante', representanteSchema)