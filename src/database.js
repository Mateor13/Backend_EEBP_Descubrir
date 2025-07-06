import mongoose from 'mongoose'
import admin from './models/administradores.js'
import anioLectivo from './models/anioLectivo.js'

// Configura Mongoose para usar consultas estrictas
mongoose.set('strictQuery', true)

// Función para conectar a la base de datos MongoDB
const connection = async () => {
  try {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      console.log('Usando conexión existente a MongoDB');
      return;
    }
    // Obtiene la URI de conexión desde las variables de entorno
    const uri = process.env.MONGODB_URI_PRODUCTION
    // Realiza la conexión a MongoDB
    const { connection } = await mongoose.connect(uri);
    // Muestra información de conexión en consola
    console.log(`Conectado a la base de datos: ${connection.host} - ${connection.port}`)
    // Inicializa el administrador principal si no existe
    await admin.inicializarAdmin()
    // Finaliza el año lectivo si corresponde
    await anioLectivo.terminarFechaFin()
  } catch (error) {
    // Muestra errores de conexión en consola
    console.error('Error al conectar a la base de datos:', error)
  }
}

// Exporta la función de conexión para ser usada en la app principal
export default connection