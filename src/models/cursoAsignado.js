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
    // Fecha en la que se realizó la asignación
    fechaAsignacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'cursosAsignados'
})

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

// Método estático para promover estudiantes de un año lectivo a otro
cursoAsignadoSchema.statics.promoverEstudiantesPorNivel = async function (anioLectivoAnteriorId, anioLectivoNuevoId) {
    try {
        // Modelos requeridos para la promoción
        const Curso = model('Curso');
        const Nota = model('Nota');
        const Observacion = model('Observacion');
        const Asistencia = model('Asistencia');

        // Obtiene los cursos asignados del año anterior y las notas de los estudiantes
        const cursosAnteriores = await this.find({ anioLectivo: anioLectivoAnteriorId }).populate('curso');
        const notasPorEstudiante = await Nota
            .find({ anioLectivo: anioLectivoAnteriorId })
            .populate('materia', 'nombre')
            .populate('estudiante', 'nombre apellido estado');

        // Mapea las notas por estudiante
        const notasMap = new Map();
        for (const nota of notasPorEstudiante) {
            //Vuelve a string el id del estudiante
            const id = nota.estudiante._id.toString();
            // Verifica si el estudiante está activo
            if (!nota.estudiante.estado) continue;
            // Verifica si el estudiante ya tiene notas, si no, lo inicializa
            if (!notasMap.has(id)) notasMap.set(id, []);
            // Agrega la nota al estudiante
            notasMap.get(id).push(nota);
        }

        // Función auxiliar para obtener o crear un curso por nivel y paralelo
        const obtenerOCrearCurso = async (nivel, paralelo) => {
            const cursos = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo'];
            const nombre = `${cursos[nivel - 1]} ${paralelo}`;
            return await Curso.findOneAndUpdate(
                { nivel, paralelo },
                { nivel, paralelo, nombre },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        };

        // Asegura que existan los cursos de nivel 1 para todos los paralelos
        const paralelos = ['A', 'B', 'C', 'D', 'E'];
        await Promise.all(
            paralelos.map(async (paralelo) => {
                const primerCurso = await obtenerOCrearCurso(1, paralelo);
                return this.findOneAndUpdate(
                    { curso: primerCurso._id, anioLectivo: anioLectivoNuevoId },
                    { curso: primerCurso._id, anioLectivo: anioLectivoNuevoId, estudiantes: [] },
                    { upsert: true, new: true }
                );
            })
        );

        // Procesa cada curso anterior para promover o hacer repetir estudiantes
        for (const cursoAnterior of cursosAnteriores) {
            const { estudiantes, curso } = cursoAnterior;
            const { nivel, paralelo } = curso;

            // Verifica si es el último nivel
            const esUltimoNivel = nivel === 7;
            // Si es el último nivel, no se promueve
            const nivelDestino = esUltimoNivel ? nivel : nivel + 1;

            // Crea o obtiene el curso destino
            const cursoDestino = await obtenerOCrearCurso(nivelDestino, paralelo);
            // Crea o obtiene el curso actual para reprobados
            const cursoActual = await obtenerOCrearCurso(nivel, paralelo);


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

            const estudiantesARepetir = [];
            const estudiantesAPromover = [];
            const observacionesBulk = [];
            const asistenciasBulk = [];

            for (const estudianteId of estudiantes) {
                const idStr = estudianteId.toString();
                const notas = notasMap.get(idStr) || [];
                // Verifica si el estudiante tiene notas
                if (!notasMap.has(idStr)) continue;
                // Determina si el estudiante debe repetir (por notas)
                const reprobado = (nivel > 4 && notas.length === 0) || (nivel > 4 && notas.some(n => n.esMateriaReprobada()));

                // Evita asignar dos veces al mismo estudiante
                const yaAsignado = cursoAsignadoDestino.estudiantes.some(id => id.equals(estudianteId)) ||
                    cursoAsignadoActual.estudiantes.some(id => id.equals(estudianteId));
                if (yaAsignado) continue;

                // Prepara operaciones bulk para observaciones y asistencias
                const bulkOp = {
                    updateOne: {
                        filter: { estudiante: estudianteId, anioLectivo: anioLectivoNuevoId },
                        update: {},
                        upsert: true,
                    },
                };
                observacionesBulk.push(bulkOp);
                asistenciasBulk.push(bulkOp);

                if (reprobado) {
                    estudiantesARepetir.push(estudianteId);
                } else if (!esUltimoNivel) {
                    estudiantesAPromover.push(estudianteId);
                }
            }
            // Asigna estudiantes a repetir al curso actual
            if (estudiantesARepetir.length) {
                cursoAsignadoActual.estudiantes.push(...estudiantesARepetir);
                await cursoAsignadoActual.save();
            }
            // Asigna estudiantes promovidos al curso destino
            if (estudiantesAPromover.length) {
                cursoAsignadoDestino.estudiantes.push(...estudiantesAPromover);
                await cursoAsignadoDestino.save();
            }

            // Realiza operaciones bulk para observaciones y asistencias
            if (observacionesBulk.length) {
                await Observacion.bulkWrite(observacionesBulk);
            }
            if (asistenciasBulk.length) {
                await Asistencia.bulkWrite(asistenciasBulk);
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