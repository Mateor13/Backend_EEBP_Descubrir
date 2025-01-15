import Representante from "../models/representante.js";
import { generarJWT } from "../helpers/JWT.js";

const loginRepresentante = async (req, res) => {
    // Paso 1: Toma de datos
    const { email, password } = req.body;
    // Paso 2: Validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (!email) return res.status(400).json({ error: 'Especifique el email' });
    if (!password) return res.status(400).json({ error: 'Especifique una contraseña' });
    const representanteBDD = await Representante.findOne({ correo: email });
    if (!representanteBDD) return res.status(404).json({ error: 'El email no está registrado' });
    const validarPassword = await representanteBDD.compararPassword(password);
    if (!validarPassword) return res.status(400).json({ error: 'Contraseña inválida' });
    // Paso 3: Manipular BDD
    const jwt = generarJWT(representanteBDD._id, 'representante');
    res.status(200).json({ msg: `Bienvenid@ estimad@ ${representanteBDD.nombre} ${representanteBDD.apellido}`, token: jwt });
};

const recuperarContraseña = (req, res) => {
    //Paso 1: Toma de datos
    const {email} = req.body
    //Paso 2: Validaciones
    if(Object.values(req.body).includes(' ')) return res.status(400).json({error: 'Todos los campos son obligatorios'})
    if (!email) return res.status(400).json({error: 'Especifique el email'})
    const representanteBDD = Representante.findOne({correo: email})
    if (!representanteBDD) return res.status(404).json({error: 'El email no está registrado'})
    
}


export {
    loginRepresentante
};