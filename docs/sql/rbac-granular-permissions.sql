-- Granular RBAC permissions (categories, tags, users, roles CRUD)
-- Run via: node scripts/apply-rbac-granular.mjs  OR apply manually in Supabase SQL editor

-- 1) New permission keys
INSERT INTO public.permissions (key, name, description, module) VALUES
  ('users.read', 'Ver usuarios', 'Listar usuarios del sistema', 'users'),
  ('users.create', 'Crear usuarios', 'Alta de nuevos usuarios', 'users'),
  ('users.update', 'Editar usuarios', 'Modificar datos de usuarios', 'users'),
  ('users.delete', 'Eliminar usuarios', 'Eliminar usuarios del sistema', 'users'),
  ('roles.read', 'Ver roles', 'Listar roles y permisos', 'roles'),
  ('roles.create', 'Crear roles', 'Crear nuevos roles', 'roles'),
  ('roles.update', 'Editar roles', 'Modificar roles y permisos', 'roles'),
  ('roles.delete', 'Eliminar roles', 'Eliminar roles no sistema', 'roles'),
  ('categories.read', 'Ver categorías', 'Listar categorías documentales', 'categories'),
  ('categories.create', 'Crear categorías', 'Crear categorías', 'categories'),
  ('categories.update', 'Editar categorías', 'Modificar categorías', 'categories'),
  ('categories.delete', 'Eliminar categorías', 'Eliminar categorías', 'categories'),
  ('tags.read', 'Ver etiquetas', 'Listar etiquetas', 'tags'),
  ('tags.create', 'Crear etiquetas', 'Crear etiquetas', 'tags'),
  ('tags.update', 'Editar etiquetas', 'Modificar etiquetas', 'tags'),
  ('tags.delete', 'Eliminar etiquetas', 'Eliminar etiquetas', 'tags')
ON CONFLICT (key) DO NOTHING;

-- 2) Migrate roles with legacy .manage → full CRUD for that module
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT DISTINCT rp.role_id, p_new.id
FROM public.role_permissions rp
JOIN public.permissions p_old ON p_old.id = rp.permission_id
JOIN public.permissions p_new ON (
  (p_old.key = 'users.manage' AND p_new.key LIKE 'users.%' AND p_new.key <> 'users.manage')
  OR (p_old.key = 'roles.manage' AND p_new.key LIKE 'roles.%' AND p_new.key <> 'roles.manage')
  OR (p_old.key = 'categories.manage' AND p_new.key LIKE 'categories.%' AND p_new.key <> 'categories.manage')
  OR (p_old.key = 'tags.manage' AND p_new.key LIKE 'tags.%' AND p_new.key <> 'tags.manage')
)
ON CONFLICT DO NOTHING;

-- 3) Admin role gets all new permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'admin'
  AND p.key IN (
    'users.read', 'users.create', 'users.update', 'users.delete',
    'roles.read', 'roles.create', 'roles.update', 'roles.delete',
    'categories.read', 'categories.create', 'categories.update', 'categories.delete',
    'tags.read', 'tags.create', 'tags.update', 'tags.delete'
  )
ON CONFLICT DO NOTHING;

-- 4) has_permission with legacy .manage alias
CREATE OR REPLACE FUNCTION public.has_permission(permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND (
        p.key = permission_key
        OR (permission_key LIKE 'users.%' AND p.key = 'users.manage')
        OR (permission_key LIKE 'roles.%' AND p.key = 'roles.manage')
        OR (permission_key LIKE 'categories.%' AND p.key = 'categories.manage')
        OR (permission_key LIKE 'tags.%' AND p.key = 'tags.manage')
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_permission(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO authenticated;

-- 5) RLS policies — categories
DROP POLICY IF EXISTS categories_insert_admin ON public.categories;
CREATE POLICY categories_insert_admin ON public.categories
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission('categories.create')));

DROP POLICY IF EXISTS categories_update_admin ON public.categories;
CREATE POLICY categories_update_admin ON public.categories
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission('categories.update')))
  WITH CHECK ((SELECT public.has_permission('categories.update')));

DROP POLICY IF EXISTS categories_delete_admin ON public.categories;
CREATE POLICY categories_delete_admin ON public.categories
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission('categories.delete')));

-- 6) RLS policies — tags
DROP POLICY IF EXISTS tags_insert_authenticated ON public.tags;
CREATE POLICY tags_insert_authenticated ON public.tags
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.has_permission('tags.create'))
    OR (SELECT public.has_permission('documents.create'))
  );

DROP POLICY IF EXISTS tags_update_admin ON public.tags;
CREATE POLICY tags_update_admin ON public.tags
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission('tags.update')))
  WITH CHECK (true);

DROP POLICY IF EXISTS tags_delete_admin ON public.tags;
CREATE POLICY tags_delete_admin ON public.tags
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission('tags.delete')));

-- 7) RLS policies — roles
DROP POLICY IF EXISTS roles_insert_manage ON public.roles;
CREATE POLICY roles_insert_manage ON public.roles
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission('roles.create')));

DROP POLICY IF EXISTS roles_update_manage ON public.roles;
CREATE POLICY roles_update_manage ON public.roles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission('roles.update')))
  WITH CHECK ((SELECT public.has_permission('roles.update')));

DROP POLICY IF EXISTS roles_delete_manage ON public.roles;
CREATE POLICY roles_delete_manage ON public.roles
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission('roles.delete')) AND NOT is_system);

DROP POLICY IF EXISTS role_permissions_insert_manage ON public.role_permissions;
CREATE POLICY role_permissions_insert_manage ON public.role_permissions
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission('roles.update')));

DROP POLICY IF EXISTS role_permissions_delete_manage ON public.role_permissions;
CREATE POLICY role_permissions_delete_manage ON public.role_permissions
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission('roles.update')));
