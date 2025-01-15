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
    correo:{
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
    estudiantes:[{
        type: Schema.Types.ObjectId,
        ref: 'Estudiante'
    }]
},{
    timestamps: true,
    collection: 'representantes'
})

representanteSchema.methods.generarPassword = async function () {
    const password = Math.random().toString(36).slice(2, 7)
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash('eebpd-'+password, salt)
    return 'eebpd-' + password
};

representanteSchema.methods.compararPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

export default model('Representante', representanteSchema)