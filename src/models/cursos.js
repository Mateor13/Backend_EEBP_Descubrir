import mongoose, {Schema, model} from 'mongoose'  
import Materias from './materias.js'

const cursoSchema = new Schema({
    nombre:{
        type: String,
        required: true,
        trim: true,
        unique: true
    }, 
    estudiantes:[{
        type: Schema.Types.ObjectId,
        ref: 'Estudiante'
    }],
    materias:[{
        type: Schema.Types.ObjectId,
        ref: 'Materia'
    }]    
},{
    timestamps: true,
    collection: 'cursos'
})

cursoSchema.methods.agregarEstudiante = async function(estudiante){
    const existeEstudiante = this.estudiantes.includes(estudiante)
    if(existeEstudiante)return {error: 'El estudiante ya está registrado en este curso'}
    this.estudiantes.push(estudiante)
    await this.save()
}

cursoSchema.methods.agregarMaterias = async function(materia){
    const existeMateria = this.materias.includes(materia)
    if(existeMateria)return {error: 'La materia ya está registrada en este curso'}
    this.materias.push(materia)
    await this.save()
}

cursoSchema.methods.eliminarEstudiante = async function(estudianteId){
    this.estudiantes = this.estudiantes.filter(estudiante => estudiante._id !== estudianteId)
    await this.save()
}

cursoSchema.methods.buscarMateriasRegistradas = async function(nombre) {
    const materias = await Materias.find({ _id: { $in: this.materias }, nombre: nombre });
    return materias;
};

cursoSchema.methods.buscarEstudiantesPorMateriaYProfesor = async function(profesorId, materiaNombre) {
    const estudiantes = await this.model('Curso').aggregate([
        // Paso 1: Descomponer el array de materias en el curso
        {
            $lookup: {
                from: 'materias', // Colección de materias
                localField: 'materias', // Campo en Curso
                foreignField: '_id', // Campo en Materia
                as: 'materiasDetalle' // Resultado
            }
        },
        // Paso 2: Filtrar los cursos que contienen la materia específica y profesor específico
        {
            $match: {
                'materiasDetalle.nombre': materiaNombre,
                'materiasDetalle.profesor': new mongoose.Types.ObjectId(profesorId) 
            }
        },
        // Paso 3: Descomponer el array de estudiantes en el curso
        {
            $lookup: {
                from: 'estudiantes', // Colección de estudiantes
                localField: 'estudiantes', // Campo en Curso
                foreignField: '_id', // Campo en Estudiante
                as: 'estudiantesDetalle' // Resultado
            }
        },
        // Paso 4: Proyectar solo los estudiantes
        {
            $project: {
                estudiantesDetalle: 1,
                _id: 0 // Excluir el campo _id si no es necesario
            }
        },
        // Paso 5: Descomponer el array de estudiantes en documentos individuales
        {
            $unwind: '$estudiantesDetalle'
        },
        // Paso 6: Agrupar estudiantes para obtener una lista única (si es necesario)
        {
            $group: {
                _id: '$estudiantesDetalle._id',
                nombre: { $first: '$estudiantesDetalle.nombre' },
                apellido: { $first: '$estudiantesDetalle.apellido' },
                cedula: { $first: '$estudiantesDetalle.cedula' }
            }
        }
    ]);
    return estudiantes;
};

export default model('Curso', cursoSchema)