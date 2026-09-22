# Hallazgos de seguridad

Historial acumulado de hallazgos encontrados por revisiones manuales y por la
skill `pentest-qa`. Nunca se sobreescribe: cada corrida agrega entradas nuevas.

## [2026-09-21] RLS deshabilitado en profiles — Crítico

- **Estado:** Corregido ✅
- **Dónde:** `src/shared/db/profiles.schema.ts`, `docs/sql/profiles-personal-info.sql`
- **Descripción:** `public.profiles` no tenía RLS habilitado. Cualquier usuario
  autenticado podía leer o escribir el perfil de **cualquier** otro usuario vía
  `/rest/v1/profiles`, sin pasar por la app — incluyendo, tras la feature de
  perfil, documento y teléfono. Confirmado con
  `mcp__supabase__get_advisors(type: "security")` → `rls_disabled_in_public`.
- **Fix:** se agregó `.enableRLS()` + políticas `select`/`update` self-or-admin
  (`id = auth.uid() OR has_permission('users.read'/'users.update')`), calcadas
  del patrón ya usado en `documents.schema.ts`. Verificado: el hallazgo ya no
  aparece en `get_advisors` tras aplicar la migración.

## [2026-09-21] "Ver documento" permitía descargar — Alto

- **Estado:** Corregido ✅
- **Dónde:** `src/shared/lib/auth/permissions.ts`,
  `src/app/api/documents/[id]/download/route.ts`,
  `src/app/api/documents/export/route.ts`,
  `src/app/(protected)/documents/[id]/page.tsx`
- **Descripción:** el modelo de permisos solo tenía `documents.read` — no
  existía un permiso de "descargar" separado de "ver". Cualquier usuario con
  permiso de lectura podía descargar el documento (botón visible) y golpear la
  ruta de descarga directamente, sin chequeo server-side adicional. Los roles
  reales `user` y `recepcion` en producción solo tenían `documents.read`, es
  decir, eran exactamente el caso que reportó el jurado.
- **Fix:** se agregó el permiso `documents.download` (catálogo + otorgado solo
  a `admin`), se gateó el botón "Descargar", "Descargar seleccionados" y ambas
  rutas de descarga en ese permiso, y se ocultó el ícono nativo de
  descarga/impresión del visor de PDF (`#toolbar=0&navpanes=0`) cuando el
  usuario no tiene el permiso.

## [2026-09-21] Falla al subir documentos reales — Medio

- **Estado:** Corregido ✅
- **Dónde:** `next.config.ts`
- **Descripción:** Next.js limita el body de las Server Actions a 1 MB por
  defecto; el sistema anuncia y valida hasta 25 MB
  (`DOCUMENT_UPLOAD_MAX_MB`). Cualquier archivo real subido en la demo (>1 MB)
  era rechazado por Next antes de llegar a la Server Action. Confirmado
  cruzando los logs de Supabase del día (`mcp__supabase__query_logs`): no hay
  ningún intento de subida fallido registrado, es decir, el request nunca
  llegó a Supabase.
- **Fix:** se agregó `experimental.serverActions.bodySizeLimit: "30mb"`.

## [2026-09-21] Funciones SECURITY DEFINER expuestas a anon/authenticated — Bajo

- **Estado:** Sugerido (revisar) ⚠️
- **Dónde:** función `public.has_permission(text)` y `public.record_audit(...)`
- **Descripción:** ambas funciones son `SECURITY DEFINER` y son ejecutables por
  los roles `anon` y `authenticated` vía RPC (`/rest/v1/rpc/has_permission`,
  `/rest/v1/rpc/record_audit`). `has_permission` es de solo lectura y
  relativamente segura de exponer, pero `record_audit` permite insertar
  entradas de auditoría arbitrarias si se llama directamente por RPC en lugar
  de a través de las Server Actions que la invocan hoy.
- **Fix sugerido:** revisar si `record_audit` necesita ser callable por
  `authenticated` directamente, o si debería restringirse (`REVOKE EXECUTE FROM
  authenticated`) y quedar accesible solo vía `SECURITY DEFINER` interno desde
  otras funciones/RPCs ya controladas. No se tocó porque cambia el contrato de
  una función que otras partes del sistema ya invocan — requiere revisión antes
  de aplicar.

## [2026-09-21] Protección de contraseñas filtradas deshabilitada — Bajo

- **Estado:** Sugerido (revisar) ⚠️
- **Dónde:** configuración de Supabase Auth (no es código de la app)
- **Descripción:** Supabase Auth no tiene activada la verificación contra
  HaveIBeenPwned al crear/cambiar contraseñas.
- **Fix sugerido:** activar "Leaked password protection" en Supabase ▸
  Authentication ▸ Policies. No se aplicó automáticamente porque es un cambio
  de configuración de un servicio externo, no un fix de código.
