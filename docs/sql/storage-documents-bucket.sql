-- Bucket privado `documents` + políticas RLS de storage.objects.
-- Idempotente. Aplicar con: node scripts/apply-storage-policies.mjs
-- (o pegar en el SQL Editor de Supabase). Requiere la migración RBAC granular
-- aplicada (usa public.has_permission).
--
-- El nombre del bucket debe coincidir con DOCUMENTS_STORAGE_BUCKET en
-- src/features/documents/lib/documents-config.ts
-- Layout de rutas: {auth.uid}/{document_id}/{filename}

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- INSERT: solo bajo tu propio prefijo de usuario
drop policy if exists "documents_storage_insert_own_prefix" on storage.objects;
create policy "documents_storage_insert_own_prefix"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- SELECT: tus propios objetos, o si tienes documents.read (transversal)
drop policy if exists "documents_storage_select_authorized" on storage.objects;
create policy "documents_storage_select_authorized"
on storage.objects for select to authenticated
using (
  bucket_id = 'documents'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or (select public.has_permission('documents.read'))
  )
);

-- UPDATE: solo tus propios objetos
drop policy if exists "documents_storage_update_own_prefix" on storage.objects;
create policy "documents_storage_update_own_prefix"
on storage.objects for update to authenticated
using (
  bucket_id = 'documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- DELETE: tus propios objetos, o si tienes documents.delete
drop policy if exists "documents_storage_delete_own_or_admin" on storage.objects;
create policy "documents_storage_delete_own_or_admin"
on storage.objects for delete to authenticated
using (
  bucket_id = 'documents'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or (select public.has_permission('documents.delete'))
  )
);
