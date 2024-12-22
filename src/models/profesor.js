import mongoose, {Schema, model} from 'mongoose'
import bcrypt from 'bcryptjs'

const profesorSchema = new Schema({
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
    password:{
        type: String,
        required: true,
        trim: true
    },
    telefono:{
        type: String,
        required: true,
        trim: true
    },
    direccion:{
        type: String,
        required: true,
        trim: true
    },
    estado:{
        type: Boolean,
        default: true
    },
    token:{
        type: String,
        default: null
    },
    confirmEmail:{
        type: Boolean,
        default: false
    },
    profesor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'profesor'
    }
},{
    timestamps: true
})

//Metodo para encriptar la contraseña
profesorSchema.methods.encriptarPassword = async password => {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

//Metodo para comparar la contraseña
profesorSchema.methods.compararPassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

profesorSchema.methods.generarPassword = async function() {
    const password = Math.random().toString(36).slice(2,10)
    return `prof-${password}`
}

export default model('profesor', profesorSchema)