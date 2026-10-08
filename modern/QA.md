# Criterios de aceptación antes de la sustitución

- [ ] Autorización de reutilización del código entre las dos organizaciones verificada
- [ ] Auditoría integral de Supabase municipal (no disponible en la conexión actual)
- [ ] Respaldo verificable de usuarios y objetos municipales existentes
- [ ] Mantener exactamente el usuario administrador existente y su UID/rol
- [ ] Google OAuth en la URL municipal funcional; denegar acceso por dominio externo y por falta de membresía **en servidor**
- [ ] MFA TOTP AAL2 obligatorio y validado en servidor para administradores
- [ ] Tabla y RPC municipal con restricciones RLS/grants testeadas para usuarios desautorizados
- [ ] Editor modular: bloques, imágenes, zoom, preguntas, exámenes y revisión de contenidos
- [ ] Reproductor: fin de pantalla inmersiva avanza al bloque correcto, sin bucles de evaluación
- [ ] Resultado de examen y generación de certificados autenticados, trazables, sin manipulación del cliente
- [ ] Gestión de asignaciones, notificaciones, ranking, privacidad y cumplimiento
- [ ] Sin cursos, contenidos, usuarios empresariales ni datos históricos importados
- [ ] Verificación responsive 320/360/390/768/1024/1440 px y navegación por teclado
- [ ] Smoke browser, pruebas de seguridad, CI y compilación verdes
- [ ] Revisión PWA, CSP, caché y prevención de publicaciones antiguas
- [ ] Entorno de staging aprobado, cambio de versión reversible y rollback documentado

Hasta completar estos criterios se mantiene el frontend actual en `main`. 
