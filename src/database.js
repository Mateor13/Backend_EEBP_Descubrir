import mongoose from 'mongoose'

mongoose.set('strictQuery', true)

const connection = async () => {
  try {
    const uri = process.env.MONGODB_URI_PRODUCTION
    const { connection } = await mongoose.connect(uri)
    console.log(`Conectado a la base de datos: ${connection.host} - ${connection.port}`)
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error)
  }
}

export default connection