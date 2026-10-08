# Aula San Pedro · migración modular controlada

Origen de arquitectura: `Electroingenieria-SAS/AULA-EI` (rama `main`).
Destino: `adminterritorial-bit/Aula-san-pedro-` (rama `feat/migracion-arquitectura-aula-ei`).

## Estado
**Staging no desplegado. No constituye una versión funcional ni certificada.**
La raíz del repositorio conserva íntegramente la SPA municipal en servicio, su configuración de acceso Google y su flujo de publicación. El código React/Vite y el sistema visual se incorporaron en este directorio `modern/`, sin sustituir `main`.

### Trasladado
- React/Vite, shell, lazy loading, reproductor inmersivo, catálogo y panel del alumno
- Gestión de capacitaciones, preguntas y exámenes, usuarios, asignaciones, notificaciones, cumplimiento y certificados
- CSS modular, animations, diseño responsive, manejo de viewport móvil, PWA y utilidades de seguridad
- Interfaz MFA TOTP, validaciones de formularios, sanitización y herramientas de QA
- Cliente Supabase apuntando al proyecto **municipal**, y opción de Google OAuth con `hd=sanpedro-valle.gov.co`

### Excluido deliberadamente
- Cuentas, progreso, certificados, capacitaciones, evaluaciones o información empresarial de Electroingeniería
- Logotipos, fotografías empresariales y textos legales corporativos
- `service_role`, claves secretas, configuración del proveedor Google en el servidor
- Publicación de la app React, ejecución de SQL heredado o Edge Functions empresariales

### Diferencia crítica de modelo de datos
La implementación React de origen espera objetos `profiles`, `courses`, `enrollments`, `course_phases`, `content_blocks` y RPC de origen; la municipal se soporta en `aula_memberships`, `aula_courses`, `aula_assignments`, `aula_progress`, etc. La llamada inicial de perfil React fue dirigida a `aula_bootstrap()`, pero los módulos restantes **todavía requieren adaptación del repositorio, servicios y consultas**. No basta con renombrar tablas.

### Preservación obligatoria
- Proyecto municipal Supabase `dvdpgllezrmttrknbcjq`; no apuntar al de EI
- Identidad existente del administrador, UID, membresía, rol y Google OAuth
- Autenticación compartida con otros sistemas municipales; prohibido alterar `public.profiles` global o borrar `auth.users`
- La información de formación debe comenzar vacía, mediante **migraciones adicionales** y no `TRUNCATE` ni `DELETE` destructivos

### Desarrollo aislado
```bash
cd modern
npm ci
npm run build:staging
```
Node 24. El build verifica empaquetado, no la operación real contra la base de datos. Se requiere ejecutar la matriz de `QA.md` y migrar el contrato backend antes de sustituir el sitio existente.

**Licencias y titularidad**: verificar autorización de reutilización y divulgación del código de origen entre las dos organizaciones antes de fusionar o publicar esta rama. La disponibilidad de un repositorio público no equivale automáticamente a una licencia de redistribución.

## Interbloqueo de despliegue
Por defecto la versión React muestra una pantalla de migración sin acceder a los datos de Aula. La variable de compilación `VITE_MUNICIPAL_BACKEND_VERIFIED=true` activa el flujo interno **solamente después de reconciliar todas las tablas/RPC, auditar RLS, Google OAuth, y completar la matriz QA**. Esta variable NO es una barrera de autorización de seguridad, pues el backend debe verificar roles y pertenencia en cada operación.
