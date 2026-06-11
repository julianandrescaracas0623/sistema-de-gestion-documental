# Migraciones de base de datos

El esquema se define en `src/shared/db/*.schema.ts` (Drizzle). Las migraciones en `src/shared/db/migrations/` se generan con `pnpm db:generate`.

En este proyecto el journal de Drizzle puede desincronizarse con la BD real. Para cambios críticos existen **scripts SQL manuales** y runners en `scripts/`.

## Orden recomendado (entorno nuevo)

1. Aplicar migraciones Drizzle existentes o el estado base de Supabase.
2. Si falla `pnpm db:migrate` por journal desincronizado, usar los scripts de respaldo (abajo).
3. Ejecutar seed de administrador si no hay usuarios: `docs/sql/seed-generic-admin.sql`.

## Scripts de respaldo

| Script | Runner | Qué hace |
| --- | --- | --- |
| `docs/sql/preserve-documents-on-user-delete.sql` | `node scripts/apply-preserve-documents-migration.mjs` | `uploaded_by` nullable + `ON DELETE SET NULL`; políticas tags |
| `docs/sql/rbac-and-full-name.sql` | `node scripts/apply-rbac-migration.mjs` | `profiles.full_name`, tablas RBAC, `user_roles.role_id`, `has_permission()`, RLS |

Requisitos: `DATABASE_URL` en `.env.local` (modo sesión / Session pooler de Supabase).

```bash
node scripts/apply-preserve-documents-migration.mjs
node scripts/apply-rbac-migration.mjs
```

Cada runner es idempotente: detecta si el cambio ya está aplicado y no lo repite.

## RBAC (resumen)

Tras `apply-rbac-migration.mjs`:

- Catálogo `permissions` (8 claves fijas)
- Roles semilla `admin` y `user` con permisos asignados
- Función `public.has_permission(text)` usada en RLS
- Usuarios existentes migrados de `user_roles.role` → `user_roles.role_id`

Detalle funcional: [.requirements/rbac.md](../.requirements/rbac.md).

## Seed de administrador

```bash
# Con Supabase CLI y DATABASE_URL configurado
supabase db query --db-url "<DATABASE_URL>" -f docs/sql/seed-generic-admin.sql
```

Credenciales por defecto: `admin@sistema-documental.local` / `Admin12345`

> Requiere que la migración RBAC esté aplicada (tabla `roles` y columna `role_id`).
