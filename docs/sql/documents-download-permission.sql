-- Splits "download" out of "read" for documents: a role that can only view a
-- document should not automatically be able to download it (jury feedback).
-- Run via: node scripts/apply-documents-download-permission.mjs  OR apply manually in Supabase SQL editor

-- 1) New permission key
INSERT INTO public.permissions (key, name, description, module) VALUES
  ('documents.download', 'Descargar documentos', 'Descargar el archivo original de un documento', 'documents')
ON CONFLICT (key) DO NOTHING;

-- 2) Admin keeps full access, including download. Other existing roles
-- (e.g. "user", "recepcion") currently hold only documents.read and must
-- request "documents.download" explicitly via the role editor.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'admin'
  AND p.key = 'documents.download'
ON CONFLICT DO NOTHING;
