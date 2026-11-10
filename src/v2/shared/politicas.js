import { ProhibidoError } from './errores.js'
import { ROLES, tieneRol } from './roles.js'

// Reglas de autorización "finas" en un solo lugar (en la v1 faltaban y había IDOR).
// - Admin: todo.
// - Profesor: solo sus clases, y los cursos/estudiantes donde dicta alguna clase.
// - Representante: solo los estudiantes vinculados a su cuenta.
export const crearPoliticas = ({ academicoRepo, estudiantesRepo }) => {
    const esAdmin = (usuario) => tieneRol(usuario, ROLES.ADMIN)

    const dictaEnCurso = (usuario, cursoId, periodoId) =>
        tieneRol(usuario, ROLES.PROFESOR) && academicoRepo.existeClaseDeProfesorEnCurso(usuario.id, cursoId, periodoId)

    return {
        esAdmin,

        asegurarDictaClase(usuario, clase) {
            if (esAdmin(usuario)) return
            if (String(clase.profesor?._id ?? clase.profesor) !== usuario.id) {
                throw new ProhibidoError('Esta clase no está asignada a usted')
            }
        },

        async asegurarAccesoCurso(usuario, cursoId, periodoId) {
            if (esAdmin(usuario)) return
            if (await dictaEnCurso(usuario, cursoId, periodoId)) return
            throw new ProhibidoError('No tiene clases asignadas en este curso')
        },

        // Admin o profesor que dicta alguna clase en el curso del estudiante (no basta con ser representante)
        async asegurarProfesorDelEstudiante(usuario, estudianteId, periodoId) {
            if (esAdmin(usuario)) return
            const matricula = await estudiantesRepo.matriculaDe(estudianteId, periodoId)
            if (matricula && await dictaEnCurso(usuario, matricula.curso._id, periodoId)) return
            throw new ProhibidoError('Solo un profesor del estudiante puede realizar esta acción')
        },

        async asegurarAccesoEstudiante(usuario, estudianteId, periodoId) {
            if (esAdmin(usuario)) return
            if (tieneRol(usuario, ROLES.REPRESENTANTE) && await estudiantesRepo.esRepresentante(estudianteId, usuario.id)) return
            if (tieneRol(usuario, ROLES.PROFESOR)) {
                const matricula = await estudiantesRepo.matriculaDe(estudianteId, periodoId)
                if (matricula && await dictaEnCurso(usuario, matricula.curso._id, periodoId)) return
            }
            throw new ProhibidoError('No tiene acceso a la información de este estudiante')
        }
    }
}
