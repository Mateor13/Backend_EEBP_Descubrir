// Errores de aplicación con su código HTTP.
// Los servicios LANZAN estos errores (no devuelven { error }) y un único middleware los
// convierte en respuestas HTTP. Así la lógica de negocio no sabe nada de Express.
export class AppError extends Error {
    constructor(mensaje, status = 500, detalles) {
        super(mensaje)
        this.name = this.constructor.name
        this.status = status
        this.detalles = detalles
    }
}

export class SolicitudInvalidaError extends AppError {
    constructor(mensaje = 'Solicitud inválida', detalles) { super(mensaje, 400, detalles) }
}
export class NoAutenticadoError extends AppError {
    constructor(mensaje = 'Debe iniciar sesión') { super(mensaje, 401) }
}
export class ProhibidoError extends AppError {
    constructor(mensaje = 'No tiene permisos para realizar esta acción') { super(mensaje, 403) }
}
export class NoEncontradoError extends AppError {
    constructor(recurso = 'Recurso') { super(`${recurso} no encontrado`, 404) }
}
export class ConflictoError extends AppError {
    constructor(mensaje = 'El recurso ya existe') { super(mensaje, 409) }
}
