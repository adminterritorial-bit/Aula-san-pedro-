# Aula de Formación · San Pedro

Aplicativo web de formación institucional conectado al proyecto Supabase compartido `dvdpgllezrmttrknbcjq`.

## Arquitectura

- Frontend estático desplegable mediante GitHub Pages.
- Supabase Auth compartido con los demás aplicativos municipales.
- Dominio del Aula completamente aislado mediante objetos `aula_*`; no reutiliza `public.profiles` ni tablas de Hacienda/Documentos.
- Una sola RPC `aula_bootstrap()` carga el estado necesario al iniciar sesión.
- Después del arranque, cada acción persiste con una única RPC específica.
- Capacitaciones guardadas de forma compacta: fases, bloques y preguntas en JSONB; progreso, matrículas, intentos y certificados permanecen normalizados para conservar trazabilidad.
- RLS habilitado y tablas sin acceso directo para `anon`/`authenticated`; el cliente usa funciones `SECURITY DEFINER` con permisos explícitos.
- El primer usuario autenticado que ingrese al Aula se convierte, de manera transaccional, en `super_admin`. Los siguientes usuarios requieren membresía de Aula.
- Si un correo ya existe en Supabase Auth, se reutiliza esa identidad y solo se crea la membresía de Aula. No se duplica la cuenta.
- Desactivar una membresía en Aula no bloquea la cuenta Auth global, evitando afectar otros aplicativos que comparten el proyecto.

## Roles

`colaborador`, `creador_contenido`, `revisor`, `admin`, `super_admin`.

## Seguridad

La clave incluida en `js/supabase.js` es exclusivamente la clave **publishable** pública. No se almacena ninguna `service_role` en el repositorio. La creación de cuentas nuevas se realiza mediante la Edge Function protegida `aula-create-managed-user`.

## Despliegue

Cada `push` a `main` activa `.github/workflows/deploy-pages.yml` y publica el sitio en GitHub Pages.
