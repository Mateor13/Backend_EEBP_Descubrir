// Las fechas siempre se guardan como Date. Para fechas "de calendario" (un día de asistencia,
// la fecha de una evaluación) se usa la medianoche UTC de ese día, así no dependen de la zona
// horaria del servidor (Vercel corre en UTC, la escuela está en America/Guayaquil).
export const ZONA_HORARIA = 'America/Guayaquil'

// 'AAAA-MM-DD' -> Date a medianoche UTC
export const diaDesdeISO = (texto) => {
    const [a, m, d] = texto.split('-').map(Number)
    return new Date(Date.UTC(a, m - 1, d))
}

// Día de hoy según la zona horaria de la escuela, como Date a medianoche UTC
export const hoyEnEscuela = (ahora = new Date()) => {
    const texto = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(ahora) // AAAA-MM-DD
    return diaDesdeISO(texto)
}

export const aISODia = (fecha) => fecha.toISOString().slice(0, 10)
