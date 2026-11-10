import { Schema } from 'mongoose'
import { conexionV2 } from './conexion.js'
import { TODOS_LOS_ROLES } from '../../shared/roles.js'

// ============================================================================
// Modelo de datos v2. Reglas que se siguieron:
//  - Una colección por concepto del dominio, sin datos copiados entre documentos.
//  - Lo que crece sin límite (notas, asistencias, observaciones) va en su propia colección,
//    un documento por registro, nunca como array dentro de otro documento.
//  - Las reglas de unicidad las garantiza MongoDB con índices únicos, no el código.
//  - Fechas siempre como Date.
// ============================================================================
const opciones = { timestamps: true, versionKey: false }
const ref = (modelo, required = true) => ({ type: Schema.Types.ObjectId, ref: modelo, required })

const tokenUnUso = new Schema({ hash: String, expira: Date }, { _id: false })

// ---------- Usuarios: un solo concepto con uno o varios roles ----------
// (antes: 3 colecciones casi idénticas; un profesor que además es padre no se podía modelar)
const usuarioSchema = new Schema({
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    cedula: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    telefono: { type: String, trim: true },
    direccion: { type: String, trim: true },
    roles: { type: [{ type: String, enum: TODOS_LOS_ROLES }], validate: v => v.length > 0 },
    passwordHash: { type: String, required: true, select: false },
    emailConfirmado: { type: Boolean, default: false },
    activo: { type: Boolean, default: true },
    tokenConfirmacion: { type: tokenUnUso, select: false },
    tokenRecuperacion: { type: tokenUnUso, select: false }
}, { ...opciones, collection: 'usuarios' })
usuarioSchema.index({ roles: 1, activo: 1 })
usuarioSchema.index({ 'tokenConfirmacion.hash': 1 }, { sparse: true })
usuarioSchema.index({ 'tokenRecuperacion.hash': 1 }, { sparse: true })

// ---------- Estudiantes ----------
const estudianteSchema = new Schema({
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    cedula: { type: String, required: true, unique: true, trim: true },
    representantes: [ref('Usuario')],
    activo: { type: Boolean, default: true }
}, { ...opciones, collection: 'estudiantes' })
estudianteSchema.index({ representantes: 1 })

// ---------- Periodos lectivos ----------
const ponderacionesSchema = new Schema({
    deber: { type: Number, min: 0, max: 100, default: 25 },
    taller: { type: Number, min: 0, max: 100, default: 25 },
    prueba: { type: Number, min: 0, max: 100, default: 25 },
    examen: { type: Number, min: 0, max: 100, default: 25 }
}, { _id: false })

const periodoSchema = new Schema({
    nombre: { type: String, required: true, unique: true, trim: true }, // "2025-2026"
    inicio: { type: Date, required: true },
    fin: { type: Date, default: null },
    estado: { type: String, enum: ['planificado', 'activo', 'cerrado'], default: 'planificado' },
    // Un objeto, no un array (antes se guardaba como array y se leía como objeto)
    ponderaciones: { type: ponderacionesSchema, default: () => ({}) },
    notaMinima: { type: Number, default: 7, min: 0, max: 10 },
    nivelMinimoReprobacion: { type: Number, default: 5, min: 1, max: 7 } // de 1.º a 4.º no se repite
}, { ...opciones, collection: 'periodos' })
// Garantiza en la BDD que solo exista UN periodo activo
periodoSchema.index({ estado: 1 }, { unique: true, partialFilterExpression: { estado: 'activo' } })

// ---------- Cursos (catálogo fijo: nivel + paralelo) ----------
const NOMBRES_NIVEL = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo']
const cursoSchema = new Schema({
    nivel: { type: Number, required: true, min: 1, max: 7 },
    paralelo: { type: String, required: true, enum: ['A', 'B', 'C', 'D', 'E'] }
}, { ...opciones, collection: 'cursos', toJSON: { virtuals: true }, toObject: { virtuals: true } })
cursoSchema.index({ nivel: 1, paralelo: 1 }, { unique: true })
// El nombre se calcula, no se guarda (no se puede desincronizar)
export const nombreCurso = (curso) => `${NOMBRES_NIVEL[curso.nivel - 1]} ${curso.paralelo}`
cursoSchema.virtual('nombre').get(function () { return nombreCurso(this) })

// ---------- Asignaturas (catálogo: "Matemáticas") ----------
const asignaturaSchema = new Schema({
    nombre: { type: String, required: true, unique: true, trim: true },
    activo: { type: Boolean, default: true }
}, { ...opciones, collection: 'asignaturas' })

// ---------- Clases: una asignatura dictada en un curso, en un periodo, por un profesor ----------
// (antes "Materia" mezclaba el catálogo con la asignación docente y no sabía a qué curso pertenecía)
const claseSchema = new Schema({
    periodo: ref('Periodo'),
    curso: ref('Curso'),
    asignatura: ref('Asignatura'),
    profesor: ref('Usuario'),
    activo: { type: Boolean, default: true }
}, { ...opciones, collection: 'clases' })
claseSchema.index({ periodo: 1, curso: 1, asignatura: 1 }, { unique: true })
claseSchema.index({ profesor: 1, periodo: 1 })

// ---------- Matrículas: un estudiante en un curso durante un periodo ----------
// (antes: array de estudiantes dentro de CursoAsignado)
const matriculaSchema = new Schema({
    periodo: ref('Periodo'),
    curso: ref('Curso'),
    estudiante: ref('Estudiante'),
    estado: { type: String, enum: ['activa', 'retirada', 'aprobada', 'reprobada'], default: 'activa' }
}, { ...opciones, collection: 'matriculas' })
matriculaSchema.index({ periodo: 1, estudiante: 1 }, { unique: true }) // una matrícula por periodo
matriculaSchema.index({ periodo: 1, curso: 1 })

// ---------- Evaluaciones: la tarea/prueba en sí (una sola vez, no copiada por alumno) ----------
export const TIPOS_EVALUACION = ['deber', 'taller', 'prueba', 'examen']
const evaluacionSchema = new Schema({
    clase: ref('Clase'),
    tipo: { type: String, enum: TIPOS_EVALUACION, required: true },
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true, default: '' },
    fecha: { type: Date, required: true },
    evidenciaUrl: { type: String, default: null },
    creadaPor: ref('Usuario', false)
}, { ...opciones, collection: 'evaluaciones' })
evaluacionSchema.index({ clase: 1, tipo: 1, fecha: 1 })

// ---------- Calificaciones: la nota de UN estudiante en UNA evaluación ----------
const calificacionSchema = new Schema({
    evaluacion: ref('Evaluacion'),
    estudiante: ref('Estudiante'),
    nota: { type: Number, required: true, min: 0, max: 10 },
    registradaPor: ref('Usuario', false)
}, { ...opciones, collection: 'calificaciones' })
calificacionSchema.index({ evaluacion: 1, estudiante: 1 }, { unique: true })
calificacionSchema.index({ estudiante: 1 })

// ---------- Asistencias: un documento por estudiante y día ----------
// (antes: un array infinito por alumno + contador "faltas" mantenido a mano)
export const ESTADOS_ASISTENCIA = ['presente', 'ausente', 'atraso', 'justificado']
const asistenciaSchema = new Schema({
    periodo: ref('Periodo'),
    curso: ref('Curso'),
    estudiante: ref('Estudiante'),
    fecha: { type: Date, required: true },
    estado: { type: String, enum: ESTADOS_ASISTENCIA, required: true },
    justificacion: { type: String, trim: true, default: '' },
    registradaPor: ref('Usuario', false) // opcional: los registros migrados de la v1 no tienen autor
}, { ...opciones, collection: 'asistencias' })
asistenciaSchema.index({ estudiante: 1, fecha: 1 }, { unique: true })
asistenciaSchema.index({ curso: 1, fecha: 1 })

// ---------- Observaciones ----------
const observacionSchema = new Schema({
    periodo: ref('Periodo'),
    estudiante: ref('Estudiante'),
    autor: ref('Usuario'),
    texto: { type: String, required: true, trim: true, maxlength: 1000 },
    fecha: { type: Date, default: Date.now }
}, { ...opciones, collection: 'observaciones' })
observacionSchema.index({ estudiante: 1, periodo: 1, fecha: -1 })

// ---------- Procesos de promoción: avance guardado para poder hacerlo por partes ----------
// En un servidor sin estado (Vercel) cada petición tiene un tiempo máximo. La promoción se divide
// por cursos y este documento recuerda qué falta, así cada petición avanza un poco y nada se pierde.
const procesoPromocionSchema = new Schema({
    origen: { ...ref('Periodo'), unique: true },
    destino: ref('Periodo'),
    copiarClases: { type: Boolean, default: true },
    estado: { type: String, enum: ['en_progreso', 'completado'], default: 'en_progreso' },
    total: { type: Number, required: true },
    cursosPendientes: [{ type: Schema.Types.ObjectId, ref: 'Curso' }],
    resumen: {
        promovidos: { type: Number, default: 0 },
        repiten: { type: Number, default: 0 },
        egresados: { type: Number, default: 0 },
        yaMatriculados: { type: Number, default: 0 },
        clasesCopiadas: { type: Number, default: 0 }
    },
    // Candado con vencimiento: evita que dos peticiones procesen a la vez; si una muere, expira solo
    bloqueadoHasta: { type: Date, default: null },
    iniciadoPor: ref('Usuario', false),
    finalizado: { type: Date, default: null }
}, { ...opciones, collection: 'procesosPromocion' })

export const Usuario = conexionV2.model('Usuario', usuarioSchema)
export const Estudiante = conexionV2.model('Estudiante', estudianteSchema)
export const Periodo = conexionV2.model('Periodo', periodoSchema)
export const Curso = conexionV2.model('Curso', cursoSchema)
export const Asignatura = conexionV2.model('Asignatura', asignaturaSchema)
export const Clase = conexionV2.model('Clase', claseSchema)
export const Matricula = conexionV2.model('Matricula', matriculaSchema)
export const Evaluacion = conexionV2.model('Evaluacion', evaluacionSchema)
export const Calificacion = conexionV2.model('Calificacion', calificacionSchema)
export const Asistencia = conexionV2.model('Asistencia', asistenciaSchema)
export const Observacion = conexionV2.model('Observacion', observacionSchema)
export const ProcesoPromocion = conexionV2.model('ProcesoPromocion', procesoPromocionSchema)

export const todosLosModelos = [Usuario, Estudiante, Periodo, Curso, Asignatura, Clase, Matricula, Evaluacion, Calificacion, Asistencia, Observacion, ProcesoPromocion]
