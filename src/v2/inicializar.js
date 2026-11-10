import bcrypt from 'bcryptjs'
import { todosLosModelos, Usuario } from './infra/db/modelos.js'
import { ROLES } from './shared/roles.js'

// Prepara la BDD v2 al arrancar: crea índices y, si no hay ningún administrador,
// crea el inicial con los datos ADMIN_* del .env (ya confirmado, para poder entrar).
export const inicializarV2 = async () => {
    await Promise.all(todosLosModelos.map(m => m.createCollection().then(() => m.syncIndexes())))
    const hayAdmin = await Usuario.exists({ roles: ROLES.ADMIN, activo: true })
    if (hayAdmin || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return
    const existente = await Usuario.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() })
    if (existente) {
        await Usuario.updateOne({ _id: existente._id }, { $addToSet: { roles: ROLES.ADMIN }, activo: true })
        return
    }
    await Usuario.create({
        nombre: process.env.ADMIN_NAME || 'Administrador',
        apellido: process.env.ADMIN_LASTNAME || 'Principal',
        cedula: process.env.ADMIN_CEDULA || '0000000000',
        email: process.env.ADMIN_EMAIL,
        telefono: process.env.ADMIN_PHONE,
        direccion: process.env.ADMIN_ADDRESS,
        roles: [ROLES.ADMIN],
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
        emailConfirmado: true
    })
    console.log('[v2] Administrador inicial creado')
}
