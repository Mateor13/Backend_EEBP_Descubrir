import Representante from "../models/representante.js";
import mongoose from 'mongoose'

const validarEmail = (email) => {
    const regExp = new RegExp(/\S+@\S+\.\S+/)
    return regExp.test(email)
}

const validarCurso = (curso) => {
    const regExp = new RegExp(/^[0-7][A-E]$/)
    return regExp.test(curso)
}
const validarFecha = (fecha) => {
    const regExp = new RegExp(/^\d{4}\/\d\/\d{2}$/);
    return regExp.test(fecha);
};

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
    try {
        // Obtener los parámetros
        const { id } = req.userBDD;
        const { idEstudiante } = req.params;

        // Buscar al representante en la base de datos y obtener las observaciones del estudiante
        const resultado = await Representante.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(id) }
            },
            {
                $lookup: {
                    from: 'estudiantes',
                    localField: 'estudiantes',
                    foreignField: '_id',
                    as: 'estudiantes'
                }
            },
            { $unwind: '$estudiantes' },
            {
                $match: { 'estudiantes._id': new mongoose.Types.ObjectId(idEstudiante) }
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
                $unwind: { path: '$observacionesDetalle', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'profesores',
                    localField: 'observacionesDetalle.profesor',
                    foreignField: '_id',
                    as: 'profesorDetalle'
                }
            },
            {
                $addFields: {
                    'observacionesDetalle.profesor': {
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
                    estudiante: {
                        nombre: '$estudiantes.nombre',
                        apellido: '$estudiantes.apellido',
                        cedula: '$estudiantes.cedula'
                    },
                    observaciones: {
                        fecha: '$observacionesDetalle.fecha',
                        observacion: '$observacionesDetalle.observacion',
                        profesor: '$observacionesDetalle.profesor'
                    }
                }
            }
        ]);

        if (!resultado || resultado.length === 0) {
            return res.status(404).json({ error: 'No se encontraron observaciones para el estudiante especificado' });
        }

        res.status(200).json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las observaciones del estudiante' });
    }
};

const verAsistenciaEstudiante = async (req, res) => {
    try {
        //Paso 1: Obtener el id del representante
        const { id } = req.userBDD;
        const { idEstudiante } = req.params;

        //Paso 2: Buscar al representante en la base de datos y obtener la asistencia del estudiante
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
                $unwind: { path: '$asistenciasDetalle', preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 0,
                    'estudiantes.nombre': 1,
                    'estudiantes.apellido': 1,
                    'estudiantes.cedula': 1,
                    'asistenciasDetalle.faltas': 1,
                    'asistenciasDetalle.asistencia': 1
                }
            }
        ]);

        //Paso 3: Validar si existen registros de asistencia
        if (!representante || representante.length === 0) {
            return res.status(404).json({ error: 'No se encontraron registros de asistencia para el estudiante especificado' });
        }

        //Paso 4: Retornar la respuesta con la información de la asistencia
        return res.status(200).json({ representante });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener la asistencia del estudiante' });
    }
};

export {
    verEstudiantes,
    verNotasEstudiante,
    verObservacionesEstudiante,
    verAsistenciaEstudiante
};