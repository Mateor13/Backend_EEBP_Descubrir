// Carga única de variables de entorno (antes se repetía en 3 archivos silenciando console.log).
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

// Falla rápido si falta una variable imprescindible, en vez de fallar más tarde con un error confuso
const requeridas = ['MONGODB_URI_PRODUCTION', 'JWT_SECRET']
const faltantes = requeridas.filter(nombre => !process.env[nombre])
if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno obligatorias: ${faltantes.join(', ')}`)
}
