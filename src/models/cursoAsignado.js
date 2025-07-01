import { Schema, model } from 'mongoose'

// Esquema para la asignación de cursos a estudiantes en un año lectivo
const cursoAsignadoSchema = new Schema({
    // Referencia al curso
    curso: {
        type: Schema.Types.ObjectId,
        ref: 'Curso'
    },
    // Referencia al año lectivo
    anioLectivo: {
        type: Schema.Types.ObjectId,
        ref: 'AnioLectivo'
    },
    // Estado del curso asignado (activo, inactivo)
    estado: {
        type: Boolean,
        default: true
    },
    // Lista de estudiantes asignados al curso
    estudiantes: [{
        type: Schema.Types.ObjectId,
        ref: 'Estudiante'
    }],
    // Materias asignadas al curso
    materias: [{
        type: Schema.Types.ObjectId,
        ref: 'Materia'
    }],
    // Fecha en la que se realizó la asignación
    fechaAsignacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'cursosAsignados'
})

// Método para agregar una materia al curso (evita duplicados)
cursoAsignadoSchema.methods.agregarMaterias = async function (materia) {
    this.materias.push(materia)
    await this.save()
}

// Método para agregar un estudiante al curso asignado
cursoAsignadoSchema.methods.agregarEstudiante = async function (estudianteId) {
    this.estudiantes.push(estudianteId)
    await this.save()
}

// Método para eliminar un estudiante del curso asignado
cursoAsignadoSchema.methods.eliminarEstudiante = async function (estudianteId) {
    this.estudiantes = this.estudiantes.filter(id => id.toString() !== estudianteId.toString())
    await this.save()
}

// Método para obtener los estudiantes asignados (con populate)
cursoAsignadoSchema.methods.buscarEstudiantes = async function () {
    return await this.populate('estudiantes')
}

// Agrupa notas por estudiante en un Map
function agruparNotasPorEstudiante(notas) {
    const notasMap = new Map();
    for (const nota of notas) {
        const id = nota.estudiante._id.toString();
        if (!nota.estudiante.estado) continue;
        if (!notasMap.has(id)) notasMap.set(id, []);
        notasMap.get(id).push(nota);
    }
    return notasMap;
}

// Crea o actualiza un curso por nivel y paralelo
async function obtenerOCrearCurso(nivel, paralelo, Curso) {
    const cursos = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo'];
    const nombre = `${cursos[nivel - 1]} ${paralelo}`;
    return await Curso.findOneAndUpdate(
        { nivel, paralelo },
        { nivel, paralelo, nombre },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
}

// Clona materias del curso anterior
async function crearMateriasDelCursoAnterior(materiasAnt, anioLectivoNuevoId, Materia) {
    const nuevas = [];
    for (const materia of materiasAnt) {
        let existente = await Materia.findOne({
            nombre: materia.nombre,
            profesor: materia.profesor,
            anioLectivo: anioLectivoNuevoId,
            estado: true
        });
        if (!existente) {
            existente = new Materia({
                nombre: materia.nombre,
                profesor: materia.profesor,
                anioLectivo: anioLectivoNuevoId,
                estado: true
            });
            await existente.save();
        }
        nuevas.push(existente._id);
    }
    return nuevas;
}

// Evalúa si el estudiante aprueba o repite, y genera operaciones bulk
function asignarEstudiantes(estudiantes, nivel, esUltimoNivel, notasMap, cursoAsignadoDestino, cursoAsignadoActual, anioLectivoNuevoId) {
    const estudiantesARepetir = [];
    const estudiantesAPromover = [];
    const observacionesBulk = [];
    const asistenciasBulk = [];

    for (const estudianteId of estudiantes) {
        const idStr = estudianteId.toString();
        const notas = notasMap.get(idStr) || [];
        if (!notasMap.has(idStr)) continue;

        const reprobado = (nivel > 4 && notas.length === 0) ||
            (nivel > 4 && notas.some(n => n.esMateriaReprobada && n.esMateriaReprobada()));

        const yaAsignado = cursoAsignadoDestino.estudiantes.some(id => id.equals(estudianteId)) ||
            cursoAsignadoActual.estudiantes.some(id => id.equals(estudianteId));
        if (yaAsignado) continue;

        const bulkOp = {
            updateOne: {
                filter: { estudiante: estudianteId, anioLectivo: anioLectivoNuevoId },
                update: {},
                upsert: true,
            }
        };
        observacionesBulk.push(bulkOp);
        asistenciasBulk.push(bulkOp);

        if (reprobado) {
            estudiantesARepetir.push(estudianteId);
        } else if (!esUltimoNivel) {
            estudiantesAPromover.push(estudianteId);
        }
    }

    return { estudiantesARepetir, estudiantesAPromover, observacionesBulk, asistenciasBulk };
}

// Método estático para promover estudiantes de un año lectivo a otro
cursoAsignadoSchema.statics.promoverEstudiantesPorNivel = async function (anioLectivoAnteriorId, anioLectivoNuevoId) {
    try {
        const Curso = model('Curso');
        const Nota = model('Nota');
        const Observacion = model('Observacion');
        const Asistencia = model('Asistencia');
        const Materia = model('Materia');

        const cursosAnteriores = await this.find({ anioLectivo: anioLectivoAnteriorId }).populate('curso');
        const notasPorEstudiante = await Nota.find({ anioLectivo: anioLectivoAnteriorId })
            .populate('estudiante', 'estado');

        const notasMap = agruparNotasPorEstudiante(notasPorEstudiante);

        // Asegura cursos nivel 1
        const paralelos = ['A', 'B', 'C', 'D', 'E'];
        await Promise.all(
            paralelos.map(async (paralelo) => {
                const curso = await obtenerOCrearCurso(1, paralelo, Curso);
                return this.findOneAndUpdate(
                    { curso: curso._id, anioLectivo: anioLectivoNuevoId },
                    { curso: curso._id, anioLectivo: anioLectivoNuevoId, estudiantes: [] },
                    { upsert: true, new: true }
                );
            })
        );

        for (const cursoAnterior of cursosAnteriores) {
            const { estudiantes, curso } = cursoAnterior;
            const { nivel, paralelo } = curso;
            const esUltimoNivel = nivel === 7;
            const nivelDestino = esUltimoNivel ? nivel : nivel + 1;

            const cursoDestino = await obtenerOCrearCurso(nivelDestino, paralelo, Curso);
            const cursoActual = await obtenerOCrearCurso(nivel, paralelo, Curso);

            // Obtener cursoAsignado destino y actual
            let cursoAsignadoDestino = await this.findOne({ curso: cursoDestino._id, anioLectivo: anioLectivoNuevoId }) || new this({
                curso: cursoDestino._id, anioLectivo: anioLectivoNuevoId, estudiantes: []
            });

            let cursoAsignadoActual = await this.findOne({ curso: cursoActual._id, anioLectivo: anioLectivoNuevoId }) || new this({
                curso: cursoActual._id, anioLectivo: anioLectivoNuevoId, estudiantes: []
            });

            // Obtener materias del curso anterior completo
            const cursoAnteriorCompleto = await this.findById(cursoAnterior._id).populate('materias');
            const materiasAnt = cursoAnteriorCompleto.materias;

            // Copiar materias al curso actual (mismo nivel) en el nuevo año lectivo
            if (!cursoAsignadoActual.materias || cursoAsignadoActual.materias.length === 0) {
                const nuevasMateriasActual = await crearMateriasDelCursoAnterior(materiasAnt, anioLectivoNuevoId, Materia);
                cursoAsignadoActual.materias = nuevasMateriasActual;
                await cursoAsignadoActual.save();
            }

            // Copiar materias al curso destino SOLO si ya existía en el año anterior
            if (!esUltimoNivel) {
                // Verificar si el curso destino ya existía en el año anterior
                const cursoDestinoAnterior = await this.findOne({ 
                    curso: cursoDestino._id, 
                    anioLectivo: anioLectivoAnteriorId 
                }).populate('materias');

                // Solo copiar materias si el curso destino ya existía Y tenía materias
                if (cursoDestinoAnterior && cursoDestinoAnterior.materias && cursoDestinoAnterior.materias.length > 0) {
                    if (!cursoAsignadoDestino.materias || cursoAsignadoDestino.materias.length === 0) {
                        const materiasDestino = await crearMateriasDelCursoAnterior(cursoDestinoAnterior.materias, anioLectivoNuevoId, Materia);
                        cursoAsignadoDestino.materias = materiasDestino;
                        await cursoAsignadoDestino.save();
                    }
                }
                // Si no existía, el curso destino queda sin materias
            }

            const { estudiantesARepetir, estudiantesAPromover, observacionesBulk, asistenciasBulk } =
                asignarEstudiantes(estudiantes, nivel, esUltimoNivel, notasMap, cursoAsignadoDestino, cursoAsignadoActual, anioLectivoNuevoId);

            if (estudiantesARepetir.length) {
                cursoAsignadoActual.estudiantes.push(...estudiantesARepetir);
                await cursoAsignadoActual.save();
            }

            if (estudiantesAPromover.length) {
                cursoAsignadoDestino.estudiantes.push(...estudiantesAPromover);
                await cursoAsignadoDestino.save();
            }

            if (observacionesBulk.length) await Observacion.bulkWrite(observacionesBulk);
            if (asistenciasBulk.length) await Asistencia.bulkWrite(asistenciasBulk);
        }

        return { mensaje: 'Promoción completada' };
    } catch (error) {
        console.error('Error promoviendo estudiantes:', error);
        return { error: error.message };
    }
};

export default model('CursoAsignado', cursoAsignadoSchema)