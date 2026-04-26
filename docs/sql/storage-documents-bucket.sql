-- Run in Supabase SQL Editor after migrations (creates private bucket + policies).
-- Bucket name must match DOCUMENTS_STORAGE_BUCKET in src/features/documents/lib/documents-config.ts

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Path layout: {auth.uid}/{document_id}/{filename}
create policy "documents_storage_insert_own_prefix"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "documents_storage_select_authorized"
on storage.objects for select to authenticated
using (
  bucket_id = 'documents'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  )
);

create policy "documents_storage_update_own_prefix"
on storage.objects for update to authenticated
using (
  bucket_id = 'documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "documents_storage_delete_own_or_admin"
on storage.objects for delete to authenticated
using (
  bucket_id = 'documents'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  )
);
