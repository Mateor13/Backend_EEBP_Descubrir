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
notaSchema.statics.copiarEvaluacionesDeCurso = async function({ materiaId, anioLectivo, estudiantes }) {
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
notaSchema.methods.completarEvidenciaDesdeOtros = async function(tipo, descripcion, materiaId, anioLectivo) {
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

// Guardar la url de la imagen de evidencia de una evaluación
notaSchema.methods.guardarEvidencia = async function (tipo, descripcion, url) {
    // Verifica si ya existe una evaluación con esa descripción
    const existe = this.evaluaciones[tipo].find(e => e.descripcion === descripcion);
    if (existe) {
        return { error: 'Ya existe una evidencia con esa descripción' };
    }
    this.evaluaciones[tipo].push({ descripcion, evidenciaUrl: url });
    await this.save();
};

export default model('Nota', notaSchema);