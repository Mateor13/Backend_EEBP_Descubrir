//Requerir los modulos
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

//inicializadores
const app = express()
dotenv.config()

//Configuraciones
app.set('port', process.env.PORT || 3000)
app.use(cors())

//middleware
app.use(express.json())

//Rutas
app.get('/', (req,res)=>{
    res.send("Server on")
})

// Exportar la instancia de express por medio de app
export default app