# API v2: referencia de endpoints

Base: `/api/v2`. Todas las rutas, salvo `/salud` y `/auth/{login,activar,recuperar,restablecer}`, requieren el header `Authorization: Bearer <token>`.

**Periodo por defecto:** las consultas aceptan `?periodo=<id>` para ver años anteriores; si no se indica, se usa el periodo activo. Solo se puede escribir en un periodo que no esté cerrado.

**Errores:** siempre con la forma `{ "error": "mensaje", "detalles"?: [...] }`.

| Código | Significado |
|---|---|
| 400 | Datos inválidos |
| 401 | Sin sesión o sesión inválida |
| 403 | Sin permiso |
| 404 | No existe |
| 409 | Conflicto (duplicado, periodo cerrado) |
| 429 | Demasiados intentos |

## Autenticación (`/auth`)
| Método | Ruta | Quién | Cuerpo / notas |
|---|---|---|---|
| POST | `/auth/login` | Público | `{ email, password }` → `{ token, usuario }` |
| POST | `/auth/activar` | Público | `{ token, password }` (token del correo de bienvenida) |
| POST | `/auth/recuperar` | Público | `{ email }` (responde igual exista o no) |
| POST | `/auth/restablecer` | Público | `{ token, password }` |
| GET | `/auth/perfil` | Sesión | |
| PATCH | `/auth/perfil` | Sesión | `{ nombre?, apellido?, email?, telefono?, direccion? }` |
| PATCH | `/auth/password` | Sesión | `{ actual, nueva }` → 204 |

## Usuarios (`/usuarios`, solo admin)
| Método | Ruta | Cuerpo / notas |
|---|---|---|
| POST | `/usuarios` | `{ nombre, apellido, cedula, email, telefono, direccion, roles: ['profesor', ...] }`. Envía un correo de activación. |
| GET | `/usuarios?rol=profesor&activo=true` | |
| GET / PATCH / DELETE | `/usuarios/:id` | DELETE desactiva la cuenta (nunca deja el sistema sin admin) |
| POST | `/usuarios/:id/reenviar-activacion` | |

## Periodos (`/periodos`)
| Método | Ruta | Quién | Cuerpo / notas |
|---|---|---|---|
| GET | `/periodos`, `/periodos/activo` | Sesión | |
| POST | `/periodos` | Admin | `{ nombre: '2025-2026', inicio: 'AAAA-MM-DD', fin?, ponderaciones?, notaMinima?, nivelMinimoReprobacion? }` → planificado |
| PATCH | `/periodos/:id` | Admin | `{ ponderaciones?, notaMinima?, nivelMinimoReprobacion?, fin? }` (las ponderaciones deben sumar 100) |
| POST | `/periodos/:id/activar`, `/periodos/:id/cerrar` | Admin | |
| GET | `/periodos/:id/promocion` | Admin | Vista previa: quién aprueba o repite, sin guardar nada |
| POST | `/periodos/:id/promocion` | Admin | `{ destino, copiarClases? }`: matricula en el periodo destino (idempotente) |

## Catálogo académico
| Método | Ruta | Quién | Cuerpo / notas |
|---|---|---|---|
| GET / POST | `/cursos` | Sesión / Admin | `{ nivel: 1-7, paralelo: 'A'-'E' }` |
| GET / POST | `/asignaturas` | Sesión / Admin | `{ nombre }` |
| PATCH | `/asignaturas/:id` | Admin | `{ nombre?, activo? }` |
| GET | `/clases?curso=&profesor=&periodo=` | Admin (todas) o profesor (solo las suyas) | |
| POST | `/clases` | Admin | `{ curso, asignatura, profesor, periodo? }` |
| PATCH | `/clases/:id` | Admin | `{ profesor }` (cambiar docente) |
| DELETE | `/clases/:id` | Admin | Desactiva |

## Estudiantes y matrículas
| Método | Ruta | Quién | Cuerpo / notas |
|---|---|---|---|
| POST | `/estudiantes` | Admin | `{ nombre, apellido, cedula, representantes: [id], curso? }`. Si se indica `curso`, se matricula en el periodo activo (en una transacción). |
| GET | `/estudiantes/mios` | Representante | Sus estudiantes con el curso actual |
| GET | `/estudiantes/:id` | Admin, su profesor o su representante | Detalle + representantes + matrícula |
| PATCH / DELETE | `/estudiantes/:id` | Admin | |
| POST | `/estudiantes/:id/representantes` | Admin | `{ representante }` |
| DELETE | `/estudiantes/:id/representantes/:representanteId` | Admin | |
| POST | `/matriculas` | Admin | `{ estudiante, curso, periodo? }` |
| PATCH | `/matriculas/:id` | Admin | `{ curso }` (cambio de curso) |
| POST | `/matriculas/:id/retiro` | Admin | |
| GET | `/cursos/:cursoId/estudiantes` | Admin o profesor del curso | |

## Evaluaciones, calificaciones y boletín
| Método | Ruta | Quién | Cuerpo / notas |
|---|---|---|---|
| POST | `/clases/:claseId/evaluaciones` | Profesor de la clase o admin | `multipart/form-data`: `tipo` (deber/taller/prueba/examen), `titulo`, `descripcion?`, `fecha?`, `evidencia?` (imagen ≤ 10 MB) |
| GET | `/clases/:claseId/evaluaciones?tipo=` | Profesor de la clase o admin | |
| PATCH / DELETE | `/evaluaciones/:id` | Profesor de la clase o admin | DELETE también borra sus notas (transacción) |
| GET | `/evaluaciones/:id/calificaciones` | Profesor de la clase o admin | Planilla: todos los alumnos del curso con su nota o `null` |
| PUT | `/evaluaciones/:id/calificaciones` | Profesor de la clase o admin | `{ calificaciones: [{ estudiante, nota }] }`. Registra o corrige; solo alumnos del curso. |
| GET | `/estudiantes/:id/boletin` | Admin, su profesor o su representante | Promedios por tipo y final por materia, más el resultado del año |

## Asistencia
| Método | Ruta | Quién | Cuerpo / notas |
|---|---|---|---|
| PUT | `/cursos/:cursoId/asistencias` | Admin o profesor del curso | `{ fecha?: 'AAAA-MM-DD', registros: [{ estudiante, estado: presente/ausente/atraso }] }`. Idempotente. |
| GET | `/cursos/:cursoId/asistencias?fecha=` | Admin o profesor del curso | Lista del día |
| PATCH | `/asistencias/:id/justificacion` | Admin | `{ justificacion }` |
| GET | `/estudiantes/:id/asistencias` | Admin, su profesor o su representante | Registros + resumen calculado |

## Observaciones
| Método | Ruta | Quién | Cuerpo |
|---|---|---|---|
| POST | `/estudiantes/:id/observaciones` | Admin o profesor del estudiante | `{ texto }` |
| GET | `/estudiantes/:id/observaciones` | Admin, su profesor o su representante | |
