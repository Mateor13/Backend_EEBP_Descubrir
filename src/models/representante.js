import { Schema, model } from 'mongoose'
import bcrypt from 'bcryptjs'

// Esquema para el modelo de Representante
const representanteSchema = new Schema({
    // Nombre del representante
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    // Apellido del representante
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    // Email único del representante
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    // Teléfono del representante
    telefono: {
        type: String,
        required: true,
        trim: true
    },
    // Dirección del representante
    direccion: {
        type: String,
        required: true,
        trim: true
    },
    // Contraseña encriptada
    password: {
        type: String,
        required: true,
        trim: true
    },
    // Token para confirmación o recuperación
    token: {
        type: String,
        trim: true,
        default: null
    },
    // Indica si el email fue confirmado
    confirmEmail: {
        type: Boolean,
        default: false
    },
    // Cédula única del representante
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
    // Lista de estudiantes asociados al representante
    estudiantes: [{
        type: Schema.Types.ObjectId,
        ref: 'Estudiante'
    }]
}, {
    timestamps: true,
    collection: 'representantes'
})

// Método para generar un token aleatorio y asignarlo al representante
representanteSchema.methods.generarToken = async function () {
    const token = Math.random().toString(36).slice(2)
    this.token = token
    return token
}

// Método para generar y encriptar una contraseña aleatoria
representanteSchema.methods.generarPassword = async function () {
    const password = Math.random().toString(36).slice(2, 7)
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash('eebpd-' + password, salt)
    return 'eebpd-' + password
};

// Método para comparar una contraseña ingresada con la almacenada
representanteSchema.methods.compararPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Método para asignar un estudiante al representante (evita duplicados)
representanteSchema.methods.asignarEstudiante = async function (estudianteId) {
    const existeEstudiante = this.estudiantes.includes(estudianteId)
    if (existeEstudiante) return { error: 'El estudiante ya está registrado en este representante' }
    this.estudiantes.push(estudianteId)
    await this.save()
}

// Método para encriptar una contraseña proporcionada
representanteSchema.methods.encriptarPassword = async function (password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(password, salt)
}

export default model('Representante', representanteSchema)