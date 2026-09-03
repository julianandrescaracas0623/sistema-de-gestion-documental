# Migraciones de base de datos

El esquema se define en `src/shared/db/*.schema.ts` (Drizzle). Las migraciones en
`src/shared/db/migrations/` se generan con `pnpm db:generate`.

Históricamente el journal de Drizzle se ha desincronizado con la BD real, así que
los cambios críticos (RBAC, storage, FKs) viven como **SQL idempotente** en
`docs/sql/` con runners en `scripts/`. Todo se aplica con un solo comando.

## Puesta a punto — un comando

```bash
# 1. Configura DATABASE_URL en .env.local (Supabase > Database > Session mode, URI)
# 2.
pnpm db:setup              # aplica todo lo pendiente (idempotente)
pnpm db:setup -- --seed    # + usuario admin semilla + categorías
```

`pnpm db:setup` ejecuta, en orden:

| # | Paso | Qué hace | Si falla |
|---|------|----------|----------|
| 1 | `drizzle-kit migrate` | Esquema base (`documents`, `categories`, `tags`, `profiles`, …) | Se avisa y continúa — los pasos 2–5 reconcilian el estado |
| 2 | `scripts/apply-preserve-documents-migration.mjs` | `documents.uploaded_by` nullable + `ON DELETE SET NULL`; sincroniza el journal | Aborta |
| 3 | `scripts/apply-rbac-migration.mjs` | Tablas `permissions` / `roles` / `role_permissions`, `user_roles.role_id`, `public.has_permission()`, RLS base; migra `user_roles.role` → `role_id` | Aborta |
| 4 | `scripts/apply-rbac-granular.mjs` | Claves de permiso CRUD por módulo (`categories.create`, …), backfill de roles con `*.manage`, `has_permission()` con alias `*.manage`, políticas RLS de categorías/tags/roles; borra la función obsoleta `documents_uploader_role` | Aborta |
| 5 | `scripts/apply-storage-policies.mjs` | Bucket privado `documents` + políticas RLS de `storage.objects` (usan `has_permission`) | Aborta |
| 6 | `scripts/apply-audit-log.mjs` | Tabla `audit_log` (append-only), RPC `record_audit()` `SECURITY DEFINER`, permiso `audit.read`, `profiles.last_login_at` | Aborta |
| 7 | `scripts/apply-document-lifecycle.mjs` | `documents.retention_until` (fecha) + índice parcial | Aborta |
| 8 | seeds (solo `--seed`) | `docs/sql/seed-generic-admin.sql` + `docs/sql/seed-categories.sql` | Marca error, no aborta |

Cada runner es **idempotente**: detecta si su cambio ya está aplicado y no lo
repite. Se puede correr las veces que haga falta.

## Aplicar manualmente (sin Node / desde el SQL Editor de Supabase)

Pega el contenido de estos archivos, en este orden, en el SQL Editor:

```
docs/sql/preserve-documents-on-user-delete.sql
docs/sql/rbac-and-full-name.sql
docs/sql/rbac-granular-permissions.sql
docs/sql/storage-documents-bucket.sql
docs/sql/audit-log.sql
docs/sql/document-lifecycle.sql
docs/sql/seed-generic-admin.sql      (opcional)
docs/sql/seed-categories.sql         (opcional)
```

## RBAC (resumen)

Tras los pasos 3–4:

- Catálogo `permissions` con 20 claves granulares (`<módulo>.<acción>`) + alias
  legacy `<módulo>.manage`.
- Roles semilla `admin` (todos los permisos) y `user` (CRUD de documentos).
- Función `public.has_permission(text)` usada en RLS, con fallback: un permiso
  `categories.create` también se concede si el usuario tiene `categories.manage`.
- Usuarios existentes migrados de `user_roles.role` (texto) → `user_roles.role_id` (FK).

Detalle funcional: [.requirements/rbac.md](../.requirements/rbac.md).

## Seed de administrador

`pnpm db:setup -- --seed` lo crea. Credenciales por defecto:

```
admin@sistema-documental.local  /  Admin12345
```

> **Cambia esa contraseña en el primer inicio de sesión.** El seed es idempotente:
> si el usuario ya existe, no hace nada.

## Notas

- `scripts/apply-role-function.mjs` está **obsoleto** — no lo ejecutes (ver el
  comentario en el archivo).
- Un despliegue nuevo que solo corre `pnpm db:migrate` **no** obtiene el RBAC ni
  el bucket. Usa `pnpm db:setup`.
