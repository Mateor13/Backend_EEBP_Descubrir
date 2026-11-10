import nodemailer from 'nodemailer'

// Implementación real del "puerto" de correo: { enviar({ para, asunto, html }) }.
// En pruebas se inyecta un mailer falso que solo guarda los mensajes.
export const crearMailerNodemailer = () => {
    const transporter = nodemailer.createTransport({
        host: process.env.HOST_MAILTRAP,
        port: Number(process.env.PORT_MAILTRAP) || 465,
        secure: Number(process.env.PORT_MAILTRAP) === 465,
        auth: { user: process.env.USER_MAILTRAP, pass: process.env.PASS_MAILTRAP }
    })
    return {
        enviar: ({ para, asunto, html }) => transporter.sendMail({ from: process.env.USER_MAILTRAP, to: para, subject: asunto, html })
    }
}

// Mailer de desarrollo: muestra los correos en consola en vez de enviarlos
export const crearMailerConsola = () => ({
    enviados: [],
    async enviar(mensaje) {
        this.enviados.push(mensaje)
        if (process.env.NODE_ENV !== 'test') console.info(`[mail] Para: ${mensaje.para} | ${mensaje.asunto}`)
    }
})
