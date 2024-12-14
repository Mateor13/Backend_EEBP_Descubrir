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
        <h1>Escuela Descubrir</h1><hr>
        <p>Gracias por registrarte en nuestra plataforma, para confirmar tu cuenta haz clic en el siguiente enlace:</p><hr>
        <p><a href="${process.env.URL_PRODUCTION}confirmar/${encodeURIComponent(token)}">Verificar cuenta</a></p><hr>
        <footer>Escuela Descubrir</footer>        
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
    <h1>Sistema de Gestión Notas Escuela Descubrir</h1>
    <p>Has solicitado un cambio de contraseña, haz clic en el siguiente enlace para reestablecer tu contraseña:</p>
    <hr>
    <a href=${process.env.URL_PRODUCTION}recuperar/${token}>Reestablecer tu contraseña</a>
    <hr>
    <footer>Escuela Descubrir</footer>
    `
    });
    console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}



export {
    sendMailToUser,
    sendMailToRecoveryPassword
}