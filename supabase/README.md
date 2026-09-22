# Backend Supabase · Aula San Pedro

Proyecto: `dvdpgllezrmttrknbcjq`.

Este aplicativo comparte **Supabase Auth** con otros sistemas municipales, pero no comparte sus tablas de negocio. Todo el dominio LMS usa el prefijo `aula_`.

## Tablas

- `aula_memberships`
- `aula_courses`
- `aula_assignments`
- `aula_progress`
- `aula_exam_attempts`
- `aula_certificates`
- `aula_activity`

Las fases, bloques y preguntas se almacenan dentro de cada capacitación en JSONB para reducir joins, filas y llamadas. El progreso, evaluaciones y certificados se conservan normalizados para mantener trazabilidad.

## API RPC

El cliente no escribe directamente sobre las tablas. Usa:

- `aula_bootstrap()`
- `aula_save_course(jsonb)`
- `aula_assign_course(uuid,text,date)`
- `aula_unassign_course(uuid)`
- `aula_complete_block(text,text)`
- `aula_submit_exam(text,jsonb)`
- `aula_set_member_role(uuid,text)`
- `aula_set_member_active(uuid,boolean)`
- `aula_add_existing_user(text,text,text)`
- `aula_issue_certificate(uuid,text,integer)`
- `aula_mark_password_changed()`

## Edge Function

`aula-create-managed-user` crea una cuenta Auth únicamente cuando el correo todavía no existe. Si Auth ya contiene ese correo, el frontend reutiliza la cuenta mediante `aula_add_existing_user`.

La Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` únicamente en el entorno seguro de Supabase. El repositorio y el navegador solo contienen la publishable key.

## Migraciones aplicadas

- `create_aula_san_pedro_lms_v1`
- `add_aula_san_pedro_fk_indexes`

## Aislamiento de Auth compartido

Desactivar un usuario desde Aula cambia únicamente `aula_memberships.is_active`. No banea ni elimina la identidad global de Supabase, por lo que no afecta Hacienda, Documentos u otros aplicativos conectados al mismo Auth.
