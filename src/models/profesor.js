import {Schema, model} from 'mongoose'
import bcrypt from 'bcryptjs';

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
    token:{
        type: String,
        default: null
    },
    confirmEmail:{
        type: Boolean,
        default: false
    },
    admin:{
        type: Schema.Types.ObjectId,
        ref: 'admin'
    },
    cursos:[{
        type: Schema.Types.ObjectId,
        ref: 'curso'
    }],
    cursoAsignado:[{
        type: Schema.Types.ObjectId,
        ref: 'cursoAsignado'
    }],

},{
    timestamps: true,
    collection: 'profesores'
})

//Metodo para comparar la contraseña
profesorSchema.methods.compararPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

profesorSchema.methods.generarPassword = async function () {
    const password = Math.random().toString(36).slice(2, 7)
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash('prof-'+password, salt)
    return 'prof-' + password
};

profesorSchema.methods.generarToken = async function() {
    const token = Math.random().toString(36).slice(2)
    this.token = token
    return token
}

profesorSchema.methods.ingresarCurso = async function(curso) {
    const existeCurso = this.cursos.includes(curso)
    if(existeCurso)return {error: 'El curso ya está registrado'}
    this.cursos.push(curso)
    await this.save()
}

profesorSchema.methods.encriptarPassword = async function(password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(password, salt)
}

export default model('profesor', profesorSchema)