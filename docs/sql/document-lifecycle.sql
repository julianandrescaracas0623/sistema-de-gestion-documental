-- Ciclo de vida documental: retención + purga.
-- Idempotente. Aplicar con: node scripts/apply-document-lifecycle.mjs
--
-- El "soft delete" ya NO borra el binario del storage (ver
-- soft-delete-document.action.ts); el objeto permanece hasta la purga por
-- retención o un borrado permanente explícito desde la papelera.

-- Fecha hasta la que el documento debe conservarse. Pasada esa fecha, la purga
-- puede hacer hard-delete (+ storage.remove). NULL = sin fecha de retención.
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS retention_until date;

-- Índice parcial para la consulta de la purga y del widget "por vencer".
CREATE INDEX IF NOT EXISTS documents_retention_until_idx
  ON public.documents (retention_until)
  WHERE retention_until IS NOT NULL;
