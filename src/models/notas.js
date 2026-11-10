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
                min: 0,
                max: 10,
                required: false
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
                min: 0,
                max: 10,
                required: false
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
                min: 0,
                max: 10,
                required: false
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
                min: 0,
                max: 10,
                required: false
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

const TIPOS_EVALUACION = ['deberes', 'talleres', 'examenes', 'pruebas'];

// Promedio simple de las evaluaciones de un tipo que ya tienen nota.
// Las evaluaciones creadas solo con evidencia (sin nota) se ignoran; antes sumaban "undefined" y daban NaN.
function promedioSimple(evaluaciones = []) {
    const calificadas = evaluaciones.filter(e => typeof e.nota === 'number');
    if (calificadas.length === 0) return null;
    return calificadas.reduce((acc, e) => acc + e.nota, 0) / calificadas.length;
}

// Calcula el promedio ponderado de un tipo de evaluación (deberes, talleres, etc.)
notaSchema.methods.calcularPromedioPorTipo = async function (tipo) {
    if (!TIPOS_EVALUACION.includes(tipo)) throw new Error('Tipo de evaluación no válido');
    const promedio = promedioSimple(this.evaluaciones[tipo]);
    if (promedio === null) return 0;
    const anioLectivo = await model('AnioLectivo').findById(this.anioLectivo);
    const ponderacion = anioLectivo?.obtenerPonderaciones()?.[tipo];
    if (ponderacion == null) throw new Error(`No hay ponderación para tipo ${tipo}`);
    return promedio * (ponderacion / 100);
};

// Calcula el promedio general ponderado (síncrono: recibe las ponderaciones ya cargadas).
// - Solo cuentan los tipos que tienen al menos una nota; el resultado se normaliza con la suma
//   de los pesos usados, así un tipo sin evaluaciones no "resta" puntos.
// - Si el año no tiene ponderaciones configuradas (todas en 0), todos los tipos pesan igual.
notaSchema.methods.calcularPromedioGeneral = function (ponderaciones) {
    const totalConfigurado = TIPOS_EVALUACION.reduce((acc, t) => acc + (Number(ponderaciones?.[t]) || 0), 0);
    let suma = 0;
    let pesoUsado = 0;
    for (const tipo of TIPOS_EVALUACION) {
        const promedio = promedioSimple(this.evaluaciones?.[tipo]);
        if (promedio === null) continue;
        const peso = totalConfigurado > 0 ? (Number(ponderaciones[tipo]) || 0) : 1;
        suma += promedio * peso;
        pesoUsado += peso;
    }
    return pesoUsado === 0 ? 0 : suma / pesoUsado;
};

// Determina si la materia está reprobada (promedio general < 7)
notaSchema.methods.esMateriaReprobada = function (ponderaciones) {
    return this.calcularPromedioGeneral(ponderaciones) < 7;
};

// Agrega una nueva nota a un tipo de evaluación, evitando duplicados por descripción
notaSchema.methods.agregarNota = async function (tipo, nota, descripcion) {
    // Buscar si existe una evaluación con la misma descripción
    const existeNota = this.evaluaciones[tipo].find(e => e.descripcion === descripcion);
    if (existeNota) {
        // Si ya tiene nota, rechaza
        if (existeNota.nota !== undefined && existeNota.nota !== null) {
            return { error: 'La nota ya existe' };
        }
        // Si no tiene nota, asígnala
        existeNota.nota = nota;
        await this.save();
        return;
    }
    // Si no existe, agrega una nueva
    this.evaluaciones[tipo].push({ nota, descripcion });
    await this.save();
};

// Copia la estructura de evaluaciones y evidencias de otros estudiantes del curso
notaSchema.statics.copiarEvaluacionesDeCurso = async function ({ materiaId, anioLectivo, estudiantes }) {
    // Buscar notas existentes en otros estudiantes del curso para esta materia
    const otrasNotas = await this.find({
        materia: materiaId,
        anioLectivo,
        estudiante: { $in: estudiantes }
    });

    if (otrasNotas.length === 0) return {};

    const evaluacionesPorTipo = {};
    for (const notaDoc of otrasNotas) {
        for (const tipo of Object.keys(notaDoc.evaluaciones || {})) {
            for (const evaluacion of notaDoc.evaluaciones[tipo]) {
                if (!evaluacionesPorTipo[tipo]) evaluacionesPorTipo[tipo] = [];
                const yaExiste = evaluacionesPorTipo[tipo].some(e => e.descripcion === evaluacion.descripcion);
                if (!yaExiste) {
                    evaluacionesPorTipo[tipo].push({
                        descripcion: evaluacion.descripcion,
                        evidenciaUrl: evaluacion.evidenciaUrl || null
                    });
                }
            }
        }
    }
    return evaluacionesPorTipo;
};

// Busca la evidencia de tipo y descripción en otros documentos y la agrega si no existe o está vacía
notaSchema.methods.completarEvidenciaDesdeOtros = async function (tipo, descripcion, materiaId, anioLectivo) {
    // Busca la evaluación correspondiente en el documento actual
    const evaluacion = this.evaluaciones[tipo]?.find(e => e.descripcion === descripcion);
    // Si ya tiene una evidencia válida, no hace nada
    if (evaluacion && evaluacion.evidenciaUrl && evaluacion.evidenciaUrl !== '' && evaluacion.evidenciaUrl !== null && evaluacion.evidenciaUrl !== undefined) {
        return { msg: 'Ya tiene evidencia' };
    }
    // Busca en TODOS los documentos de la misma materia y año lectivo
    const otrasNotas = await this.constructor.find({
        materia: materiaId,
        anioLectivo,
        _id: { $ne: this._id } // Excluye el documento actual
    });
    // Busca la evidencia en cualquier documento
    let evidenciaUrlEncontrada = null;
    for (const otraNota of otrasNotas) {
        const otraEvaluacion = otraNota.evaluaciones[tipo]?.find(e => e.descripcion === descripcion && e.evidenciaUrl);
        if (otraEvaluacion && otraEvaluacion.evidenciaUrl) {
            evidenciaUrlEncontrada = otraEvaluacion.evidenciaUrl;
            break;
        }
    }
    if (evidenciaUrlEncontrada) {
        if (evaluacion) {
            evaluacion.evidenciaUrl = evidenciaUrlEncontrada;
        } else {
            this.evaluaciones[tipo].push({
                descripcion,
                evidenciaUrl: evidenciaUrlEncontrada
            });
        }
        await this.save();
        return { msg: 'Evidencia agregada desde otro documento' };
    }
    return { error: 'No se encontró evidencia en otros documentos' };
};

// Actualiza la nota de una evaluación existente por descripción
notaSchema.methods.actualizarNota = async function (tipo, nota, descripcion) {
    const existeNota = this.evaluaciones[tipo].find(e => e.descripcion === descripcion);
    if (!existeNota) {
        this.evaluaciones[tipo].push({ nota, descripcion });
    } else {
        existeNota.nota = nota;
    }
    await this.save();
};

export default model('Nota', notaSchema);