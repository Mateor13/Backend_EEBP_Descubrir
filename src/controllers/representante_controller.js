import Representante from "../models/representante.js";
import mongoose from 'mongoose'

const verEstudiantes = async (req, res) => {
    //Paso 1: Obtener el id del representante
    const {id} = req.userBDD
    //Paso 2: Buscar al representante en la base de datos
    const representante = await Representante.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: "estudiantes",
                localField: "estudiantes",
                foreignField: "_id",
                as: "estudiantes"
            }
        },
        {
            $project: {
                _id: 0,
                nombre: 1,
                apellido: 1,
                'estudiantes.nombre': 1,
                'estudiantes.apellido': 1,
                'estudiantes.cedula': 1,
                'estudiantes._id': 1
            }
        }
    ]);
    if(representante.length === 0) return res.status(404).json({error: 'No se encontraron estudiantes registrados'})
    return res.status(200).json(representante)
}

const verNotasEstudiante = async (req, res) => {
    const {id} = req.userBDD
    const {idEstudiante} = req.params
    const representante = await Representante.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: 'estudiantes',
                localField: 'estudiantes',
                foreignField: '_id',
                as: 'estudiantes'
            }
        },
        {
            $unwind: '$estudiantes'
        },
        {
            $match: {
                'estudiantes._id': new mongoose.Types.ObjectId(idEstudiante)
            }
        },
        {
            $lookup: {
                from: 'notas',
                localField: 'estudiantes._id',
                foreignField: 'estudiante',
                as: 'notasDetalle'
            }
        },
        {
            $unwind: '$notasDetalle'
        },
        {
            $lookup: {
                from: 'materias',
                localField: 'notasDetalle.materia',
                foreignField: '_id',
                as: 'materiaDetalle'
            }
        },
        {
            $unwind: '$materiaDetalle'
        },
        {
            $project: {
                _id: 0,
                'estudiantes.nombre': 1,
                'estudiantes.apellido': 1,
                'estudiantes.cedula': 1,
                'notasDetalle.materia': '$materiaDetalle.nombre',
                'notasDetalle.notas': 1
            }
        }
    ]);
    if(representante.length === 0) return res.status(404).json({mensaje: 'No se encontraron notas para el estudiante'})
    return res.status(200).json(representante)
}

const verObservacionesEstudiante = async (req, res) => {
    //Paso 1: Obtener el id del representante
    const {id} = req.userBDD
    const {idEstudiante} = req.params
    //Paso 2: Buscar al representante en la base de datos
    const representante = await Representante.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: 'estudiantes',
                localField: 'estudiantes',
                foreignField: '_id',
                as: 'estudiantes'
            }
        },
        {
            $unwind: '$estudiantes'
        },
        {
            $match: {
                'estudiantes._id': new mongoose.Types.ObjectId(idEstudiante)
            }
        },
        {
            $lookup: {
                from: 'observaciones',
                localField: 'estudiantes._id',
                foreignField: 'estudiante',
                as: 'observacionesDetalle'
            }
        },
        {
            $unwind: '$observacionesDetalle'
        },
        {
            $lookup: {
                from: 'profesores',
                localField: 'observacionesDetalle.observaciones.profesor',
                foreignField: '_id',
                as: 'profesorDetalle'
            }
        },
        {
            $addFields: {
                'observacionesDetalle.observaciones.profesor': {
                    $concat: [
                        { $arrayElemAt: ['$profesorDetalle.nombre', 0] },
                        ' ',
                        { $arrayElemAt: ['$profesorDetalle.apellido', 0] }
                    ]
                }
            }
        },
        {
            $project: {
                _id: 0,
                'estudiantes.nombre': 1,
                'estudiantes.apellido': 1,
                'estudiantes.cedula': 1,
                'observacionesDetalle.observaciones.fecha': 1,
                'observacionesDetalle.observaciones.observacion': 1,
                'observacionesDetalle.observaciones.profesor': 1,
                'observacionesDetalle.numeroObservaciones': 1
            }
        }
    ]);

    if (!representante || representante.length === 0) {
        return res.status(404).json({ error: 'No se encontraron observaciones para el estudiante especificado' });
    }
    // Paso 3: Manipular la BDD
    res.status(200).json({ representante });
}

const verAsistenciaEstudiante = async (req, res) => {
    //Paso 1: Obtener el id del representante
    const {id} = req.userBDD
    const {idEstudiante} = req.params
    //Paso 2: Buscar al representante en la base de datos
    const representante = await Representante.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: 'estudiantes',
                localField: 'estudiantes',
                foreignField: '_id',
                as: 'estudiantes'
            }
        },
        {
            $unwind: '$estudiantes'
        },
        {
            $match: {
                'estudiantes._id': new mongoose.Types.ObjectId(idEstudiante)
            }
        },
        {
            $lookup: {
                from: 'asistencias',
                localField: 'estudiantes._id',
                foreignField: 'estudiante',
                as: 'asistenciasDetalle'
            }
        },
        {
            $unwind: '$asistenciasDetalle'
        },
        {
            $project: {
                _id: 0,
                'estudiantes.nombre': 1,
                'estudiantes.apellido': 1,
                'estudiantes.cedula': 1,
                'asistenciasDetalle.faltas':1,
                'asistenciasDetalle.asistencia':1
            }
        }
    ]);
    return res.status(200).json(representante)
}

export {
    verEstudiantes,
    verNotasEstudiante,
    verObservacionesEstudiante,
    verAsistenciaEstudiante
};