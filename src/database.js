import mongoose from 'mongoose'

mongoose.set('strictQuery', true)

const connection = async () => {
  try {
    const uri = process.env.MONGODB_URI_PRODUCTION
    const { connection } = await mongoose.connect(uri)
    console.log(`Database is connected on ${connection.host} - ${connection.port}`)
  } catch (error) {
    console.error('Error connecting to the database:', error)
  }
}

export default connection