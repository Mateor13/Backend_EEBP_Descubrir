import { Schema, model } from 'mongoose'
import bcrypt from 'bcryptjs'
import { generarTokenSeguro, generarPasswordTemporal } from '../utils/seguridad.js';

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
    // Fecha de expiración del token de recuperación (null = sin expiración, p. ej. confirmación de cuenta)
    tokenExpira: {
        type: Date,
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
        ref: 'Administrador'
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
    const password = generarPasswordTemporal('prof')
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(password, salt)
    return password
};

// Método para generar un token aleatorio
profesorSchema.methods.generarToken = async function () {
    const token = generarTokenSeguro()
    this.token = token
    return token
}

// Método para encriptar una contraseña proporcionada
profesorSchema.methods.encriptarPassword = async function (password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(password, salt)
}

export default model('Profesor', profesorSchema)