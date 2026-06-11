# RBAC — Roles y permisos

**Ámbito:** control de acceso basado en roles dinámicos con catálogo fijo de permisos.

## Modelo

| Entidad | Descripción |
| --- | --- |
| `permissions` | Catálogo fijo de claves (`key`) agrupadas por `module` |
| `roles` | Roles creados por administrador (`slug`, `name`, `is_system`) |
| `role_permissions` | Asignación N:M rol ↔ permiso |
| `user_roles.role_id` | Un rol por usuario (FK a `roles`) |

La función Postgres `public.has_permission(text)` (SECURITY DEFINER) resuelve si `auth.uid()` tiene una clave vía su rol. Las políticas RLS y los guards en server actions usan estas claves.

## Catálogo inicial de permisos

| key | Uso |
| --- | --- |
| `users.manage` | CRUD usuarios |
| `roles.manage` | CRUD roles y matriz de permisos |
| `documents.read` | Ver listado y detalle |
| `documents.create` | Subir documentos |
| `documents.update` | Editar metadatos (propios o todos si el rol lo permite) |
| `documents.delete` | Eliminar documentos |
| `categories.manage` | CRUD categorías |
| `tags.manage` | CRUD etiquetas |

## Roles semilla

| slug | Nombre | Permisos |
| --- | --- | --- |
| `admin` | Administrador | Todos (`is_system: true`) |
| `user` | Usuario administrativo | `documents.*` (`is_system: true`) |

## Rutas de administración

| Ruta | Permiso | Descripción |
| --- | --- | --- |
| `/admin/users` | `users.manage` | Listado, alta (nombre + rol), eliminación |
| `/admin/roles` | `roles.manage` | Listado de roles (tarjetas) |
| `/admin/roles/new` | `roles.manage` | Crear rol + matriz de permisos |
| `/admin/roles/[id]` | `roles.manage` | Editor dedicado: datos del rol + permisos |
| `/admin/categories` | `categories.manage` | CRUD categorías |
| `/admin/tags` | `tags.manage` | CRUD etiquetas |

## Reglas de negocio

- Solo quien tenga `roles.manage` accede a las rutas de roles y puede crear/editar/eliminar roles.
- Roles `is_system: true` no se eliminan; se pueden editar permisos y descripción.
- No se elimina un rol con usuarios asignados.
- Alta de usuarios: selector dinámico de roles; guard `users.manage`.
- Sidebar «Administración»: visible si el usuario tiene alguno de `users.manage`, `roles.manage`, `categories.manage`, `tags.manage`.
- Documentos: `update`/`delete` = permiso **o** `uploaded_by = auth.uid()`.

## Migración

Script manual: `docs/sql/rbac-and-full-name.sql`  
Aplicar: `node scripts/apply-rbac-migration.mjs`

## Fuera de alcance

- Crear nuevas claves de permiso desde la UI (solo catálogo seed).
- Edición de nombre de usuarios existentes (iteración futura).
