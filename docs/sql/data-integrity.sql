-- Integridad de datos (T2b): constraints únicos que faltaban + RPCs
-- transaccionales para las escrituras de varios pasos de roles y etiquetas.
-- Idempotente. Aplicar con: node scripts/apply-data-integrity.mjs
-- Requiere la migración RBAC granular (RLS de roles/role_permissions/tags/document_tags).

-- 1) categories.name único (case-insensitive, como ya la validan las acciones
--    con ilike). Falla si ya existen duplicados — revisa antes de reintentar:
--      SELECT lower(name), count(*) FROM public.categories GROUP BY 1 HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_lower_idx
  ON public.categories (lower(name));

-- 2) user_roles.user_id único — un solo rol por usuario (ya era la intención
--    del diseño; no estaba forzado a nivel de base de datos).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_unique'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 3) RPC: crear rol + asignar permisos en una sola transacción.
--    SECURITY INVOKER — corre con los permisos del llamante; las mismas
--    políticas RLS de roles/role_permissions siguen aplicando.
CREATE OR REPLACE FUNCTION public.create_role_with_permissions(
  p_slug text,
  p_name text,
  p_description text,
  p_permission_keys text[]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role_id uuid;
  v_perm_count int;
BEGIN
  INSERT INTO public.roles (slug, name, description, is_system)
  VALUES (p_slug, p_name, p_description, false)
  RETURNING id INTO v_role_id;

  SELECT count(*) INTO v_perm_count FROM public.permissions WHERE key = ANY(p_permission_keys);
  IF v_perm_count <> cardinality(p_permission_keys) THEN
    RAISE EXCEPTION 'invalid_permission_keys';
  END IF;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_role_id, p.id FROM public.permissions p WHERE p.key = ANY(p_permission_keys);

  RETURN v_role_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_role_with_permissions(text, text, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_role_with_permissions(text, text, text, text[]) TO authenticated;

-- 4) RPC: actualizar rol + reemplazar sus permisos en una sola transacción.
--    Devuelve false (en vez de error) si el UPDATE no afectó filas — mismo
--    significado que el "éxito silencioso" que ya detectan las acciones
--    (RLS bloqueó la fila o el rol no existe).
CREATE OR REPLACE FUNCTION public.update_role_with_permissions(
  p_role_id uuid,
  p_name text,
  p_description text,
  p_permission_keys text[]
) RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_updated int;
  v_perm_count int;
BEGIN
  UPDATE public.roles
  SET name = p_name, description = p_description, updated_at = now()
  WHERE id = p_role_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO v_perm_count FROM public.permissions WHERE key = ANY(p_permission_keys);
  IF v_perm_count <> cardinality(p_permission_keys) THEN
    RAISE EXCEPTION 'invalid_permission_keys';
  END IF;

  DELETE FROM public.role_permissions WHERE role_id = p_role_id;
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT p_role_id, p.id FROM public.permissions p WHERE p.key = ANY(p_permission_keys);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.update_role_with_permissions(uuid, text, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_role_with_permissions(uuid, text, text, text[]) TO authenticated;

-- 5) RPC: reemplazar las etiquetas de un documento en una sola transacción
--    (upsert de tags nuevas + relink). Antes era un loop de selects/inserts
--    en la Server Action: una falla a mitad de camino dejaba el documento
--    con etiquetas parciales o sin ninguna.
CREATE OR REPLACE FUNCTION public.sync_document_tags(
  p_document_id uuid,
  p_tag_names text[]
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.document_tags WHERE document_id = p_document_id;

  IF p_tag_names IS NULL OR cardinality(p_tag_names) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.tags (name)
  SELECT DISTINCT t.name FROM unnest(p_tag_names) AS t(name)
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO public.document_tags (document_id, tag_id)
  SELECT p_document_id, tg.id
  FROM public.tags tg
  WHERE tg.name = ANY(p_tag_names);
END;
$$;

REVOKE ALL ON FUNCTION public.sync_document_tags(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_document_tags(uuid, text[]) TO authenticated;
