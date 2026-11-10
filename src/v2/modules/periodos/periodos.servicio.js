import { ConflictoError, NoEncontradoError, SolicitudInvalidaError } from '../../shared/errores.js'
import { validarPonderaciones } from '../calificaciones/dominio/promedios.js'

export const crearPeriodosServicio = ({ periodosRepo }) => ({
    listar: () => periodosRepo.listar(),

    async activo() {
        await periodosRepo.cerrarVencidos(new Date())
        const periodo = await periodosRepo.buscarActivo()
        if (!periodo) throw new NoEncontradoError('Periodo activo')
        return periodo
    },

    // Periodo pedido explícitamente (consultas históricas) o, si no se indica, el activo
    async resolver(periodoId) {
        if (!periodoId) return this.activo()
        const periodo = await periodosRepo.buscarPorId(periodoId)
        if (!periodo) throw new NoEncontradoError('Periodo')
        return periodo
    },

    // Solo se puede escribir (notas, asistencia, matrículas) en un periodo que no esté cerrado
    asegurarEditable(periodo) {
        if (periodo.estado === 'cerrado') throw new ConflictoError(`El periodo ${periodo.nombre} está cerrado y no admite cambios`)
    },

    async crear(datos) {
        if (datos.ponderaciones && !validarPonderaciones(datos.ponderaciones)) {
            throw new SolicitudInvalidaError('Las ponderaciones deben sumar 100')
        }
        return periodosRepo.crear({ ...datos, estado: 'planificado' })
    },

    async activar(id) {
        const periodo = await periodosRepo.buscarPorId(id)
        if (!periodo) throw new NoEncontradoError('Periodo')
        if (periodo.estado !== 'planificado') throw new ConflictoError('Solo se puede activar un periodo planificado')
        if (await periodosRepo.buscarActivo()) throw new ConflictoError('Ya existe un periodo activo; ciérrelo primero')
        return periodosRepo.actualizar(id, { estado: 'activo' })
    },

    async cerrar(id) {
        const periodo = await periodosRepo.buscarPorId(id)
        if (!periodo) throw new NoEncontradoError('Periodo')
        if (periodo.estado !== 'activo') throw new ConflictoError('Solo se puede cerrar el periodo activo')
        return periodosRepo.actualizar(id, { estado: 'cerrado', fin: periodo.fin ?? new Date() })
    },

    async configurar(id, cambios) {
        const periodo = await periodosRepo.buscarPorId(id)
        if (!periodo) throw new NoEncontradoError('Periodo')
        this.asegurarEditable(periodo)
        if (cambios.ponderaciones && !validarPonderaciones(cambios.ponderaciones)) {
            throw new SolicitudInvalidaError('Las ponderaciones deben sumar 100')
        }
        return periodosRepo.actualizar(id, cambios)
    }
})
