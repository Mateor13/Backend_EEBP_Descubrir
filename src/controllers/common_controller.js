import representante from "../models/representante.js";
import profesor from "../models/profesor.js";
import administradores from "../models/administradores.js";
import aniosLectivo from "../models/anioLectivo.js";
import { generarJWT } from "../middlewares/JWT.js";
import { sendMailToChangeEmail, sendMailToRecoveryPassword, sendMailToRecoveryPasswordProfesor, sendMailToRecoveryPasswordRepresentante } from "../config/nodemailer.js";

// Lista de roles con su modelo, nombre, función de correo y campos a excluir en consultas
const roles = [
    { model: representante, rol: "representante", correo: sendMailToRecoveryPasswordRepresentante, selected: '-_id -password -token -estudiantes -confirmEmail -estado -__v -createdAt -updatedAt' },
    { model: profesor, rol: "profesor", correo: sendMailToRecoveryPasswordProfesor, selected: '-_id -password -token -confirmEmail -admin -cursos -estado -__v -createdAt -updatedAt' },
    { model: administradores, rol: "administrador", correo: sendMailToRecoveryPassword, selected: '-_id -password -token -confirmEmail -estado -__v -createdAt -updatedAt' }
]

// Devuelve el modelo correspondiente al rol recibido
const rolActual = (rol) => {
    const rolModelo = roles.find(r => r.rol === rol)
    return rolModelo
}

// Controlador para login: genera token y responde con datos básicos
const login = async (req, res) => {
    try{
    let { email } = req.body;
    const { password } = req.body;
    const { anioLectivoBDD } = req;
    email = email.toLowerCase().trim();
    const resultados = await Promise.all(
        roles.map(async ({ model, rol }) => {
            return model.findOne(
                { email },
                { email: 1, confirmEmail: 1, estado: 1, password: 1 }
            ).then(userBDD => userBDD ? { userBDD, rol } : null);
        })
    );
    const resultado = resultados.find(res => res !== null);
    if (!resultado) return res.status(400).json({ error: 'Credenciales incorrectas' });
    const { userBDD, rol: userRol } = resultado;
    if (!userBDD.confirmEmail) return res.status(400).json({ error: 'Por favor confirme su cuenta' });
    if (!userBDD.estado) return res.status(400).json({ error: 'Su cuenta ha sido desactivada, por favor contacte al administrador' });
    const verificarPassword = await userBDD.compararPassword(password);
    if (!verificarPassword) return res.status(400).json({ error: 'Credenciales incorrectas' });
    const token = generarJWT(userBDD._id, userRol, anioLectivoBDD._id);
    return res.status(200).json({ rol: userRol, token });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

// Lista todos los años lectivos registrados
const listarAniosLectivos = async (req, res) => {
    const anios = await aniosLectivo.find().select('-__v -createdAt -updatedAt -ponderaciones -fechaInicio')
    if (!anios || anios.length === 0) return res.status(200).json({ error: 'No se encontraron años lectivos' });
    return res.status(200).json(anios)
};

// Confirma la cuenta de usuario a partir del token recibido
const confirmarCuenta = async (req, res) => {
    const { token } = req.params;
    try {
        // Buscar el usuario en paralelo en todos los modelos
        const resultados = await Promise.all(
            roles.map(({ model }) => model.findOne({ token }))
        );
        // Filtrar el resultado para encontrar el usuario
        const usuarioBDD = resultados.find(user => user !== null);
        if (!usuarioBDD) {
            return res.status(400).json({ error: 'El token no es válido' });
        }
        // Confirmar el email y guardar los cambios
        usuarioBDD.confirmEmail = true;
        await usuarioBDD.save();
        return res.status(200).json({ mensaje: 'La cuenta se ha confirmado exitosamente, ya puede iniciar sesión' });
    } catch (error) {
        return res.status(500).json({ error: 'Error interno al procesar la solicitud' });
    }
};

// Envía correo de recuperación de contraseña según el rol
const recuperarPassword = async (req, res) => {
    let { email } = req.body;
    email = email.toLowerCase().trim();
    try {
        // Buscar el usuario en paralelo en todos los modelos
        const resultados = await Promise.all(
            roles.map(({ model }) => model.findOne({ email }))
        );
        // Filtrar el resultado para encontrar el usuario
        const usuarioBDD = resultados.find(user => user !== null);
        if (!usuarioBDD) {
            return res.status(400).json({ error: 'No se ha encontrado el email ingresado' });
        }
        // Generar el token y enviar el correo
        const token = await usuarioBDD.generarToken();
        const rolModelo = roles.find(r => r.model === usuarioBDD.constructor);
        await rolModelo.correo(email, token);
        // Guardar el usuario con el nuevo token
        await usuarioBDD.save();
        return res.status(200).json({ mensaje: 'Para recuperar su contraseña, se le ha enviado un correo' });
    } catch (error) {
        return res.status(500).json({ error: 'Error interno al procesar la solicitud' });
    }
};

// Devuelve el perfil del usuario autenticado (sin datos sensibles)
const perfil = async (req, res) => {
        const { id, rol } = req.userBDD;
    try {
        const rolModelo = rolActual(rol);
        // Realizar la consulta directamente en el modelo correspondiente
        const usuarioBDD = await rolModelo.model.findById(id).select(rolModelo.selected);
        if (!usuarioBDD) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Construir la respuesta con los datos necesarios
        const userBDD = {
            _id: usuarioBDD._id,
            nombre: usuarioBDD.nombre,
            apellido: usuarioBDD.apellido,
            email: usuarioBDD.email,
            telefono: usuarioBDD.telefono,
            direccion: usuarioBDD.direccion,
            rol
        };
        return res.status(200).json(userBDD);
    } catch (error) {
        return res.status(500).json({ error: 'Error al cargar el perfil' });
    }
}

// Permite establecer una nueva contraseña usando un token válido
const nuevaContrasena = async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    try {
        // Buscar el usuario en paralelo en todos los modelos
        const usuarioBDD = await Promise.any(
            roles.map(({ model }) => model.findOne({ token }))
        );
        if (!usuarioBDD) {
            return res.status(400).json({ error: 'El token no es válido' });
        }
        // Actualizar la contraseña y eliminar el token
        usuarioBDD.token = null;
        await usuarioBDD.encriptarPassword(password);
        await usuarioBDD.save();
        return res.status(200).json({ mensaje: 'La contraseña ha sido actualizada exitosamente' });
    } catch (error) {
        return res.status(400).json({ error: 'El token no es válido' });
    }
}

// Permite cambiar la contraseña desde el perfil autenticado
const cambiarPassword = async (req, res) => {
    const { password, newPassword } = req.body
    const { id, rol } = req.userBDD
    const rolModelo = rolActual(rol)
    const userBDD = await rolModelo.model.findById(id);
    if (userBDD) {
        const verificarPassword = await userBDD.compararPassword(password);
        if (!verificarPassword) return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
        await userBDD.encriptarPassword(newPassword);
        await userBDD.save();
        return res.status(200).json({ mensaje: 'La contraseña ha sido actualizada exitosamente' });
    }
    return res.status(400).json({ error: 'Error al actualizar el usuario' });
}

// Permite cambiar los datos personales del usuario autenticado
const cambiarDatos = async (req, res) => {
    const { nombre, apellido, telefono, direccion } = req.body;
    let { email } = req.body;
    const { id, rol } = req.userBDD;
    const rolModelo = rolActual(rol);
    try {
        // Buscar el usuario actual
        const userBDD = await rolModelo.model.findById(id);
        if (!userBDD) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const promesas = [];
        // Verificar si el email ha cambiado
        if (userBDD.email !== email) {
            email = email.toLowerCase().trim();
            promesas.push(
                Promise.all(
                    roles.map(({ model }) => model.findOne({ email }).select('_id'))
                ).then(resultados => {
                    const existeEmail = resultados.some(res => res !== null);
                    if (existeEmail) {
                        throw new Error('El email ya está registrado');
                    }
                })
            );
            promesas.push(sendMailToChangeEmail(userBDD.email, email));
        }
        // Verificar si el teléfono ha cambiado
        if (userBDD.telefono !== telefono) {
            promesas.push(
                Promise.all(
                    roles.map(({ model }) => model.findOne({ telefono }).select('_id'))
                ).then(resultados => {
                    const existeTelefono = resultados.some(res => res !== null);
                    if (existeTelefono) {
                        throw new Error('El teléfono ya está registrado');
                    }
                })
            );
        }
        // Actualizar los datos del usuario
        userBDD.telefono = telefono;
        userBDD.direccion = direccion;
        userBDD.nombre = nombre;
        userBDD.apellido = apellido;
        userBDD.email = email;
        // Ejecutar todas las promesas en paralelo
        await Promise.all(promesas);
        await userBDD.save();
        return res.status(200).json({ mensaje: 'Los datos se han actualizado correctamente' });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }
};

export {
    login,
    listarAniosLectivos,
    confirmarCuenta,
    recuperarPassword,
    nuevaContrasena,
    cambiarPassword,
    cambiarDatos,
    perfil
}