import { ConflictoError, NoEncontradoError, SolicitudInvalidaError } from '../../shared/errores.js'
import { ROLES } from '../../shared/roles.js'
import { aCurso } from '../academico/academico.servicio.js'
import * as plantillas from '../../infra/mail/plantillas.js'

const aEstudiante = (e) => ({ id: String(e._id), nombre: e.nombre, apellido: e.apellido, cedula: e.cedula, activo: e.activo })

export const crearEstudiantesServicio = ({ estudiantesRepo, usuariosRepo, academicoRepo, periodosServicio, politicas, mailer, enTransaccion }) => {
    const asegurarRepresentante = async (id) => {
        const usuario = await usuariosRepo.buscarPorId(id)
        if (!usuario || !usuario.activo || !usuario.roles.includes(ROLES.REPRESENTANTE)) {
            throw new SolicitudInvalidaError('El usuario indicado no es un representante activo')
        }
        return usuario
    }

    // El correo es una notificación: si falla, el registro ya está hecho y no se deshace
    const notificarVinculo = (representante, estudiante) => mailer
        .enviar({ para: representante.email, ...plantillas.estudianteVinculado({ nombre: representante.nombre, estudiante }) })
        .catch(error => console.error('[v2] No se pudo notificar al representante:', error.message))

    const obtener = async (id) => {
        const estudiante = await estudiantesRepo.buscarPorId(id)
        if (!estudiante) throw new NoEncontradoError('Estudiante')
        return estudiante
    }

    return {
        // Crea el estudiante y (opcionalmente) su matrícula en una TRANSACCIÓN: o se crean ambos o ninguno
        async crear({ representantes = [], curso, ...datos }) {
            if (await estudiantesRepo.existeCedula(datos.cedula)) throw new ConflictoError('Ya existe un estudiante con esa cédula')
            const reps = await Promise.all(representantes.map(asegurarRepresentante))
            let periodo
            if (curso) {
                periodo = await periodosServicio.activo()
                if (!await academicoRepo.buscarCurso(curso)) throw new NoEncontradoError('Curso')
            }
            const estudiante = await enTransaccion(async (session) => {
                const nuevo = await estudiantesRepo.crear({ ...datos, representantes }, session)
                if (curso) await estudiantesRepo.crearMatricula({ periodo: periodo._id, curso, estudiante: nuevo._id }, session)
                return nuevo
            })
            await Promise.all(reps.map(r => notificarVinculo(r, estudiante)))
            return aEstudiante(estudiante)
        },

        async obtenerDetalle(usuario, id, periodoId) {
            const periodo = await periodosServicio.resolver(periodoId)
            await politicas.asegurarAccesoEstudiante(usuario, id, periodo._id)
            const estudiante = await estudiantesRepo.buscarDetallado(id)
            if (!estudiante) throw new NoEncontradoError('Estudiante')
            const matricula = await estudiantesRepo.matriculaDe(id, periodo._id)
            return {
                ...aEstudiante(estudiante),
                representantes: estudiante.representantes.map(r => ({ id: String(r._id), nombre: r.nombre, apellido: r.apellido, email: r.email, telefono: r.telefono })),
                matricula: matricula && { id: String(matricula._id), estado: matricula.estado, curso: aCurso(matricula.curso), periodo: periodo.nombre }
            }
        },

        async actualizar(id, cambios) {
            await obtener(id)
            if (cambios.cedula && await estudiantesRepo.existeCedula(cambios.cedula, id)) throw new ConflictoError('Ya existe un estudiante con esa cédula')
            return aEstudiante(await estudiantesRepo.actualizar(id, cambios))
        },

        async desactivar(id) {
            await obtener(id)
            await estudiantesRepo.actualizar(id, { activo: false })
        },

        async vincularRepresentante(id, representanteId) {
            const estudiante = await obtener(id)
            const representante = await asegurarRepresentante(representanteId)
            await estudiantesRepo.agregarRepresentante(id, representanteId)
            await notificarVinculo(representante, estudiante)
        },

        async desvincularRepresentante(id, representanteId) {
            await obtener(id)
            await estudiantesRepo.quitarRepresentante(id, representanteId)
        },

        // Representante: sus estudiantes con el curso del periodo
        async misEstudiantes(usuario, periodoId) {
            const periodo = await periodosServicio.resolver(periodoId).catch(() => null)
            const estudiantes = await estudiantesRepo.deRepresentante(usuario.id)
            return Promise.all(estudiantes.map(async (e) => {
                const matricula = periodo && await estudiantesRepo.matriculaDe(e._id, periodo._id)
                return { ...aEstudiante(e), curso: matricula ? aCurso(matricula.curso) : null }
            }))
        },

        // ----- Matrículas -----
        async matricular({ estudiante, curso, periodo: periodoId }) {
            const periodo = await periodosServicio.resolver(periodoId)
            periodosServicio.asegurarEditable(periodo)
            const est = await obtener(estudiante)
            if (!est.activo) throw new SolicitudInvalidaError('El estudiante está desactivado')
            if (!await academicoRepo.buscarCurso(curso)) throw new NoEncontradoError('Curso')
            if (await estudiantesRepo.matriculaDe(estudiante, periodo._id)) {
                throw new ConflictoError('El estudiante ya está matriculado en este periodo; use el cambio de curso')
            }
            return estudiantesRepo.crearMatricula({ periodo: periodo._id, curso, estudiante })
        },

        async cambiarCurso(matriculaId, curso) {
            const matricula = await estudiantesRepo.buscarMatricula(matriculaId)
            if (!matricula) throw new NoEncontradoError('Matrícula')
            periodosServicio.asegurarEditable(await periodosServicio.resolver(matricula.periodo))
            if (!await academicoRepo.buscarCurso(curso)) throw new NoEncontradoError('Curso')
            return estudiantesRepo.actualizarMatricula(matriculaId, { curso })
        },

        async retirar(matriculaId) {
            const matricula = await estudiantesRepo.buscarMatricula(matriculaId)
            if (!matricula) throw new NoEncontradoError('Matrícula')
            periodosServicio.asegurarEditable(await periodosServicio.resolver(matricula.periodo))
            return estudiantesRepo.actualizarMatricula(matriculaId, { estado: 'retirada' })
        },

        async estudiantesDelCurso(usuario, cursoId, periodoId) {
            const periodo = await periodosServicio.resolver(periodoId)
            await politicas.asegurarAccesoCurso(usuario, cursoId, periodo._id)
            const matriculas = await estudiantesRepo.matriculasDelCurso(cursoId, periodo._id)
            return matriculas.map(m => ({ ...aEstudiante(m.estudiante), activo: true, matricula: { id: String(m._id), estado: m.estado } }))
        }
    }
}
