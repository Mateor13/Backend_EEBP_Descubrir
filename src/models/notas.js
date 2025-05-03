import { Schema, model } from 'mongoose';

const notaSchema = new Schema({
    estudiante: {
        type: Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
    },
    materia: {
        type: Schema.Types.ObjectId,
        ref: 'Materia',
        required: true
    },
    anioLectivo: {
        type: Schema.Types.ObjectId,
        ref: 'AnioLectivo',
        required: true
    },
    evaluaciones: {
        deberes: [{
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
            }
        }],
        talleres: [{
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
            }
        }],
        examenes: [{
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
            }
        }],
        pruebas: [{
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
            }
        }]
    }
}, {
    timestamps: true,
    collection: 'notas'
});

notaSchema.methods.calcularPromedioPorTipo = async function (tipo) {
    const tiposValidos = ['deberes', 'talleres', 'examenes', 'pruebas'];
    if (!tiposValidos.includes(tipo)) throw new Error('Tipo de evaluación no válido');

    if (!this.evaluaciones[tipo] || this.evaluaciones[tipo].length === 0) return 0;

    const suma = this.evaluaciones[tipo].reduce((acc, evaluation) => acc + evaluation.nota, 0);
    const promedio = suma / this.evaluaciones[tipo].length;

    // Obtener ponderaciones del año lectivo
    const anioLectivo = await model('AnioLectivo').findById(this.anioLectivo);
    if (!anioLectivo || !anioLectivo.ponderaciones || !anioLectivo.ponderaciones[tipo]) {
        throw new Error(`No se encontraron ponderaciones para el tipo ${tipo}`);
    }
    return promedio * (anioLectivo.ponderaciones[tipo] / 100);
};

notaSchema.methods.calcularPromedioGeneral = async function () {
    const tipos = ['deberes', 'talleres', 'examenes', 'pruebas'];
    let sumaTotal = 0;

    for (const tipo of tipos) {
        if (this.evaluaciones[tipo] && this.evaluaciones[tipo].length > 0) {
            const promedioPorTipo = await this.calcularPromedioPorTipo(tipo);
            sumaTotal += promedioPorTipo;
        }
    }

    return sumaTotal;
};

notaSchema.methods.agregarNota = async function (tipo, nota, descripcion) {
    const tiposValidos = ['deberes', 'talleres', 'examenes', 'pruebas'];
    if (!tiposValidos.includes(tipo)) throw new Error('Tipo de evaluación no válido');
    if (nota < 0 || nota > 10) throw new Error('La nota debe estar entre 0 y 10');

    const existeNota = this.evaluaciones[tipo].find(e => e.descripcion === descripcion);
    if (existeNota) throw new Error('La nota ya existe');

    this.evaluaciones[tipo].push({ nota, descripcion });
    await this.save();
};

notaSchema.methods.actualizarNota = async function (tipo, nota, descripcion) {
    const tiposValidos = ['deberes', 'talleres', 'examenes', 'pruebas'];
    if (!tiposValidos.includes(tipo)) throw new Error('Tipo de evaluación no válido');
    if (nota < 0 || nota > 10) throw new Error('La nota debe estar entre 0 y 10');

    const existeNota = this.evaluaciones[tipo].find(e => e.descripcion === descripcion);
    if (!existeNota) throw new Error('La nota no existe');

    existeNota.nota = nota;
    await this.save();
};

export default model('Nota', notaSchema)