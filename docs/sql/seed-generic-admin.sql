-- Usuario administrador genérico para desarrollo / bootstrap.
-- Ejecutar con Supabase CLI (usa DATABASE_URL de .env.local):
--   supabase db query --db-url "<DATABASE_URL>" -f docs/sql/seed-generic-admin.sql
--
-- Credenciales por defecto:
--   Correo: admin@sistema-documental.local
--   Contraseña: Admin12345

DO $$
DECLARE
  v_email text := 'admin@sistema-documental.local';
  v_password text := 'Admin12345';
  v_user_id uuid := gen_random_uuid();
  v_identity_id uuid := gen_random_uuid();
  v_instance uuid := '00000000-0000-0000-0000-000000000000';
  v_encrypted text;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(v_email)) THEN
    RAISE NOTICE 'Ya existe un usuario con correo %', v_email;
    RETURN;
  END IF;

  v_encrypted := crypt(v_password, gen_salt('bf'));

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new
  ) VALUES (
    v_user_id,
    v_instance,
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    false,
    false,
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_identity_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (v_user_id, v_email, now(), now());

  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (v_user_id, 'admin', now(), now());

  RAISE NOTICE 'Admin creado: % (id %)', v_email, v_user_id;
END $$;
