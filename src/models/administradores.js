import {Schema, model} from 'mongoose'
import bcrypt from 'bcryptjs'

const administradorSchema = new Schema({
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
},
    {
        timestamps: true,
        collection: 'administradores'
    }
)

administradorSchema.methods.encriptarPassword = async password => {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

administradorSchema.methods.compararPassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

administradorSchema.methods.generarToken = async function(){
    const token = Math.random().toString(36).slice(2)
    return token
}

administradorSchema.methods.validarEmail = async function(email){
    const regExp = new RegExp(/\S+@\S+\.\S+/)
    return regExp.test(email)
}

export default model('Administrador', administradorSchema);