-- Bitácora de auditoría: tabla append-only + RPC de escritura + permiso audit.read.
-- Idempotente. Aplicar con: node scripts/apply-audit-log.mjs (o pegar en el SQL Editor).
-- Requiere la migración RBAC granular (usa public.has_permission).

-- 1) Permiso audit.read
INSERT INTO public.permissions (key, name, description, module) VALUES
  ('audit.read', 'Ver actividad', 'Consultar la bitácora de auditoría del sistema', 'audit')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'admin' AND p.key = 'audit.read'
ON CONFLICT DO NOTHING;

-- 2) profiles.last_login_at
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- 3) Tabla append-only
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_id_idx ON public.audit_log (actor_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON public.audit_log (action);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON public.audit_log (entity_type, entity_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Lectura: solo con audit.read. Sin políticas de INSERT/UPDATE/DELETE →
-- la tabla es de solo-anexar y solo escribible por la RPC SECURITY DEFINER.
DROP POLICY IF EXISTS audit_log_select_authorized ON public.audit_log;
CREATE POLICY audit_log_select_authorized ON public.audit_log
  FOR SELECT TO authenticated
  USING ((SELECT public.has_permission('audit.read')));

-- 4) RPC de escritura. Corre como definer (ignora RLS), sella el actor con
--    auth.uid() para que no se pueda falsificar quién hizo la acción.
CREATE OR REPLACE FUNCTION public.record_audit(
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_summary text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_log (actor_id, actor_email, action, entity_type, entity_id, summary, metadata)
  VALUES (
    auth.uid(),
    v_email,
    left(p_action, 100),
    left(p_entity_type, 60),
    left(p_entity_id, 200),
    left(p_summary, 500),
    coalesce(p_metadata, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_audit(text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_audit(text, text, text, text, jsonb) TO authenticated;
