# Contrato de integración: Aula EI → Aula San Pedro

> Estado: comparación confirmada por lectura del código de ambos repositorios. No se ha verificado el esquema real de la base municipal, por falta de permisos sobre `dvdpgllezrmttrknbcjq`. NO es una autorización para ejecutar SQL ni activar el nuevo frontend.

## 1. Autenticación y acceso

- Origen EI: autenticación Supabase con contraseña, perfil obtenido por `get_my_profile()`, funciones administrativas y `profiles`. Su tabla `public.profiles` **no debe trasladarse ni utilizarse** como fuente de autoridad de la Alcaldía.
- Destino municipal: Google institucional y otros métodos si el municipio los tiene habilitados, usando la sesión Auth compartida y `aula_bootstrap()` para membresía/rol.
- Conservar el UID del usuario superadministrador municipal que ya existe, sin inserciones automáticas ni ascensos adicionales.
- Comprobar dominio y membresía activa EN EL SERVIDOR; `hd` de Google es solo una pista visual y no un control de acceso.
- MFA TOTP con AAL2 para administrador/superadministrador debe reforzarse tanto en UI como en operaciones sensibles de backend.

## 2. Mapa de recursos de negocio

| Dominio | Origen React EI | Destino municipal actual | Adaptación |
|---|---|---|---|
| Perfil y permisos | `profiles`, `get_my_profile` | `aula_memberships`, `aula_bootstrap` | Usar exclusivamente membresía Aula y roles del municipio |
| Cursos | `courses`, `course_phases`, `content_blocks` | `aula_courses` con fases y bloques JSONB | Adaptador de curso JSONB hacia vista del editor React, con escritura por `aula_save_course` |
| Matrículas | `enrollments` | `aula_assignments`, `aula_bulk_assign_course`, `aula_unassign_course` | Convertir estructura y estados, sin joins directos empresariales |
| Progreso | `block_progress`, `complete_block` | `aula_progress`, `aula_complete_block` | Cambiar argumentos, autorización y ruta transaccional |
| Prácticas | `get_course_practice_question`, `check_course_practice_answer` | `aula_get_practice_question`, `aula_check_practice_answer` | Adaptar firmas y respuesta del servidor |
| Examen final | `get_exam_questions`, `submit_exam` | Preguntas en curso JSONB, `aula_submit_exam` | Banco seguro con entrega sin respuestas correctas, puntuación validada en servidor |
| Certificados | `get_certificate_by_code`, firmas y administración EI | `aula_certificates`, `aula_issue_certificate` | Rediseñar verificación pública, firma institucional y PDF sin trasladar certificados EI |
| Catálogo/home | `get_my_catalog_snapshot`, `get_my_home_snapshot` | `aula_bootstrap`, `aula_learning_analytics` | Crear adaptadores de snapshots sin lecturas a tablas ajenas |
| Notificaciones | `training_notifications` | `aula_experience_bootstrap`, `aula_mark_notification_read`, `aula_mark_all_notifications_read` | Sustituir todas las lecturas/escrituras directas |
| Formación avanzada | `job_positions`, `learning_paths`, `training_competencies`, reglas EI | `aula_training_admin_bootstrap`, `aula_training_save_position`, `aula_training_save_path`, `aula_training_save_competency`, `aula_training_sync_all` | Rediseñar repositorio de cumplimiento sin heredar tablas y automatizaciones corporativas |
| Usuarios | `set_user_role`, Edge Functions EI | `aula_add_existing_user`, `aula_bulk_set_member_active`, `aula-admin-users` | Mantener identidades Auth compartidas sin eliminación ni bloqueo global |
| Recursos | `course-assets` | `aula-course-assets` | Aislar bucket, políticas Storage, restricciones de tamaño y firmas de URL |
| Documentos legales | Contenido legal EI y flujos de conformidad | Textos y políticas institucionales por definir | Redactar y aprobar documentos propios de la Alcaldía, nunca reutilizar textos de EI |

## 3. Contratos RPC identificados en el frontend origen

- Estudiante: `get_my_home_snapshot`, `get_my_catalog_snapshot`, `get_my_course_route_access`, `get_course_practice_question`, `check_course_practice_answer`, `complete_block`, `get_exam_questions`, `submit_exam`.
- Certificados: `get_certificate_by_code`, `get_certificate_signatures`, `save_certificate_signature`, `clear_certificate_signature`, `admin_certificate_ranking`, `admin_completed_without_certificate`, `admin_generate_certificate`.
- Administración: `set_user_role`, `admin_training_engine_snapshot`, `admin_training_compliance_rows`, `admin_set_user_job_position`, `admin_sync_training_engine`.

Estas llamadas no tienen equivalencia garantizada en el servidor municipal. El frontend React migrado sigue dependiendo de varias de ellas.

## 4. Arquitectura requerida para cerrar brecha

```
React Components
    ↓
Application hooks / TanStack / estado y caché
    ↓
Municipal domain services (course, assessment, user, certificate, compliance)
    ↓
Municipal repository adapters (aula_bootstrap, aula_* RPC, storage)
    ↓
Supabase Auth + RLS + RPC del municipio
```

No permitir `supabase.from('profiles')`, `supabase.from('courses')`, `supabase.from('enrollments')` ni lecturas de tablas corporativas desde el frontend municipal. Es necesario sustituir cada acceso por los adaptadores municipales probados, no solamente prefijar nombres.

## 5. Migración de la base de datos

1. Obtener esquema real de `dvdpgllezrmttrknbcjq`, vistas, índices, políticas, grants, funciones y triggers con permisos de propietario.
2. Respaldar datos, roles y Auth; verificar que el único administrador existente mantenga su acceso.
3. Crear SQL **aditivo** estrictamente del dominio `aula_`; diseñar tablas faltantes solo después de inspeccionar las actuales.
4. Verificar `SECURITY DEFINER` con búsqueda de vulnerabilidades y `search_path` fijado, limitar `EXECUTE` a los roles correspondientes.
5. Probar con usuario externo, anónimo, estudiante, creador, revisor, admin y superadministrador en ambiente aislado.
6. Implementar Edge Functions nuevas específicas del municipio; no desplegar versiones originales de EI.
7. Aplicar en producción únicamente con revisión, respaldo, rollback y CI verdes.

## 6. Regla de activación

`VITE_MUNICIPAL_BACKEND_VERIFIED` permanece desactivada y muestra una portada de integración. Se habilita solo cuando todos los adaptadores, OAuth, rol administrativo, controles de seguridad, creación de curso y evaluación/certificación hayan pasado pruebas reales en el proyecto municipal. Esta bandera no es un control de acceso: la autorización debe existir en la base de datos.

**No importar cuentas, contenidos, resultados ni documentos empresariales**. El nuevo LMS se poblará desde cero por funcionarios autorizados.
