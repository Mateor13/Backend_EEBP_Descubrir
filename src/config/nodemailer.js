import nodemailer from "nodemailer"
import dotenv from 'dotenv'
// Suprimir logs de dotenv temporalmente
const originalLog = console.log;
console.log = () => {};
dotenv.config()
console.log = originalLog;

// Configuración del transporter de nodemailer para envío de correos
let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.HOST_MAILTRAP,
    port: process.env.PORT_MAILTRAP,
    auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
    }
});

// Envía correo de verificación de cuenta a un usuario (admin)
const sendMailToUser = async (userMail, token, password) => {
    let mailOptions = await transporter.sendMail({
        from: process.env.USER_MAILTRAP,
        to: userMail,
        subject: "Verificar cuenta",
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
        <h1 style="color: #82a915;">Bienvenido a Escuela Descubrir</h1>
        <br>
        <p>Hola</p>
        <p>Gracias por registrarte en nuestra plataforma. Estamos encantados de tenerte con nosotros.</p>
        <p>Estas son tus credenciales de acceso:</p>
        <p><strong>Correo:</strong> ${userMail}</p>
        <p><strong>Contraseña:</strong> ${password}</p>
        <br>
        <p>Para confirmar tu cuenta, por favor Has clic en el siguiente enlace:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}confirmar/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Verificar cuenta</a>
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
    });
};

// Envía correo para recuperación de contraseña (admin)
const sendMailToRecoveryPassword = async (userMail, token) => {
    let info = await transporter.sendMail({
        from: 'admin@vet.com',
        to: userMail,
        subject: "Correo para el reestablecimiento de contraseña",
        html: `
    <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
        <h1 style="color: #82a915;">Sistema de Gestión de Notas Escuela Descubrir</h1>
        <br>
        <p>Hola</p>
        <p>Has solicitado un cambio de contraseña. Para reestablecer tu contraseña, por favor has clic en el siguiente enlace:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}recuperar-password/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Reestablecer tu contraseña</a>
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
}

// Envía correo de verificación de cuenta a un profesor
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
        <p>Has sido registrado como profesor. Estamos encantados de tenerte con nosotros.</p>
        <p>Estas son tus credenciales de acceso:</p>
        <p><strong>Correo:</strong> ${userMail}</p>
        <p><strong>Contraseña:</strong> ${password}</p>
        <br>
        <p>Para confirmar tu cuenta, por favor has clic en el siguiente enlace:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}confirmar/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Verificar cuenta</a>
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
}

// Envía correo para recuperación de contraseña (profesor)
const sendMailToRecoveryPasswordProfesor = async (userMail, token) => {
    let info = await transporter.sendMail({
        from: 'admin@ued.com',
        to: userMail,
        subject: "Correo para el reestablecimiento de contraseña",
        html: `
    <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">

        <h1 style="color: #82a915;">Sistema de Gestión de Notas Escuela Descubrir</h1>
        <br>
        <p>Hola</p>
        <p>Has solicitado un cambio de contraseña. Para reestablecer tu contraseña, por favor has clic en el siguiente enlace:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}recuperar-password/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Reestablecer tu contraseña</a>
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
}

// Envía credenciales y enlace de verificación a un representante
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
        <p>Has sido registrad@ como representante en la Escuela de Educacion Básica Particular Descubrir</p><br>
        <p>Estas son las credenciales de acceso:</p>
        <p><strong>Correo:</strong> ${userMail}</p>
        <p><strong>Contraseña: </strong>${password}</p>
        <br>
        <p>Por favor, ingrese al siguiente enlace para verificar su cuenta:</p><br>
        <p style="text-align: center;">
            <a href="${process.env.URL_PRODUCTION}confirmar/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Verificar cuenta</a>
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
}

// Notifica a un representante que un estudiante ha sido registrado y asignado a su cuenta
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
            <a href="${process.env.URL_PRODUCTION}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Acceder al sistema</a>
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
}

// Envía correo para recuperación de contraseña (representante)
const sendMailToRecoveryPasswordRepresentante = async (userMail, token) => {
    let info = await transporter.sendMail({
        from: "info@eebpd.edu",
        to: userMail,
        subject: "Correo para el reestablecimiento de contraseña",
        html: `	
    <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
    <h1 style="color: #82a915;">Sistema de Gestión de Notas Escuela Descubrir</h1>
    <br>
    <p>Hola</p>
    <p>Has solicitado un reestablecimiento de tu contraseña, por favor has clic en el siguiente enlace:</p><br>
    <p style="text-align: center;">
        <a href="${process.env.URL_PRODUCTION}recuperar-password/${encodeURIComponent(token)}" style="background-color: #82a915; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; cursor:pointer;">Reestablecer tu contraseña</a>
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
}

// Envía correo notificando el cambio de email
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
        <p>Se ha cambiado correctamente el correo electrónico. Por favor, verifica tu nueva dirección de correo electrónico.</p><br>
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