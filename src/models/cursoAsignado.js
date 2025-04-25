import { Schema, model } from 'mongoose'

const cursoAsignadoSchema = new Schema({
    curso: {
        type: Schema.Types.ObjectId,
        ref: 'Curso'
    },
    anioLectivo: {
        type: Schema.Types.ObjectId,
        ref: 'AnioLectivo'
    },
    estudiantes: [{
        type: Schema.Types.ObjectId,
        ref: 'Estudiante'
    }],
    fechaAsignacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'cursosAsignados'
})

cursoAsignadoSchema.methods.agregarEstudiante = async function (estudianteId) {
    this.estudiantes.push(estudianteId)
    await this.save()
}

cursoAsignadoSchema.methods.buscarEstudiantes = async function () {
    return await this.populate('estudiantes')
}

cursoAsignadoSchema.statics.promoverEstudiantesPorNivel = async function (anioLectivoAnteriorId, anioLectivoNuevoId) {
    try {
        const cursosAnteriores = await this.find({ anioLectivo: anioLectivoAnteriorId }).populate('curso');
        const notasPorEstudiante = await model('Nota')
            .find({ anioLectivo: anioLectivoAnteriorId })
            .populate('materia', 'nombre')
            .populate('estudiante', 'nombre apellido');

        const notasMap = new Map();
        for (const nota of notasPorEstudiante) {
            const id = nota.estudiante._id.toString();
            if (!notasMap.has(id)) notasMap.set(id, []);
            notasMap.get(id).push(nota);
        }

        const reprobadosMap = new Map();
        for (const cursoAnterior of cursosAnteriores) {
            const { estudiantes, curso } = cursoAnterior;
            const { nivel, paralelo } = curso;

            const key = `${nivel}-${paralelo}`;
            const getOrCreateReprobadosGrupo = () => {
                if (!reprobadosMap.has(key)) {
                    reprobadosMap.set(key, { nivel, paralelo, estudiantes: [] });
                }
                return reprobadosMap.get(key);
            };

            if (nivel === 7) {
                for (const estudianteId of estudiantes) {
                    const notas = notasMap.get(estudianteId.toString()) || [];
                    const promedioGeneral = notas.some(n => n.calcularPromedio() < 7);
                    if (promedioGeneral) {
                        const estudiante = notas[0]?.estudiante;
                        getOrCreateReprobadosGrupo().estudiantes.push(`${estudiante.nombre} ${estudiante.apellido}`);
                    }
                }
                continue;
            }

            const nivelSiguiente = nivel + 1;
            const cursoNuevo = await model('Curso').findOneAndUpdate(
                { nivel: nivelSiguiente, paralelo, anioLectivo: anioLectivoNuevoId },
                {},
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            let cursoAsignadoNuevo = await this.findOne({ curso: cursoNuevo._id, anioLectivo: anioLectivoNuevoId });
            if (!cursoAsignadoNuevo) {
                cursoAsignadoNuevo = new this({
                    curso: cursoNuevo._id,
                    anioLectivo: anioLectivoNuevoId,
                    estudiantes: []
                });
            }

            const cursoActual = await model('Curso').findOneAndUpdate(
                { nivel, paralelo, anioLectivo: anioLectivoNuevoId },
                {},
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            let cursoReprobados = await this.findOne({ curso: cursoActual._id, anioLectivo: anioLectivoNuevoId });
            if (!cursoReprobados) {
                cursoReprobados = new this({
                    curso: cursoActual._id,
                    anioLectivo: anioLectivoNuevoId,
                    estudiantes: []
                });
            }

            for (const estudianteId of estudiantes) {
                const idStr = estudianteId.toString();
                const yaAgregado = cursoAsignadoNuevo.estudiantes.includes(estudianteId) || cursoReprobados.estudiantes.includes(estudianteId);
                if (yaAgregado) continue;

                const notas = notasMap.get(idStr) || [];
                let reprobado = false;

                if (nivel > 4) {
                    reprobado = notas.some(n => n.calcularPromedio() < 7);
                }

                if (reprobado) {
                    cursoReprobados.estudiantes.push(estudianteId);
                    const estudiante = notas[0]?.estudiante;
                    if (estudiante) {
                        getOrCreateReprobadosGrupo().estudiantes.push(`${estudiante.nombre} ${estudiante.apellido}`);
                    }
                } else {
                    cursoAsignadoNuevo.estudiantes.push(estudianteId);
                }
            }

            await cursoAsignadoNuevo.save();
            await cursoReprobados.save();
        }

        const reprobados = Array.from(reprobadosMap.values()).map(grupo => ({
            ...grupo,
            estudiantes: grupo.estudiantes.length > 0 ? grupo.estudiantes : ['Ninguno']
        }));

        return { mensaje: 'Promoción completada', reprobados };

    } catch (error) {
        console.error(`Error promoviendo estudiantes: ${error.message}`);
        return { error: 'Error promoviendo estudiantes' };
    }
};

export default model('CursoAsignado', cursoAsignadoSchema)