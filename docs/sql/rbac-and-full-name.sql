-- RBAC + profiles.full_name migration
-- Run via: node scripts/apply-rbac-migration.mjs

-- 1) profiles.full_name
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

UPDATE public.profiles
SET full_name = split_part(email, '@', 1)
WHERE full_name IS NULL OR trim(full_name) = '';

ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;

-- 2) permissions catalog
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  module text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS permissions_select_authenticated ON public.permissions;
CREATE POLICY permissions_select_authenticated ON public.permissions
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- 3) roles
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_system boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_select_authenticated ON public.roles;
CREATE POLICY roles_select_authenticated ON public.roles
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- 4) role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT role_permissions_role_id_permission_id_pk PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_permissions_select_authenticated ON public.role_permissions;
CREATE POLICY role_permissions_select_authenticated ON public.role_permissions
  AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- 5) Seed permissions
INSERT INTO public.permissions (key, name, description, module) VALUES
  ('users.manage', 'Gestionar usuarios', 'Crear, eliminar y asignar roles a usuarios', 'users'),
  ('roles.manage', 'Gestionar roles', 'Crear, editar y eliminar roles y sus permisos', 'roles'),
  ('documents.read', 'Ver documentos', 'Listar y ver detalle de documentos', 'documents'),
  ('documents.create', 'Subir documentos', 'Cargar nuevos documentos', 'documents'),
  ('documents.update', 'Editar documentos', 'Editar metadatos de documentos', 'documents'),
  ('documents.delete', 'Eliminar documentos', 'Eliminar documentos del sistema', 'documents'),
  ('categories.manage', 'Gestionar categorías', 'CRUD de categorías documentales', 'categories'),
  ('tags.manage', 'Gestionar etiquetas', 'CRUD de etiquetas', 'tags')
ON CONFLICT (key) DO NOTHING;

-- 6) Seed system roles
INSERT INTO public.roles (slug, name, description, is_system) VALUES
  ('admin', 'Administrador', 'Acceso completo al sistema', true),
  ('user', 'Usuario administrativo', 'Gestión documental estándar', true)
ON CONFLICT (slug) DO NOTHING;

-- 7) Assign permissions to roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.key IN (
  'documents.read', 'documents.create', 'documents.update', 'documents.delete'
)
WHERE r.slug = 'user'
ON CONFLICT DO NOTHING;

-- 8) Migrate user_roles.role -> role_id
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_id uuid;

UPDATE public.user_roles ur
SET role_id = r.id
FROM public.roles r
WHERE ur.role_id IS NULL
  AND (
    (ur.role = 'admin' AND r.slug = 'admin')
    OR (ur.role = 'user' AND r.slug = 'user')
    OR (ur.role NOT IN ('admin', 'user') AND r.slug = 'user')
  );

UPDATE public.user_roles ur
SET role_id = (SELECT id FROM public.roles WHERE slug = 'user' LIMIT 1)
WHERE ur.role_id IS NULL;

ALTER TABLE public.user_roles ALTER COLUMN role_id SET NOT NULL;

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_roles_id_fk;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_id_roles_id_fk
  FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;

-- 9) has_permission function (before dropping legacy role column — policies still reference it)
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
      AND p.key = permission_key
  );
$$;

REVOKE ALL ON FUNCTION public.has_permission(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO authenticated;

-- 10) Roles / role_permissions manage policies
DROP POLICY IF EXISTS roles_insert_manage ON public.roles;
CREATE POLICY roles_insert_manage ON public.roles
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission('roles.manage')));

DROP POLICY IF EXISTS roles_update_manage ON public.roles;
CREATE POLICY roles_update_manage ON public.roles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission('roles.manage')))
  WITH CHECK ((SELECT public.has_permission('roles.manage')));

DROP POLICY IF EXISTS roles_delete_manage ON public.roles;
CREATE POLICY roles_delete_manage ON public.roles
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission('roles.manage')) AND NOT is_system);

DROP POLICY IF EXISTS role_permissions_insert_manage ON public.role_permissions;
CREATE POLICY role_permissions_insert_manage ON public.role_permissions
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission('roles.manage')));

DROP POLICY IF EXISTS role_permissions_delete_manage ON public.role_permissions;
CREATE POLICY role_permissions_delete_manage ON public.role_permissions
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission('roles.manage')));

-- 11) Update RLS policies to use has_permission
DROP POLICY IF EXISTS categories_insert_admin ON public.categories;
CREATE POLICY categories_insert_admin ON public.categories
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission('categories.manage')));

DROP POLICY IF EXISTS categories_update_admin ON public.categories;
CREATE POLICY categories_update_admin ON public.categories
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission('categories.manage')))
  WITH CHECK ((SELECT public.has_permission('categories.manage')));

DROP POLICY IF EXISTS categories_delete_admin ON public.categories;
CREATE POLICY categories_delete_admin ON public.categories
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission('categories.manage')));

DROP POLICY IF EXISTS tags_update_admin ON public.tags;
CREATE POLICY tags_update_admin ON public.tags
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission('tags.manage')))
  WITH CHECK (true);

DROP POLICY IF EXISTS tags_delete_admin ON public.tags;
CREATE POLICY tags_delete_admin ON public.tags
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission('tags.manage')));

DROP POLICY IF EXISTS documents_select_authenticated ON public.documents;
CREATE POLICY documents_select_authenticated ON public.documents
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    (SELECT public.has_permission('documents.read'))
    OR (uploaded_by = auth.uid() AND deleted_at IS NULL)
  );

DROP POLICY IF EXISTS documents_insert_authenticated ON public.documents;
CREATE POLICY documents_insert_authenticated ON public.documents
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.has_permission('documents.create'))
    AND uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS documents_update_authenticated ON public.documents;
CREATE POLICY documents_update_authenticated ON public.documents
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    (SELECT public.has_permission('documents.update'))
    OR uploaded_by = auth.uid()
  )
  WITH CHECK (
    (SELECT public.has_permission('documents.update'))
    OR uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS documents_delete_authenticated ON public.documents;
CREATE POLICY documents_delete_authenticated ON public.documents
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    (SELECT public.has_permission('documents.delete'))
    OR uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS document_tags_select_authenticated ON public.document_tags;
CREATE POLICY document_tags_select_authenticated ON public.document_tags
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_tags.document_id
      AND (
        (SELECT public.has_permission('documents.update'))
        OR (d.uploaded_by = auth.uid() AND d.deleted_at IS NULL)
      )
  ));

DROP POLICY IF EXISTS document_tags_insert_authenticated ON public.document_tags;
CREATE POLICY document_tags_insert_authenticated ON public.document_tags
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_tags.document_id
      AND (
        (SELECT public.has_permission('documents.update'))
        OR (d.uploaded_by = auth.uid() AND d.deleted_at IS NULL)
      )
  ));

DROP POLICY IF EXISTS document_tags_delete_authenticated ON public.document_tags;
CREATE POLICY document_tags_delete_authenticated ON public.document_tags
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_tags.document_id
      AND (
        (SELECT public.has_permission('documents.update'))
        OR (d.uploaded_by = auth.uid() AND d.deleted_at IS NULL)
      )
  ));

-- 12) Storage policies (if bucket policies reference user_roles.role)
DROP POLICY IF EXISTS documents_storage_select_authorized ON storage.objects;
CREATE POLICY documents_storage_select_authorized ON storage.objects
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      (SELECT public.has_permission('documents.read'))
      OR (owner = auth.uid())
    )
  );

DROP POLICY IF EXISTS documents_storage_delete_own_or_admin ON storage.objects;
CREATE POLICY documents_storage_delete_own_or_admin ON storage.objects
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      (SELECT public.has_permission('documents.delete'))
      OR (owner = auth.uid())
    )
  );

-- 13) Drop legacy role column after policies no longer depend on it
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS role;
