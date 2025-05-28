import { Schema, model } from 'mongoose';

// Esquema para almacenar las notas de un estudiante en una materia y año lectivo
const notaSchema = new Schema({
    // Referencia al estudiante
    estudiante: {
        type: Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
    },
    // Referencia a la materia
    materia: {
        type: Schema.Types.ObjectId,
        ref: 'Materia',
        required: true
    },
    // Referencia al año lectivo
    anioLectivo: {
        type: Schema.Types.ObjectId,
        ref: 'AnioLectivo',
        required: true
    },
    // Evaluaciones agrupadas por tipo: deberes, talleres, exámenes, pruebas
    evaluaciones: {
        deberes: [{
            _id: false,
            nota: {
                type: Number,
                required: true,
                min: 0,
                max: 10
            },
            descripcion: {
                type: String,
                required: true
            },
            // Fecha de la evaluación (por defecto, fecha actual)
            fecha: {
                type: String,
                default: function () {
                    const date = new Date();
                    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                }
            },
            evidenciaUrl: {
                type: String,
                default: null
            }
        }],
        talleres: [{
            _id: false,
            nota: {
                type: Number,
                required: true,
                min: 0,
                max: 10
            },
            descripcion: {
                type: String,
                required: true
            },
            fecha: {
                type: String,
                default: function () {
                    const date = new Date();
                    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                }
            },
            evidenciaUrl: {
                type: String,
                default: null
            }
        }],
        examenes: [{
            _id: false,
            nota: {
                type: Number,
                required: true,
                min: 0,
                max: 10
            },
            descripcion: {
                type: String,
                required: true
            },
            fecha: {
                type: String,
                default: function () {
                    const date = new Date();
                    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                }
            },
            evidenciaUrl: {
                type: String,
                default: null
            }
        }],
        pruebas: [{
            _id: false,
            nota: {
                type: Number,
                required: true,
                min: 0,
                max: 10
            },
            descripcion: {
                type: String,
                required: true
            },
            fecha: {
                type: String,
                default: function () {
                    const date = new Date();
                    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                }
            },
            evidenciaUrl: {
                type: String,
                default: null
            }
        }]
    }
}, {
    timestamps: true,
    collection: 'notas'
});

// Calcula el promedio ponderado de un tipo de evaluación (deberes, talleres, etc.)
notaSchema.methods.calcularPromedioPorTipo = async function (tipo) {
    const tiposValidos = ['deberes', 'talleres', 'examenes', 'pruebas'];
    if (!tiposValidos.includes(tipo)) throw new Error('Tipo de evaluación no válido');

    const evaluaciones = this.evaluaciones[tipo];
    if (!evaluaciones || evaluaciones.length === 0) return 0;

    const suma = evaluaciones.reduce((acc, evalObj) => acc + evalObj.nota, 0);
    const promedio = suma / evaluaciones.length;

    const anioLectivo = await model('AnioLectivo').findById(this.anioLectivo);
    const ponderacion = anioLectivo?.ponderaciones?.[tipo];
    if (ponderacion == null) throw new Error(`No hay ponderación para tipo ${tipo}`);

    return promedio * (ponderacion / 100);
};

// Determina si la materia está reprobada (promedio general < 7)
notaSchema.methods.esMateriaReprobada = async function () {
    const promedio = await this.calcularPromedioGeneral();
    return promedio < 7;
};

// Calcula el promedio general ponderado de todas las evaluaciones
notaSchema.methods.calcularPromedioGeneral = async function () {
    const tipos = ['deberes', 'talleres', 'examenes', 'pruebas'];
    let sumaTotal = 0;

    const anioLectivo = await model('AnioLectivo').findById(this.anioLectivo);
    for (const tipo of tipos) {
        const evaluaciones = this.evaluaciones[tipo];
        const ponderacion = anioLectivo.ponderaciones[tipo];

        if (evaluaciones && evaluaciones.length > 0 && ponderacion != null) {
            const suma = evaluaciones.reduce((acc, evalObj) => acc + evalObj.nota, 0);
            const promedio = suma / evaluaciones.length;
            sumaTotal += promedio * (ponderacion / 100);
        }
    }

    return sumaTotal;
};

// Agrega una nueva nota a un tipo de evaluación, evitando duplicados por descripción
notaSchema.methods.agregarNota = async function (tipo, nota, descripcion) {
    const existeNota = this.evaluaciones[tipo].find(e => e.descripcion === descripcion);
    if (existeNota) return ({ error: 'La nota ya existe' });

    this.evaluaciones[tipo].push({ nota, descripcion });
    await this.save();
};

// Actualiza la nota de una evaluación existente por descripción
notaSchema.methods.actualizarNota = async function (tipo, nota, descripcion) {
    const existeNota = this.evaluaciones[tipo].find(e => e.descripcion === descripcion);
    if (!existeNota) throw new Error('La nota no existe');
    existeNota.nota = nota;
    await this.save();
};

export default model('Nota', notaSchema);