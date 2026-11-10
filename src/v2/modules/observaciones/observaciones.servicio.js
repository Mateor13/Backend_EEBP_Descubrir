export const crearObservacionesServicio = ({ observacionesRepo, periodosServicio, politicas }) => ({
    async crear(usuario, estudianteId, texto) {
        const periodo = await periodosServicio.activo()
        // Solo el admin o un profesor que dicta clases al estudiante (antes: cualquier profesor)
        await politicas.asegurarProfesorDelEstudiante(usuario, estudianteId, periodo._id)
        const observacion = await observacionesRepo.crear({ periodo: periodo._id, estudiante: estudianteId, autor: usuario.id, texto })
        return { id: String(observacion._id), texto: observacion.texto, fecha: observacion.fecha }
    },

    async listar(usuario, estudianteId, periodoId) {
        const periodo = await periodosServicio.resolver(periodoId)
        await politicas.asegurarAccesoEstudiante(usuario, estudianteId, periodo._id)
        return (await observacionesRepo.delEstudiante(estudianteId, periodo._id)).map(o => ({
            id: String(o._id), texto: o.texto, fecha: o.fecha,
            autor: o.autor ? { id: String(o.autor._id), nombre: o.autor.nombre, apellido: o.autor.apellido } : null
        }))
    }
})
