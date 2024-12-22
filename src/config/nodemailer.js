import nodemailer from "nodemailer"
import dotenv from 'dotenv'
dotenv.config()

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.HOST_MAILTRAP,
    port: process.env.PORT_MAILTRAP,
    auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
    }
});

const sendMailToUser = (userMail, token) => {
    let mailOptions = {
        from: process.env.USER_MAILTRAP,
        to: userMail,
        subject: "Verificar cuenta",
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
        <h1 style="color: #4CAF50;">Bienvenido a Escuela Descubrir</h1>
        <br>
        <p>Hola,</p>
        <p>Gracias por registrarte en nuestra plataforma. Estamos encantados de tenerte con nosotros.</p>
        <p>Para confirmar tu cuenta, por favor haz clic en el siguiente enlace:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_BACKEND}confirmar/${encodeURIComponent(token)}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verificar cuenta</a>
        </p>
        <br>
        <p>Si no te has registrado en nuestra plataforma, por favor ignora este correo.</p>
        <p>Saludos cordiales,</p>
        <p><strong>Equipo de Escuela Descubrir</strong></p>
        <footer style="text-align: center; color: #777; margin-top: 20px;">
            <p>Escuela Descubrir</p>
            <p>&copy; ${new Date().getFullYear()} Escuela Descubrir. Todos los derechos reservados.</p>
        </footer>
    </div>       
        `
    };
    

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Correo enviado: ' + info.response);
        }
    });
};

const sendMailToRecoveryPassword = async(userMail,token)=>{
    let info = await transporter.sendMail({
    from: 'admin@vet.com',
    to: userMail,
    subject: "Correo para el reestablecimiento de contraseña",
    html: `
    <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
        <h1 style="color: #4CAF50;">Sistema de Gestión de Notas Escuela Descubrir</h1>
        <br>
        <p>Hola,</p>
        <p>Has solicitado un cambio de contraseña. Para reestablecer tu contraseña, por favor haz clic en el siguiente enlace:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_BACKEND}recuperar/${encodeURIComponent(token)}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reestablecer tu contraseña</a>
        </p>
        <br>
        <p>Si no has solicitado este cambio, por favor ignora este correo.</p>
        <p>Saludos cordiales,</p>
        <p><strong>Equipo de Escuela Descubrir</strong></p>
        <footer style="text-align: center; color: #777; margin-top: 20px;">
            <p>Escuela Descubrir</p>
            <p>&copy; ${new Date().getFullYear()} Escuela Descubrir. Todos los derechos reservados.</p>
        </footer>
    </div>
    `
    });
    console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}



export {
    sendMailToUser,
    sendMailToRecoveryPassword
}