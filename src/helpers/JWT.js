import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const generarJWT = (id, rol) => {
    return jwt.sign({id, rol}, process.env.JWT_SECRET, {expiresIn: '1h'})
}

const verificarAutenticacion = async (req,res,next)=>{
if(!req.headers.authorization) return res.status(404).json({msg:"Lo sentimos, debes proprocionar un token"})    
    const {authorization} = req.headers
    try {
        const {id,rol} = jwt.verify(authorization.split(' ')[1],process.env.JWT_SECRET)
        req.adminBDD = {id,rol}
        next()
    } catch (error) {
        const e = new Error("Formato del token no válido")
        return res.status(404).json({msg:e.message})
    }
}

const verificarRolProfesor = (req,res,next)=>{
    if(req.adminBDD.rol === "profesor") next()
    else return res.status(404).json({msg:"Lo sentimos, no tienes permisos de profesor para realizar esta acción"})
}

const verificarRolAdmin = (req,res,next)=>{
    if(req.adminBDD.rol === "administrador") next()
    else return res.status(404).json({msg:"Lo sentimos, no tienes permisos de administrador para realizar esta acción"})
}
const verificarRolRepresentante = (req,res,next)=>{
    if(req.adminBDD.rol === "representante") next()
    else return res.status(404).json({msg:"Lo sentimos, no tienes permisos para realizar esta acción"})
}

export {
    generarJWT,
    verificarAutenticacion,
    verificarRolProfesor,
    verificarRolAdmin,
    verificarRolRepresentante
}