// Carga las variables de entorno antes que cualquier otro módulo
import './config/env.js'
// Importa la función de conexión a la base de datos
import connection from './database.js'
// Importa la instancia de la aplicación Express
import app from './server.js'
import { inicializarV2 } from './v2/inicializar.js'

// Conecta a la base de datos ANTES de aceptar peticiones (antes no se esperaba la conexión)
await connection()
await inicializarV2().catch(error => console.error('[v2] Error al inicializar:', error.message))

// Inicia el servidor en el puerto configurado y muestra un mensaje en consola
app.listen(app.get('port'), () => {
    console.log(`Servidor local en el puerto ${app.get('port')} está en línea`)
})