# Architecture Snapshot

> Auto-updated after each feature. Agents MUST read this before exploring the codebase.

## Installed shadcn/ui Components

alert-dialog, button, card, dropdown-menu, input, label, separator, sheet, spinner, sonner (toast)

_Add new components here after `shadcn add <component>`_

## DB Schema

| Table | Columns |
|-------|---------|
| `profiles` | id (uuid PK), email (unique), fullName (`full_name`), createdAt, updatedAt |
| `permissions` | id, key (unique), name, description, module, createdAt (RLS: select authenticated) |
| `roles` | id, slug (unique), name, description, isSystem, createdAt, updatedAt (RLS: select all; write `roles.manage`) |
| `role_permissions` | roleId, permissionId composite PK (RLS: select all; write `roles.manage`) |
| `user_roles` | id, userId → profiles, roleId → roles, createdAt, updatedAt (RLS: select own row) |
| `categories` | id, name, description, color, sortOrder, createdBy, createdAt, updatedAt (RLS: read all; write `categories.manage`) |
| `tags` | id, name (unique), createdAt (RLS: read/insert authenticated; update/delete `tags.manage`) |
| `documents` | id, title, description, fileName, storageObjectPath, sizeBytes, mimeType, categoryId, uploadedBy (nullable, SET NULL on user delete), createdAt, updatedAt, deletedAt (RLS: `documents.*` permissions + owner rules) |
| `document_tags` | documentId, tagId composite PK (RLS: linked to parent document permissions) |

RLS uses Postgres function `public.has_permission(text)` (SECURITY DEFINER).

_Migration scripts: `docs/MIGRATIONS.md`, `docs/sql/rbac-and-full-name.sql`_

## Existing Features

| Feature | Path | Description |
|---------|------|-------------|
| auth | `src/features/auth/` | Login/logout, cookie-based sessions via Supabase |
| user-admin | `src/features/user-admin/` | User CRUD (`users.manage`): full name, dynamic role, delete user |
| role-admin | `src/features/role-admin/` | Roles CRUD (`roles.manage`): `/admin/roles`, `/admin/roles/new`, `/admin/roles/[id]` |
| documents | `src/features/documents/` | Upload, list/search, detail, metadata, soft delete; Storage bucket `documents` |
| categories | `src/features/categories/` | Category CRUD (`categories.manage`) |
| tags | `src/features/tags/` | Tag CRUD (`tags.manage`) |

## Auth & Permissions (runtime)

| Module | Path | Notes |
|--------|------|-------|
| Session | `src/shared/lib/auth/get-session.ts` | `fullName`, `roleName`, `permissions[]` |
| Auth context | `src/shared/lib/auth/get-user-auth-context.ts` | Join role + permissions for user |
| Permission helpers | `src/shared/lib/auth/permissions.ts` | `hasPermission`, `hasAnyPermission`, `PERMISSION_KEYS` |
| RLS SQL helper | `src/shared/db/rls-sql.ts` | `hasPermission('key')` for Drizzle policies |

Catalog and rules: `.requirements/rbac.md`

## Shared UI

| Component | Path | Purpose |
|-----------|------|---------|
| IpsAppShell | `src/shared/components/ips-app-shell.tsx` | Sidebar; admin section by permissions |
| PageBreadcrumb | `src/shared/components/page-breadcrumb.tsx` | Navigable breadcrumbs |
| ConfirmDestructiveDialog | `src/shared/components/confirm-destructive-dialog.tsx` | AlertDialog for deletes |
| TableRowActionsMenu | `src/shared/components/table-row-actions-menu.tsx` | ⋯ row actions dropdown |

## Canonical Pattern References

| Pattern | File |
|---------|------|
| Server Action (mutation + redirect) | `src/features/documents/actions/upload-document.action.ts` |
| Server Action (ActionResult + toast client) | `src/features/documents/actions/update-document-metadata.action.ts` |
| Permission guard in action | `src/features/user-admin/actions/create-user.action.ts` |
| Query (repository) | `src/features/documents/queries/documents.queries.ts` |
| Client form + toast errors | `src/features/documents/components/upload-document-form.tsx` |
| Role editor page | `src/features/role-admin/components/RoleEditor.tsx` |
| Action test | `src/features/user-admin/__tests__/create-user.action.test.ts` |
| Supabase mock chain | `src/shared/test-utils/supabase-mock.ts` |

## Key Rules (summary)

- Runtime queries: Supabase client only — Drizzle is schema/migrations only
- All mutations: Server Actions returning `ActionResult` from `@/shared/lib/action-result` (or `redirect()` on success when navigation replaces toast)
- Auth check first in every Server Action; admin ops use `hasPermission(session.permissions, 'key')`
- Toast feedback required for every mutation (success + error) via `sonner` when the action returns state to the client
- RLS must be enabled on every table before a feature is considered complete
- UI text: Spanish | Code-level text: English (test descriptions, variable names)
- Coverage threshold: 95% statements/functions/lines, 90% branches

## Shared Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `formFieldText(formData, key)` | `src/shared/lib/form-utils.ts` | Safe `FormData` text extraction |
| `firstZodIssueMessage(error)` | `src/shared/lib/zod-utils.ts` | Extract first Zod validation error message |
| `readUploadFileBuffer(file)` | `src/shared/lib/upload-utils.ts` | Read upload to `ArrayBuffer` safely |

## Strict Rules Reference

Read `.claude/rules/` and `AGENTS.md` before writing code. TypeScript strict + ESLint `--max-warnings 0`.
