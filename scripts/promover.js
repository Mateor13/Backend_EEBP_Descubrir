// Ejecuta la promoción de año completa desde la consola, SIN límite de tiempo
// (alternativa a hacerlo desde el panel web en una plataforma con tiempo de respuesta limitado).
//   npm run promocion -- 2024-2025 2025-2026
// Usa MONGODB_URI_PRODUCTION y MONGODB_DB_V2 del .env. Es seguro repetirlo: no duplica matrículas.
await import('../src/config/env.js')
const [nombreOrigen, nombreDestino] = process.argv.slice(2)
if (!nombreOrigen || !nombreDestino) {
    console.error('Uso: npm run promocion -- <periodo origen> <periodo destino>   (ej.: 2024-2025 2025-2026)')
    process.exit(1)
}
const mongoose = (await import('mongoose')).default
const { Periodo } = await import('../src/v2/infra/db/modelos.js')
const { crearContenedor } = await import('../src/v2/contenedor.js')
await mongoose.connect(process.env.MONGODB_URI_PRODUCTION)
try {
    const [origen, destino] = await Promise.all([Periodo.findOne({ nombre: nombreOrigen }), Periodo.findOne({ nombre: nombreDestino })])
    if (!origen || !destino) throw new Error('No se encontró alguno de los periodos indicados')
    const { promocionServicio } = crearContenedor()
    const inicio = Date.now()
    let estado = await promocionServicio.iniciar({ origen: origen._id, destino: destino._id })
    while (estado.estado !== 'completado') {
        estado = await promocionServicio.procesar(origen._id, { presupuestoMs: 5000 })
        console.log(`Avance: ${estado.procesados}/${estado.total} cursos`)
    }
    console.log(`Promoción completada en ${((Date.now() - inicio) / 1000).toFixed(1)} s`, estado.resumen)
} catch (error) {
    console.error('Error:', error.message)
    process.exitCode = 1
} finally {
    await mongoose.disconnect()
}
