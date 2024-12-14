import {Schema, model} from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new Schema({
    nombre:{
        required: true,
        type: String
    },
    apellido:{
        required: true,
        type: String
    },
    email:{
        required: true,
        type: String,
        unique: true
    },
    password:{
        required: true,
        type: String
    },
    confirmEmail:{
        default: false,
        type: Boolean
    },
    token:{
        default: null,
        type: String
    },
    estado:{
        default: true,
        type: Boolean
    }
})

adminSchema.methods.encriptarPassword = async password => {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

adminSchema.methods.compararPassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

adminSchema.methods.generarToken = async function(){
    const token = await Math.random().toString(36).slice(2)
    this.token = token
}

export default model('Administrador', adminSchema)