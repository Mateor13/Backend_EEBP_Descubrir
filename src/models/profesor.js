import { Schema, model } from 'mongoose'
import bcrypt from 'bcryptjs';

// Esquema para el modelo de Profesor
const profesorSchema = new Schema({
    // Nombre del profesor
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    // Apellido del profesor
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    // Email único del profesor
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    // Contraseña encriptada
    password: {
        type: String,
        required: true,
        trim: true
    },
    // Teléfono del profesor
    telefono: {
        type: String,
        required: true,
        trim: true
    },
    // Dirección del profesor
    direccion: {
        type: String,
        required: true,
        trim: true
    },
    // Cédula única del profesor
    cedula: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    // Estado de la cuenta (activo/inactivo)
    estado: {
        type: Boolean,
        default: true
    },
    // Token para confirmación o recuperación
    token: {
        type: String,
        default: null
    },
    // Indica si el email fue confirmado
    confirmEmail: {
        type: Boolean,
        default: false
    },
    // Referencia al administrador que lo registró
    admin: {
        type: Schema.Types.ObjectId,
        ref: 'admin'
    }
}, {
    timestamps: true,
    collection: 'profesores'
})

// Método para comparar la contraseña ingresada con la almacenada
profesorSchema.methods.compararPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Método para generar y encriptar una contraseña aleatoria
profesorSchema.methods.generarPassword = async function () {
    const password = Math.random().toString(36).slice(2, 7)
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash('prof-' + password, salt)
    return 'prof-' + password
};

// Método para generar un token aleatorio
profesorSchema.methods.generarToken = async function () {
    const token = Math.random().toString(36).slice(2)
    this.token = token
    return token
}

// Método para ingresar un curso al profesor (evita duplicados)
profesorSchema.methods.ingresarCurso = async function (curso) {
    const existeCurso = this.cursos.includes(curso)
    if (existeCurso) return { error: 'El curso ya está registrado' }
    this.cursos.push(curso)
    await this.save()
}

// Método para encriptar una contraseña proporcionada
profesorSchema.methods.encriptarPassword = async function (password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(password, salt)
}

export default model('Profesor', profesorSchema)