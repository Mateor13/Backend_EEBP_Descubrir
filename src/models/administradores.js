import { Schema, model } from 'mongoose'
import bcrypt from 'bcryptjs'
import profesor from './profesor.js'
import representante from './representante.js'

// Esquema para el modelo de Administrador
const administradorSchema = new Schema({
    // Nombre del administrador
    nombre: {
        required: true,
        type: String
    },
    // Apellido del administrador
    apellido: {
        required: true,
        type: String
    },
    // Email único del administrador
    email: {
        required: true,
        type: String,
        unique: true
    },
    // Cédula única del administrador
    cedula: {
        required: true,
        type: String,
        unique: true
    },
    // Teléfono del administrador
    telefono: {
        required: true,
        type: String
    },
    // Contraseña encriptada
    password: {
        required: true,
        type: String
    },
    // Dirección del administrador
    direccion: {
        required: true,
        type: String
    },
    // Indica si el email fue confirmado
    confirmEmail: {
        default: false,
        type: Boolean
    },
    // Token para confirmación o recuperación
    token: {
        default: null,
        type: String
    },
    // Estado de la cuenta (activo/inactivo)
    estado: {
        default: true,
        type: Boolean
    }
},
    {
        timestamps: true, // Agrega createdAt y updatedAt
        collection: 'administradores'
    }
)

// Método para encriptar una contraseña proporcionada
administradorSchema.methods.encriptarPassword = async function (password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(password, salt)
}

// Método para comparar una contraseña ingresada con la almacenada
administradorSchema.methods.compararPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// Método para generar un token aleatorio y asignarlo al administrador
administradorSchema.methods.generarToken = async function () {
    const token = Math.random().toString(36).slice(2)
    this.token = token
    return token
}

// Método para generar y encriptar una contraseña aleatoria
administradorSchema.methods.generarPassword = async function () {
    const password = Math.random().toString(36).slice(2, 7)
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash('admin-' + password, salt)
    return 'admin-' + password
}

// Método estático para inicializar el administrador principal si no existe
administradorSchema.statics.inicializarAdmin = async function () {
    // Cuenta la cantidad de administradores existentes
    const adminExistente = await this.countDocuments({})
    // Busca si el email del admin ya existe en profesores
    const emailProfesor = await profesor.findOne({ email: process.env.ADMIN_EMAIL })
    // Busca si el email del admin ya existe en representantes
    const emailRepresentante = await representante.findOne({ email: process.env.ADMIN_EMAIL })

    // Si no existe ningún admin y el email no está en profesores ni representantes, crea el admin inicial
    if (adminExistente === 0 && !emailProfesor && !emailRepresentante) {
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        await this.create({
            nombre: process.env.ADMIN_NAME,
            apellido: process.env.ADMIN_LASTNAME,
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            cedula: process.env.ADMIN_CEDULA,
            telefono: process.env.ADMIN_PHONE,
            direccion: process.env.ADMIN_ADDRESS,
            confirmEmail: true
        });
        console.log('Administrador inicial creado exitosamente');
    }
    const anioLectivo = await this.model('AnioLectivo').countDocuments({})
    // Si no existe ningún año lectivo, crea el año lectivo inicial
    if (anioLectivo === 0) {
        await this.model('AnioLectivo').create({});
    }
}

export default model('Administrador', administradorSchema);