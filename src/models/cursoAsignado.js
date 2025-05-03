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
        const Curso = model('Curso');
        const Nota = model('Nota');

        const cursosAnteriores = await this.find({ anioLectivo: anioLectivoAnteriorId }).populate('curso');
        const notasPorEstudiante = await Nota
            .find({ anioLectivo: anioLectivoAnteriorId })
            .populate('materia', 'nombre')
            .populate('estudiante', 'nombre apellido');

        // Mapear notas por estudiante
        const notasMap = new Map();
        for (const nota of notasPorEstudiante) {
            const id = nota.estudiante._id.toString();
            if (!notasMap.has(id)) notasMap.set(id, []);
            notasMap.get(id).push(nota);
        }

        // Función para crear/obtener un curso
        const obtenerOCrearCurso = async (nivel, paralelo, anioLectivo) => {
            return await Curso.findOneAndUpdate(
                { nivel, paralelo, anioLectivo },
                {},
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        };

        // Crear cursos de nivel 1 si no existen
        const paralelos = ['A', 'B', 'C', 'D', 'E'];
        for (const paralelo of paralelos) {
            await obtenerOCrearCurso(1, paralelo, anioLectivoNuevoId);
        }

        for (const cursoAnterior of cursosAnteriores) {
            const { estudiantes, curso } = cursoAnterior;
            const { nivel, paralelo } = curso;

            const esUltimoNivel = nivel === 7;
            const nivelDestino = esUltimoNivel ? nivel : nivel + 1;

            const cursoDestino = await obtenerOCrearCurso(nivelDestino, paralelo, anioLectivoNuevoId);
            const cursoActual = await obtenerOCrearCurso(nivel, paralelo, anioLectivoNuevoId);

            let cursoAsignadoDestino = await this.findOne({ curso: cursoDestino._id, anioLectivo: anioLectivoNuevoId });
            if (!cursoAsignadoDestino) {
                cursoAsignadoDestino = new this({
                    curso: cursoDestino._id,
                    anioLectivo: anioLectivoNuevoId,
                    estudiantes: []
                });
            }

            let cursoAsignadoActual = await this.findOne({ curso: cursoActual._id, anioLectivo: anioLectivoNuevoId });
            if (!cursoAsignadoActual) {
                cursoAsignadoActual = new this({
                    curso: cursoActual._id,
                    anioLectivo: anioLectivoNuevoId,
                    estudiantes: []
                });
            }

            for (const estudianteId of estudiantes) {
                const idStr = estudianteId.toString();
                const notas = notasMap.get(idStr) || [];
                const reprobado = notas.length === 0 || (nivel > 4 && notas.some(n => n.calcularPromedioGeneral() < 7));

                const yaAsignado = cursoAsignadoDestino.estudiantes.some(id => id.equals(estudianteId)) ||
                                   cursoAsignadoActual.estudiantes.some(id => id.equals(estudianteId));
                if (yaAsignado) continue;

                if (reprobado) {
                    cursoAsignadoActual.estudiantes.push(estudianteId);
                } else {
                    if (!esUltimoNivel) {
                        cursoAsignadoDestino.estudiantes.push(estudianteId);
                    }
                }
            }

            await cursoAsignadoDestino.save();
            await cursoAsignadoActual.save();
        }

        return { mensaje: 'Promoción completada' };

    } catch (error) {
        console.error(`Error promoviendo estudiantes: ${error.message}`);
        return { error: 'Error promoviendo estudiantes' };
    }
};


export default model('CursoAsignado', cursoAsignadoSchema)