import mongoose from 'mongoose'

// La v2 usa OTRA base de datos dentro del mismo clúster (por defecto "descubrir_v2"),
// así v1 y v2 conviven sin pisarse las colecciones. useDb reutiliza la misma conexión física.
export const NOMBRE_BD_V2 = process.env.MONGODB_DB_V2 || 'descubrir_v2'
export const conexionV2 = mongoose.connection.useDb(NOMBRE_BD_V2, { useCache: true })

// Unidad de trabajo: ejecuta varias escrituras como una sola transacción (todo o nada).
// Requiere un replica set (MongoDB Atlas lo es). Los servicios reciben esta función inyectada,
// así en las pruebas se puede reemplazar por una que simplemente ejecute el callback.
export const enTransaccion = (fn) => conexionV2.transaction((session) => fn(session))
