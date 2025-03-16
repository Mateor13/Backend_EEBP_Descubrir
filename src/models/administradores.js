import {Schema, model} from 'mongoose'
import bcrypt from 'bcryptjs'
import profesor from './profesor.js'
import representante from './representante.js'

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

administradorSchema.methods.encriptarPassword = async function(password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(password, salt)
}

administradorSchema.methods.compararPassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

administradorSchema.methods.generarToken = async function(){
    const token = Math.random().toString(36).slice(2)
    this.token = token
    return token
}

administradorSchema.statics.inicializarAdmin = async function(){
    const adminExistente = await this.countDocuments({})
    const emailProfesor = await profesor.findOne({email: process.env.ADMIN_EMAIL})
    const emailRepresentante = await representante.findOne({email: process.env.ADMIN_EMAIL})
    
    if (adminExistente === 0 && !emailProfesor && !emailRepresentante) {
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        await this.create({
            nombre: process.env.ADMIN_NAME,
            apellido: process.env.ADMIN_LASTNAME,
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            confirmEmail: true
        });
    }
}

export default model('Administrador', administradorSchema);