import Profesor from "../models/profesor.js"

const crearPassword = async (req, res) => {
    const profesor = new Profesor()
    console.log(await profesor.generarPassword())
    res.status(200).json({msg: 'Password generado correctamente'})
}

export {
    crearPassword
}