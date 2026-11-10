# Arquitectura de la API v2

Este documento explica **cómo se planificó la v2**: primero el dominio, luego los datos y por último el código. Esto corrige el problema de fondo de la v1, donde se empezó por las rutas y la base de datos se fue adaptando sobre la marcha.

## 1. Primero el dominio: quién hace qué

| Actor | Casos de uso |
|---|---|
| Administración | Gestionar cuentas, periodos, cursos, asignaturas, clases, estudiantes y matrículas. Justificar ausencias. Cerrar el año y promover estudiantes. |
| Profesor | Ver **sus** clases. Crear evaluaciones (con foto de evidencia) y calificar a los alumnos **de sus clases**. Tomar asistencia y registrar observaciones **en los cursos donde enseña**. |
| Representante | Consultar boletín, asistencia y observaciones **de sus hijos**. |

Las palabras en negrita son **reglas de autorización**. En la v1 no existían, y por eso cualquier usuario podía ver o modificar datos ajenos (IDOR). En la v2 están todas en un mismo archivo: `src/v2/shared/politicas.js`.

## 2. Después los datos: una colección por concepto

```
usuarios ─┬─< estudiantes.representantes        (un usuario puede tener varios roles)
          └─< clases.profesor

periodos ─┬─< clases >── cursos
          │      └──< evaluaciones ──< calificaciones >── estudiantes
          ├─< matriculas >── cursos, estudiantes
          ├─< asistencias >── estudiantes   (1 documento por estudiante y día)
          └─< observaciones >── estudiantes

asignaturas ─< clases
```

| Colección | Qué representa | Clave única |
|---|---|---|
| `usuarios` | Una persona con acceso; `roles: ['admin' \| 'profesor' \| 'representante']` | `email`, `cedula` |
| `estudiantes` | Alumno y sus representantes | `cedula` |
| `periodos` | Año lectivo: fechas, estado, ponderaciones, nota mínima | `nombre`; solo uno `activo` |
| `cursos` | Nivel + paralelo (el nombre se calcula) | `(nivel, paralelo)` |
| `asignaturas` | Catálogo ("Matemáticas") | `nombre` |
| `clases` | Asignatura dictada en un curso, en un periodo, por un profesor | `(periodo, curso, asignatura)` |
| `matriculas` | Estudiante en un curso durante un periodo | `(periodo, estudiante)` |
| `evaluaciones` | La tarea, prueba o examen, una sola vez por clase | — |
| `calificaciones` | La nota de un estudiante en una evaluación | `(evaluacion, estudiante)` |
| `asistencias` | Estado de un estudiante en un día | `(estudiante, fecha)` |
| `observaciones` | Nota de conducta o desempeño | — |

### Cambios respecto a la v1 y su motivo

| v1 | v2 | Por qué |
|---|---|---|
| `administradores`, `profesores` y `representantes` (casi idénticas) | `usuarios` con `roles` | Un login y un perfil únicos. La unicidad del email la garantiza la BDD. Permite que una persona sea profesor y también representante. |
| `Nota` por alumno con arrays de evaluaciones copiadas en cada alumno | `evaluaciones` + `calificaciones` | La evaluación existe una sola vez. Desaparecen `copiarEvaluacionesDeCurso` y `completarEvidenciaDesdeOtros`, que eran parches para sincronizar copias. |
| Evaluación identificada por el texto `"Deber 3"` | `_id` propio + `titulo` libre | Renombrar o borrar una evaluación no rompe nada. |
| `Materia` sin curso + array `materias` en el curso | `asignaturas` (catálogo) + `clases` | Se sabe exactamente qué profesor dicta qué, dónde y cuándo. |
| `CursoAsignado.estudiantes: [...]` | `matriculas` | Promover o cambiar de curso es crear o editar un documento, no mover IDs entre arrays. |
| `Asistencia.asistencia: [...]` (crece todo el año) + contador `faltas` | Un documento por día | Las faltas se **calculan**; no hay contador que se desincronice. |
| Fechas como texto (`"5/10/2024"` y `"2024/10/5"`) | `Date` | Se pueden ordenar y filtrar por rango. |
| `ponderaciones` como array leído como objeto | Objeto `{deber, taller, prueba, examen}` | Era la causa de promedios en 0. |
| Unicidad comprobada en el código | Índices únicos en MongoDB | El código puede fallar con dos peticiones simultáneas; la BDD no. |

## 3. Por último el código: capas con una sola responsabilidad

```
Petición HTTP
   │
   ▼
*.modulo.js     Rutas + esquemas zod + controlador
   │            · ruta: URL, rol permitido (autorizar), validar forma de los datos
   │            · controlador: lee req, llama al servicio, responde (sin lógica de negocio)
   ▼
*.servicio.js   Reglas de negocio y autorización fina (políticas)
   │            · no conoce Express (sin req/res) ni Mongoose
   │            · lanza errores tipados (NoEncontradoError, ProhibidoError, ...)
   ▼
*.repositorio.js  Única capa que habla con Mongoose
   │
   ▼
MongoDB (BDD "descubrir_v2")
```

- **Dominio puro**: `modules/calificaciones/dominio/promedios.js` no depende de nada. Calcula promedios y decide la promoción, y se prueba con tests simples.
- **Infraestructura detrás de interfaces**: el correo (`infra/mail`) y las imágenes (`infra/almacenamiento`) exponen `enviar()` y `subirImagen()`. Cambiar Imgur por S3 solo toca un archivo.
- **Inyección de dependencias**: `contenedor.js` es el único lugar donde se eligen las implementaciones. En las pruebas se pasan versiones falsas (mailer en memoria, almacenamiento falso).
- **Errores**: los servicios lanzan errores y un solo middleware (`manejarErrores.js`) los convierte en HTTP. Ya no hay `return { error }` ni `try/catch` repetidos en cada controlador.
- **Transacciones**: las operaciones que escriben en varias colecciones (crear estudiante con matrícula, promoción, borrar una evaluación con sus notas) usan `enTransaccion`: se guarda todo o nada.

### Cómo se aplican los principios

| Principio | Dónde se ve |
|---|---|
| **S** (responsabilidad única) | Rutas, controlador, servicio y repositorio separados. Los validadores solo validan la forma; no consultan la BDD. |
| **O** (abierto/cerrado) | Un rol nuevo solo requiere añadirlo a `roles.js` y a las políticas. |
| **L** (sustitución de Liskov) | Cualquier mailer o almacenamiento que cumpla la interfaz sirve: el real, el de consola o el falso de las pruebas. |
| **I** (segregación de interfaces) | Cada servicio recibe solo los repositorios que usa. |
| **D** (inversión de dependencias) | Los servicios reciben sus dependencias por parámetro y no importan Mongoose, Nodemailer ni axios. |
| **DRY** (no repetirse) | Esquemas de validación compartidos (`shared/esquemas.js`), un solo manejador de errores, una sola definición de roles. |

## 4. Seguridad

- Contraseñas con bcrypt. Ya no se envían contraseñas por correo: la persona crea la suya desde un enlace de activación válido 72 horas.
- Tokens de activación y recuperación aleatorios (`crypto`), de un solo uso, con caducidad y **guardados como hash**.
- El login devuelve el mismo error si el email no existe o si la contraseña es incorrecta, y tarda lo mismo en ambos casos. La recuperación responde igual exista o no el email.
- Límite de intentos en el login, la activación y la recuperación.
- El JWT se valida contra la BDD en cada petición: una cuenta desactivada pierde el acceso al instante.
- 401 cuando no hay sesión, 403 cuando falta permiso y 409 en conflictos.
- Imágenes validadas por tipo y tamaño **antes** de cargarlas en memoria.
- CORS configurable con `CORS_ORIGINS`.

## 5. Pruebas

| Tipo | Archivo | Requiere |
|---|---|---|
| Dominio | `tests/v2/dominio.test.js` | Nada |
| Políticas con repositorios falsos | `tests/v2/politicas.test.js` | Nada |
| API de punta a punta (año escolar completo y permisos) | `tests/v2/api.integracion.test.js` | MongoDB replica set |
| Migración v1 → v2 | `tests/v2/migracion.integracion.test.js` | MongoDB replica set |

```bash
npm test                     # sin MongoDB, las de integración se omiten
docker run -d -p 27017:27017 mongo:7 --replSet rs0
docker exec <id> mongosh --eval 'rs.initiate()'
npm run test:integracion     # todas
npm run lint
```
