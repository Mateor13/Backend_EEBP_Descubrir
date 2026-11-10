import { ConflictoError, NoEncontradoError, SolicitudInvalidaError } from '../../shared/errores.js'
import { ROLES, tieneRol } from '../../shared/roles.js'
import { nombreCurso } from '../../infra/db/modelos.js'

export const aCurso = (c) => ({ id: String(c._id), nivel: c.nivel, paralelo: c.paralelo, nombre: nombreCurso(c) })
export const aClase = (c) => ({
    id: String(c._id),
    periodo: String(c.periodo),
    curso: c.curso?.nivel ? aCurso(c.curso) : String(c.curso),
    asignatura: c.asignatura?.nombre ? { id: String(c.asignatura._id), nombre: c.asignatura.nombre } : String(c.asignatura),
    profesor: c.profesor?.nombre ? { id: String(c.profesor._id), nombre: c.profesor.nombre, apellido: c.profesor.apellido } : String(c.profesor)
})

export const crearAcademicoServicio = ({ academicoRepo, usuariosRepo, periodosServicio }) => {
    const asegurarProfesor = async (profesorId) => {
        const profesor = await usuariosRepo.buscarPorId(profesorId)
        if (!profesor || !profesor.activo || !profesor.roles.includes(ROLES.PROFESOR)) {
            throw new SolicitudInvalidaError('El usuario indicado no es un profesor activo')
        }
    }

    return {
        // ----- Cursos -----
        listarCursos: async () => (await academicoRepo.listarCursos()).map(aCurso),

        async crearCurso({ nivel, paralelo }) {
            if (await academicoRepo.buscarCursoPorNivel(nivel, paralelo)) throw new ConflictoError('El curso ya existe')
            return aCurso(await academicoRepo.obtenerOCrearCurso(nivel, paralelo))
        },

        // ----- Asignaturas -----
        listarAsignaturas: () => academicoRepo.listarAsignaturas(),
        crearAsignatura: (datos) => academicoRepo.crearAsignatura(datos),
        async actualizarAsignatura(id, cambios) {
            const asignatura = await academicoRepo.actualizarAsignatura(id, cambios)
            if (!asignatura) throw new NoEncontradoError('Asignatura')
            return asignatura
        },

        // ----- Clases -----
        async crearClase({ periodo: periodoId, curso, asignatura, profesor }) {
            const periodo = await periodosServicio.resolver(periodoId)
            periodosServicio.asegurarEditable(periodo)
            if (!await academicoRepo.buscarCurso(curso)) throw new NoEncontradoError('Curso')
            if (!await academicoRepo.buscarAsignatura(asignatura)) throw new NoEncontradoError('Asignatura')
            await asegurarProfesor(profesor)
            const clase = await academicoRepo.crearClase({ periodo: periodo._id, curso, asignatura, profesor })
            return aClase(await academicoRepo.buscarClaseDetallada(clase._id))
        },

        // El profesor solo ve sus clases; el admin puede filtrar por curso/profesor
        async listarClases(usuario, { periodo: periodoId, curso, profesor }) {
            const periodo = await periodosServicio.resolver(periodoId)
            const filtro = { periodo: periodo._id, ...(curso && { curso }) }
            if (tieneRol(usuario, ROLES.ADMIN)) { if (profesor) filtro.profesor = profesor } else filtro.profesor = usuario.id
            return (await academicoRepo.listarClases(filtro)).map(aClase)
        },

        async obtenerClase(id) {
            const clase = await academicoRepo.buscarClase(id)
            if (!clase || !clase.activo) throw new NoEncontradoError('Clase')
            return clase
        },

        async cambiarProfesor(id, profesor) {
            const clase = await this.obtenerClase(id)
            periodosServicio.asegurarEditable(await periodosServicio.resolver(clase.periodo))
            await asegurarProfesor(profesor)
            await academicoRepo.actualizarClase(id, { profesor })
            return aClase(await academicoRepo.buscarClaseDetallada(id))
        },

        async desactivarClase(id) {
            await this.obtenerClase(id)
            await academicoRepo.actualizarClase(id, { activo: false })
        }
    }
}
