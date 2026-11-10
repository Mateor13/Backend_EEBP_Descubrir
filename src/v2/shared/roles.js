export const ROLES = Object.freeze({
    ADMIN: 'admin',
    PROFESOR: 'profesor',
    REPRESENTANTE: 'representante'
})

export const TODOS_LOS_ROLES = Object.values(ROLES)

export const tieneRol = (usuario, ...roles) => roles.some(rol => usuario?.roles?.includes(rol))
