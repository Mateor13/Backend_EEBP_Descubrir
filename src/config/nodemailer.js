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
        <h1 style="color: #82a915;">Bienvenido a Escuela Descubrir</h1>
        <br>
        <p>Hola</p>
        <p>Gracias por registrarte en nuestra plataforma. Estamos encantados de tenerte con nosotros.</p>
        <p>Para confirmar tu cuenta, por favor haz clic en el siguiente enlace:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}confirmar-cuenta/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Verificar cuenta</a>
        </p>
        <br>
        <br>
        <p>Si no te has registrado en nuestra plataforma, por favor ignora este correo.</p>
        <p>Saludos cordiales</p>
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
        <h1 style="color: #82a915;">Sistema de Gestión de Notas Escuela Descubrir</h1>
        <br>
        <p>Hola</p>
        <p>Has solicitado un cambio de contraseña. Para reestablecer tu contraseña, por favor haz clic en el siguiente enlace:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}confirmar-token/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Reestablecer tu contraseña</a>
        </p>
        <br>
        <br>
        <p>Si no has solicitado este cambio, por favor ignora este correo.</p>
        <p>Saludos cordiales</p>
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

const sendMailToProfesor = async (userMail, token, password) => {
    let info = await transporter.sendMail({
        from: 'admin@ued.com',
        to: userMail,
        subject: "Verificar cuenta profesor",
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
        <h1 style="color: #82a915;">Bienvenido a Escuela Descubrir</h1>
        <br>
        <p>Hola</p>
        <p>Haz sido registrado como profesor. Estamos encantados de tenerte con nosotros.</p>
        <p>Estas son tus credenciales de acceso:</p>
        <p><strong>Correo:</strong> ${userMail}</p>
        <p><strong>Contraseña:</strong> ${password}</p>
        <br>
        <p>Para confirmar tu cuenta, por favor haz clic en el siguiente enlace:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}confirmar-cuenta/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Verificar cuenta</a>
        </p>
        <br>
        <br>
        <p>Si no te has registrado en nuestra plataforma, por favor ignora este correo.</p>
        <p>Saludos cordiales</p>
        <p><strong>Equipo de Escuela Descubrir</strong></p>
        <footer style="text-align: center; color: #777; margin-top: 20px;">
            <p>Escuela Descubrir</p>
            <p>&copy; ${new Date().getFullYear()} Escuela Descubrir. Todos los derechos reservados.</p>
        </footer>`

    });
    console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}

const sendMailToRecoveryPasswordProfesor = async(userMail,token)=>{
    let info = await transporter.sendMail({
    from: 'admin@ued.com',
    to: userMail,
    subject: "Correo para el reestablecimiento de contraseña",
    html: `
    <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">

        <h1 style="color: #82a915;">Sistema de Gestión de Notas Escuela Descubrir</h1>
        <br>
        <p>Hola</p>
        <p>Has solicitado un cambio de contraseña. Para reestablecer tu contraseña, por favor haz clic en el siguiente enlace:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}confirmar-token/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Reestablecer tu contraseña</a>
        </p>
        <br>
        <br>
        <p>Si no has solicitado este cambio, por favor ignora este correo.</p>
        <p>Saludos cordiales</p>
        <p><strong>Equipo de Escuela Descubrir</strong></p>
        <footer style="text-align: center; color: #777; margin-top: 20px;">
            <p>Escuela Descubrir</p>
            <p>&copy; ${new Date().getFullYear()} Escuela Descubrir. Todos los derechos reservados.</p>
        </footer>
    </div>`
    });
    console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}

const envioCredenciales = async (nombre, apellido, userMail, password, token) => {
    let info = await transporter.sendMail({
        from: 'info@eebpd.gob.ec',
        to: userMail,
        subject: "Correo con las credenciales de acceso para representantes",
        html:
        `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">

        <h1 style="color: #82a915;">Sistema de Gestión de Notas Escuela Descubrir</h1>
        <br>
        <p>Saludos estimad@ ${nombre} ${apellido}</p>
        <p>Ha sido registrad@ como representante en la Escuela de Educacion Básica Particular Descubrir</p><br>
        <p>Estas son las credenciales de acceso:</p>
        <p><strong>Correo:</strong> ${userMail}</p>
        <p><strong>Contraseña: </strong>${password}</p>
        <br>
        <p>Por favor, ingrese al siguiente enlace para verificar su cuenta:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}confirmar-cuenta/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Verificar cuenta</a>
        </p>
        <br>
        <br>
        <p>Una vez verificada su cuenta, podrá acceder al sistema con las credenciales proporcionadas.</p>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}/login" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Acceder al sistema</a>
        <br>
        <br><br>
        <p>Si ha recibido este correo por error, por favor ignorelo.</p>
        <p>Saludos cordiales</p>
        <p><strong>Equipo de Escuela Descubrir</strong></p>
        <footer style="text-align: center; color: #777; margin-top: 20px;">
            <p>Escuela Descubrir</p>
            <p>&copy; ${new Date().getFullYear()} Escuela Descubrir. Todos los derechos reservados.</p>
        </footer>
    </div>`
    });
    console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}

const estudianteRegistrado = async (userMail, cedula, nombre, apellido) => {
    let info = await transporter.sendMail({
        from: 'info@eebpd.gob.ec',
        to: userMail,
        subject: "Estudiante registrado en la plataforma",
        html:
        `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
        <h1 style="color: #82a915;">Sistema de Gestión de Notas Escuela Descubrir</h1>
        <br>
        <p>Hola</p>
        <p>Ha sido registrado el/la estudiante ${nombre} ${apellido} con C.I: ${cedula} en la Escuela de Educacion Básica Particular Descubrir</p><br>
        <p>El/la cual ha sido asignado a su cuenta como representante</p>
        <br>
        <p>Por favor, ingrese al siguiente enlace para acceder al sistema:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}/login" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Acceder al sistema</a>
        <br>
        <p>Si has recibido este correo por error, por favor ignora este correo.</p>
        <p>Saludos cordiales</p>
        <p><strong>Equipo de Escuela Descubrir</strong></p>
        <footer style="text-align: center; color: #777; margin-top: 20px;">
            <p>Escuela Descubrir</p>
            <p>&copy; ${new Date().getFullYear()} Escuela Descubrir
        </footer>
    </div>`
});
console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}

const sendMailToRecoveryPasswordRepresentante = async (userMail, token) => {
  let info = await transporter.sendMail({
    from:"info@eebpd.edu",
    to: userMail,
    subject: "Correo para el reestablecimiento de contraseña",
    html: `	
    <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
    <h1 style="color: #82a915;">Sistema de Gestión de Notas Escuela Descubrir</h1>
    <br>
    <p>Hola</p>
    <p>Haz solicitado un reestablecimiento de tu contraseña, por favor haz clic en el siguiente enlace:</p><br>
    <p style="text-align: center;">
        <a href="${process.env.URL_PRODUCTION}confirmar-token/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Reestablecer tu contraseña</a>
    </p>
    <br>
    <br>
    <p>Si no haz solicitado este cambio, por favor ignora este correo.</p>
    <p>Saludos cordiales</p>
    <p><strong>Equipo de Escuela Descubrir</strong></p>
    <footer style="text-align: center; color: #777; margin-top: 20px;">
        <p>Escuela Descubrir</p>
        <p>&copy; ${new Date().getFullYear()} Escuela Descubrir. Todos los derechos reservados.</p>
    </footer>
</div>`
  });
  console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}

const sendMailToChangeEmail = async (userMail, newEmail) => {
    let info = await transporter.sendMail({
        from: 'info@eebpd.edu',
        to: userMail,
        subject: "Cambio de correo electrónico",
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
        <h1 style="color: #82a915;">Sistema de Gestión de Notas Escuela Descubrir</h1>
        <br>
        <p>Hola</p>
        <p>Se cambiad correctamente el correo electrónico. Por favor, verifica tu nueva dirección de correo electrónico.</p><br>
        <p><strong>Nuevo correo electrónico:</strong> ${newEmail}</p>
        <br>
        <br>
        <p>Saludos cordiales</p>
        <p><strong>Equipo de Escuela Descubrir</strong></p>
        <footer style="text-align: center; color: #777; margin-top: 20px;">
            <p>Escuela Descubrir</p>
            <p>&copy; ${new Date().getFullYear()} Escuela Descubrir. Todos los derechos reservados.</p>
        </footer>
    </div>`
});
console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}

export {
    sendMailToUser,
    sendMailToRecoveryPassword,
    sendMailToProfesor,
    sendMailToRecoveryPasswordProfesor,
    envioCredenciales,
    estudianteRegistrado,
    sendMailToRecoveryPasswordRepresentante,
    sendMailToChangeEmail
}