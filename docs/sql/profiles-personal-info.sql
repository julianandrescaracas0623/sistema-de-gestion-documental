-- Splits profiles.full_name into first_name/last_name and adds document_number
-- + phone so users can complete their own basic personal info from /perfil
-- (jury feedback). Also enables RLS on profiles, which had none before this —
-- any authenticated user could otherwise read/write every profile via the
-- Supabase REST API, and this table is about to hold more sensitive data.
-- Run via: node scripts/apply-profiles-personal-info.mjs  OR apply manually in Supabase SQL editor

-- 1) New columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 2) Best-effort backfill from full_name (split on first space)
UPDATE public.profiles
SET
  first_name = COALESCE(NULLIF(split_part(trim(full_name), ' ', 1), ''), split_part(email, '@', 1)),
  last_name = COALESCE(
    NULLIF(trim(substring(trim(full_name) from length(split_part(trim(full_name), ' ', 1)) + 1)), ''),
    '-'
  )
WHERE first_name IS NULL OR last_name IS NULL;

ALTER TABLE public.profiles ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN last_name SET NOT NULL;

-- 3) full_name is superseded by first_name + last_name
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;

-- 4) Enable RLS (was previously disabled — public.profiles was fully exposed)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_self_or_admin ON public.profiles;
CREATE POLICY profiles_select_self_or_admin ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (SELECT public.has_permission('users.read'))
  );

DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;
CREATE POLICY profiles_update_self_or_admin ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR (SELECT public.has_permission('users.update'))
  )
  WITH CHECK (
    id = auth.uid()
    OR (SELECT public.has_permission('users.update'))
  );
