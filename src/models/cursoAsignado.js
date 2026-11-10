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

// La promoción de año vive en src/services/promocion.js (antes era un método de este esquema).

export default model('CursoAsignado', cursoAsignadoSchema)