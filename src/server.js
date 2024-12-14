//Requerir los modulos
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import adminRouter from './routers/admin_routes.js'

//inicializadores
const app = express()
dotenv.config()

//Configuraciones
app.set('port', process.env.PORT || 3000)
app.use(cors())

//middleware
app.use(express.json())

//Rutas
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Escuela Descubrir</title>
        </head>
        <body>
            <p>Server ON</p>
        </body>
        </html>
    `);
});

app.use('/api', adminRouter)

// Exportar la instancia de express por medio de app
export default app