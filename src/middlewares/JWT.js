import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const generarJWT = (id, rol, anio) => {
    return jwt.sign({id, rol, anio}, process.env.JWT_SECRET, {expiresIn: '1h'})
}

const verificarAutenticacion = async (req,res,next)=>{
if(!req.headers.authorization) return res.status(404).json({error:"Lo sentimos, debes proprocionar un token"})    
    const {authorization} = req.headers
    try {
        const {id,rol, anio} = jwt.verify(authorization.split(' ')[1],process.env.JWT_SECRET)
        req.userBDD = {id,rol, anio}
        next()
    } catch (error) {
        const e = new Error("Formato del token no válido")
        return res.status(404).json({error:e.message})
    }
}

const verificarRolProfesor = (req,res,next)=>{
    if(req.userBDD.rol === "profesor") next()
    else return res.status(404).json({error:"Lo sentimos, no tienes permisos de profesor para realizar esta acción"})
}

const verificarRolAdmin = (req,res,next)=>{
    if(req.userBDD.rol === "administrador") next()
    else return res.status(404).json({error:"Lo sentimos, no tienes permisos de administrador para realizar esta acción"})
}
const verificarRolRepresentante = (req,res,next)=>{
    if(req.userBDD.rol === "representante") next()
    else return res.status(404).json({error:"Lo sentimos, no tienes permisos para realizar esta acción"})
}

export {
    generarJWT,
    verificarAutenticacion,
    verificarRolProfesor,
    verificarRolAdmin,
    verificarRolRepresentante
}