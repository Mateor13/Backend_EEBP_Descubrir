import connection from './database.js'
import app from './server.js'

connection()

app.listen(app.get('port'),()=>{
    console.log(`Servidor local en el puerto ${app.get('port')} está en línea`)
})