# Mantenimiento de la API v1

La v1 (`/api/...`) es la que usa hoy el frontend ([descubrirFrontend](https://github.com/Mateor13/descubrirFrontend)). Se mejora **sin cambiar lo que recibe el frontend**: mismas rutas, mismos códigos HTTP y misma forma de cada respuesta.

## Cómo se garantiza: prueba de contrato ("golden master")

`tests/v1/contrato.integracion.test.js` recorre, en el orden de un uso real, **todos los endpoints v1 que llama el frontend** (más los de representante, que puede usar la app móvil). Por cada uno guarda el código HTTP y el cuerpo de la respuesta en `tests/v1/contrato.snapshot.json`; los IDs, fechas y tokens se reemplazan por marcadores porque cambian en cada ejecución.

- `npm run test:integracion` compara contra esa foto. Si un refactor o una actualización altera algo que recibe el frontend, la prueba falla e indica el paso exacto.
- `ACTUALIZAR_CONTRATO=1 npm run test:integracion` vuelve a grabar la foto. Úsalo solo para cambios intencionales y revisa el diff de `contrato.snapshot.json` en git: ese diff **es** la documentación de lo que cambió para el frontend.

## Cambios intencionales en las respuestas (bugs corregidos)

| Endpoint | Antes | Ahora |
|---|---|---|
| `POST /iniciar-periodo` (promoción) | Una materia **sin notas** contaba como 0: el alumno repetía aunque aprobara las demás | Una materia sin notas no hace repetir |
| `POST /iniciar-periodo` | Cursos con la misma materia y profesor **compartían un único documento** de materia en el año nuevo (eliminar o reasignar en un curso afectaba al otro) | Cada curso tiene su propia copia |
| `PATCH /justificar-inasistencia` | Fallaba en días o meses de un dígito: el frontend envía `2026/12/05` y se guardaba `2026/12/5` | Se aceptan ambos formatos |
| `POST /registro-asistencia` (repetida) | `"...del estudiante undefined undefined"` | `"...del estudiante Pedro Paz"` |
| `GET /cursos` | Orden según la inserción (aleatorio tras una promoción) | Ordenados por nivel y paralelo |
| Cualquier controlador `async` con un error no capturado | Con Express 4, el error **terminaba el proceso de Node** (p. ej. `GET /materias/<id inválido>`) | Responde `500 { error }` y el servidor sigue en pie (Express 5) |

Cambios del PR #1 que el frontend ya maneja: sin token o con token inválido se responde 401 (antes 404), y el interceptor del frontend redirige al login; un rol sin permiso recibe 403 (antes 401). El enlace de confirmación sigue sirviendo para crear la contraseña (`PATCH /nuevo-password/:token`), pero ahora caduca una hora después de confirmar.

## Rendimiento de la promoción (`POST /iniciar-periodo`)

Medido con `scripts/benchmark-promocion-v1.js` (35 cursos, 1 050 alumnos, 10 materias por curso, 10 500 documentos de notas):

| | Antes | Ahora |
|---|---|---|
| Consultas a la BDD | 795 | **13** (fijo, no depende del tamaño) |
| Tiempo local | 4,4 s | **0,9 s** |
| Estimado con 5 ms de latencia por consulta (Vercel → Atlas) | ~8,3 s | **~1,0 s** |

La lógica pasó del esquema de Mongoose a `src/services/promocion.js`: lee todo de una vez, decide en memoria con `Map` y escribe con operaciones masivas. Crear el año y promover van en **una transacción** si la BDD lo permite (MongoDB Atlas sí): si algo falla, no queda un año activo a medias.

## Código duplicado eliminado

- `src/validators/manejarErrores.js`: un solo middleware en lugar del mismo bloque copiado 41 veces.
- `reglasRegistroPersona`: las reglas de registro de administrador, profesor y representante eran idénticas.
- `crearModificadorUsuario`: los tres controladores `modificar*` eran la misma función.
- Los archivos de rutas usan `express.Router()`; antes cada uno creaba una aplicación Express completa.

## Dependencias

Todas en su última versión (`npm outdated` vacío, `npm audit` sin vulnerabilidades). Requiere **Node.js ≥ 20.19**.

| Paquete | Antes | Ahora | Ajustes necesarios |
|---|---|---|---|
| express | 4.21 | 5.3 | Comodín con nombre (`/api/*ruta`); `req.body` vuelve a ser `{}` sin cuerpo |
| mongoose | 8.16 | 9.12 | `new: true` → `returnDocument: 'after'` |
| bcryptjs | 2.4 | 3.0 | Ninguno: verifica los hashes `$2a$` existentes. Se quita `@types/bcryptjs`. |
| dotenv | 16 | 18 | Ninguno (`quiet: true`) |
| nodemailer | 6.10 | 10.5 | Ninguno; envío SMTP verificado |
| express-rate-limit | 7 | 8 | `ipKeyGenerator` para IPv6 |
| zod (v2) | 3 | 4 | Mensajes en español; `z.strictObject`, `z.email` |
| eslint / @eslint/js | 9 | 10 | `overrides` de `minimatch` para corregir una vulnerabilidad moderada |
