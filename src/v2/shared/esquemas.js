import { z } from 'zod'
import mongoose from 'mongoose'

// Mensajes de validación por defecto en español (los propios se definen en cada esquema)
z.config(z.locales.es())

// Esquemas de zod reutilizables
export const idMongo = z.string().refine(v => mongoose.isValidObjectId(v), 'Identificador no válido')
export const paramsId = z.object({ id: idMongo })
export const cedula = z.string().trim().regex(/^\d{10}$/, 'La cédula debe tener 10 dígitos')
export const telefono = z.string().trim().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos')
export const nombrePropio = z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(60)
    .regex(/^[\p{L} ]+$/u, 'Solo puede contener letras y espacios')
export const email = z.string().trim().toLowerCase().pipe(z.email('El email no es válido'))
export const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100)
export const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
