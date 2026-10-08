# Referencia SQL de Aula EI — NO APLICAR

Estos 31 archivos son fuentes de análisis heredadas, **no migraciones ejecutables para Aula San Pedro**.

**PROHIBIDO** ejecutar `supabase db push`, `psql -f` o copiar estos SQL al directorio real de migraciones municipales. Algunos contienen DDL/DML y funciones que actúan sobre `public.profiles`, `auth.users`, permisos, roles, y objetos ajenos al esquema municipal.

Antes de crear nuevas migraciones:
1. Conectar la cuenta dueña de `dvdpgllezrmttrknbcjq`; inventariar tablas, funciones, triggers, RLS, grants, extensiones, índices, políticas y las migraciones aplicadas.
2. Respaldar esquema, configuración Auth y contenido existente; identificar el UID del superadministrador sin divulgarlo.
3. Diseñar **migraciones aditivas** con prefijo `aula_` compatible con la implementación municipal y con tablas existentes.
4. Emplear funciones seguras (`SECURITY INVOKER` preferido; cuando definer es indispensable, fijar `search_path`, verificar `auth.uid()` y revocar ejecución por defecto).
5. Garantizar RLS en tablas expuestas, revisar privilegios de Data API, buckets privados, MFA para roles administradores y política institucional de correo.
6. Aplicar en ambiente de pruebas, ejecutar pruebas con `anon`/`authenticated`/administrador y revisar advisors antes de producción.
7. Crear formación, preguntas, intentos y certificados **desde cero**, sin transportar datos de EI.

El SQL de siembra de documentos legales empresariales **no** se copió.
