# Plan de migración de v1 a v2

La v1 (`/api/...`) y la v2 (`/api/v2/...`) **conviven en el mismo servidor** y usan bases de datos distintas dentro del mismo clúster: la v1 sigue en la suya y la v2 usa `descubrir_v2`. Esto permite migrar sin cortar el servicio.

## Fases

1. **Desplegar** este backend. La v1 sigue funcionando igual. Al arrancar, la v2 crea sus índices y un admin inicial con los datos `ADMIN_*` del `.env`.
2. **Ensayo de migración:** ejecutar `npm run migrar:v2`. Lee la BDD v1, escribe en `descubrir_v2` y muestra un reporte con lo migrado y lo omitido. **No modifica la BDD v1** y se puede repetir sin duplicar datos.
3. **Revisar el reporte:**
   - `materiasOmitidas`: materias sin curso o sin profesor.
   - `asistenciasOmitidas`: alumnos sin matrícula en ese año.
   - `usuariosConCedulaDuplicada`: personas con dos emails distintos y la misma cédula.

   Corregir en la v1 si hace falta y volver a ejecutar.
4. **Adaptar el frontend** pantalla por pantalla a los endpoints de `API.md`. Las contraseñas de la v1 siguen funcionando en la v2 porque se migra el mismo hash bcrypt. Páginas nuevas del frontend:
   - `/v2/activar/:token`: crear la contraseña de una cuenta nueva → `POST /auth/activar`.
   - `/v2/restablecer/:token`: crear una contraseña nueva → `POST /auth/restablecer`.
5. **Corte:** congelar la escritura en la v1 (por ejemplo, fuera del horario escolar), ejecutar `npm run migrar:v2` una última vez y pasar el frontend a la v2.
6. **Retirar la v1** cuando nadie la use: borrar `src/controllers`, `src/routers`, `src/validators`, `src/models`, `src/middlewares` y `src/config/nodemailer.js`, y conservar la BDD v1 como respaldo.

## Reglas de conversión

| v1 | v2 |
|---|---|
| `administradores` / `profesores` / `representantes` | `usuarios` (se fusionan los roles si el email coincide; se mantiene el mismo hash de contraseña) |
| `anioLectivo` | `periodos` (solo el último activo queda `activo`; si las ponderaciones no suman 100 se usa 25/25/25/25) |
| `materias` + `cursosAsignados.materias` | `asignaturas` (por nombre) + `clases` |
| `cursosAsignados.estudiantes` | `matriculas` |
| `representantes.estudiantes` | `estudiantes.representantes` |
| `notas.evaluaciones.<tipo>[]` | `evaluaciones` (una por clase, tipo y descripción) + `calificaciones` (solo las que tienen nota) |
| `asistencias.asistencia[]` | Un documento por día: `presente`, `ausente` o `justificado` (presente con justificación) |
| `observaciones.observaciones[]` | Un documento por observación |
| Fechas `"D/M/AAAA"` y `"AAAA/M/D"` | `Date` |

## Variables de entorno nuevas
| Variable | Uso | Valor por defecto |
|---|---|---|
| `MONGODB_DB_V2` | Nombre de la BDD de la v2 (solo el nombre: sin puntos, barras ni la URI) | `descubrir_v2` |
| `MONGODB_DB_V1` | BDD de origen para la migración | La de `MONGODB_URI_PRODUCTION` |
| `URL_FRONTEND_V2` | Frontend al que enlazan los correos de la v2 (activar cuenta, restablecer contraseña) | `URL_PRODUCTION` |
| `CORS_ORIGINS` | Dominios permitidos, separados por comas | Cualquiera |
| `JWT_EXPIRES_IN` | Duración de la sesión v2 | `8h` |
| `PROMOCION_PRESUPUESTO_MS` | Tiempo de trabajo por petición en la promoción por partes (debe quedar bajo el límite de tu plan en Vercel) | `7000` |
| `AUTH_LIMITE_INTENTOS` | Intentos de login cada 15 minutos | `10` |
| `NODE_ENV=production` o `V2_SERVICIOS_REALES=true` | Usa Nodemailer e Imgur reales en la v2. Sin esto, los correos se muestran en consola. | — |

> **Requisito:** la v2 usa transacciones, que necesitan un *replica set*. MongoDB Atlas ya lo es. En local, levanta Mongo con `--replSet rs0` y ejecuta `rs.initiate()`.
