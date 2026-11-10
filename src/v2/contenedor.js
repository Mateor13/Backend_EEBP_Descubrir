// ============================================================================
// Raíz de composición: el ÚNICO lugar donde se decide qué implementación concreta usa cada pieza.
// Los servicios reciben sus dependencias como parámetros (inversión de dependencias, la "D" de SOLID):
// en producción se usan Mongo, Nodemailer e Imgur; en las pruebas se pueden pasar versiones falsas.
// ============================================================================
import { enTransaccion as enTransaccionMongo } from './infra/db/conexion.js'
import { crearMailerConsola, crearMailerNodemailer } from './infra/mail/mailer.js'
import { crearAlmacenamientoFalso, crearAlmacenamientoImgur } from './infra/almacenamiento/imgur.js'
import { crearPoliticas } from './shared/politicas.js'
import { crearUsuariosRepositorio } from './modules/usuarios/usuarios.repositorio.js'
import { crearPeriodosRepositorio } from './modules/periodos/periodos.repositorio.js'
import { crearAcademicoRepositorio } from './modules/academico/academico.repositorio.js'
import { crearEstudiantesRepositorio } from './modules/estudiantes/estudiantes.repositorio.js'
import { crearCalificacionesRepositorio } from './modules/calificaciones/calificaciones.repositorio.js'
import { crearAsistenciasRepositorio } from './modules/asistencias/asistencias.repositorio.js'
import { crearObservacionesRepositorio } from './modules/observaciones/observaciones.repositorio.js'
import { crearUsuariosServicio } from './modules/usuarios/usuarios.servicio.js'
import { crearAuthServicio } from './modules/auth/auth.servicio.js'
import { crearPeriodosServicio } from './modules/periodos/periodos.servicio.js'
import { crearPromocionServicio } from './modules/periodos/promocion.servicio.js'
import { crearAcademicoServicio } from './modules/academico/academico.servicio.js'
import { crearEstudiantesServicio } from './modules/estudiantes/estudiantes.servicio.js'
import { crearCalificacionesServicio } from './modules/calificaciones/calificaciones.servicio.js'
import { crearAsistenciasServicio } from './modules/asistencias/asistencias.servicio.js'
import { crearObservacionesServicio } from './modules/observaciones/observaciones.servicio.js'

const usarServiciosReales = () => process.env.NODE_ENV === 'production' || process.env.V2_SERVICIOS_REALES === 'true'

export const crearContenedor = (sobrescrituras = {}) => {
    const mailer = sobrescrituras.mailer ?? (usarServiciosReales() ? crearMailerNodemailer() : crearMailerConsola())
    const almacenamiento = sobrescrituras.almacenamiento ?? (usarServiciosReales() ? crearAlmacenamientoImgur() : crearAlmacenamientoFalso())
    const enTransaccion = sobrescrituras.enTransaccion ?? enTransaccionMongo

    const repos = {
        usuariosRepo: crearUsuariosRepositorio(),
        periodosRepo: crearPeriodosRepositorio(),
        academicoRepo: crearAcademicoRepositorio(),
        estudiantesRepo: crearEstudiantesRepositorio(),
        calificacionesRepo: crearCalificacionesRepositorio(),
        asistenciasRepo: crearAsistenciasRepositorio(),
        observacionesRepo: crearObservacionesRepositorio(),
        ...sobrescrituras.repos
    }
    const politicas = crearPoliticas(repos)
    const periodosServicio = crearPeriodosServicio(repos)
    const base = { ...repos, politicas, periodosServicio, mailer, almacenamiento, enTransaccion }

    return {
        ...base,
        usuariosServicio: crearUsuariosServicio(base),
        authServicio: crearAuthServicio(base),
        promocionServicio: crearPromocionServicio(base),
        academicoServicio: crearAcademicoServicio(base),
        estudiantesServicio: crearEstudiantesServicio(base),
        calificacionesServicio: crearCalificacionesServicio(base),
        asistenciasServicio: crearAsistenciasServicio(base),
        observacionesServicio: crearObservacionesServicio(base)
    }
}
