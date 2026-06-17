# Guía de despliegue — Vercel + GitHub Pages

Este proyecto usa un esquema **híbrido**:

| Destino | Qué se publica | URL esperada |
|---------|----------------|--------------|
| **Vercel** | Aplicación Next.js completa (auth, documentos, admin) | `https://sistema-de-gestion-documental.vercel.app` |
| **GitHub Pages** | Landing estática del proyecto de grado | `https://julianandrescaracas0623.github.io/sistema-de-gestion-documental/` |

> Tras el primer deploy en Vercel, actualiza la URL real en `docs/index.html` (botón «Acceder al sistema») y en `NEXT_PUBLIC_APP_URL`.

---

## 1. Vercel — aplicación en producción

### 1.1 Importar el repositorio

1. Entra en [vercel.com/new](https://vercel.com/new).
2. Conecta tu cuenta de GitHub e importa `sistema-de-gestion-documental`.
3. Framework: **Next.js** (detección automática).
4. Build Command: `pnpm build`
5. Install Command: `pnpm install`

### 1.2 Variables de entorno

En **Project Settings → Environment Variables**, añade:

| Variable | Entorno | Obligatoria |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Sí |
| `DATABASE_URL` | Production, Preview | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Sí (admin usuarios) |
| `NEXT_PUBLIC_APP_URL` | Production | Sí — URL final de Vercel |
| `DOCUMENT_UPLOAD_MAX_MB` | Production | Opcional (default 25) |

Valores: Supabase Dashboard → **Project Settings → API** y **Database**.

### 1.3 Primer deploy

1. Pulsa **Deploy** y espera a que termine el build.
2. Copia la URL asignada (ej. `https://sistema-de-gestion-documental.vercel.app`).
3. Actualiza `NEXT_PUBLIC_APP_URL` en Vercel con esa URL y redeploy si cambió.

### 1.4 Verificación

- [ ] `/login` — inicio de sesión
- [ ] `/forgot-password` — solicitud de enlace de recuperación
- [ ] `/reset-password` — formulario de nueva contraseña (requiere sesión del enlace del correo)
- [ ] `/` — dashboard
- [ ] `/documents/new` — subida de documento
- [ ] `/admin/users` — gestión de usuarios (requiere service role)
- [ ] `/api/documents/export` — exportación ZIP

---

## 2. Supabase — autenticación en producción

En **Authentication → URL Configuration**:

| Campo | Valor |
|-------|-------|
| **Site URL** | `https://sistema-de-gestion-documental.vercel.app` |
| **Redirect URLs** | `https://sistema-de-gestion-documental.vercel.app/api/auth/callback` |
| | `https://sistema-de-gestion-documental.vercel.app/**` |
| | `http://localhost:3000/api/auth/callback` (desarrollo local) |

> Configura estos valores en [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/nrhilfbcnmtckkzkqeja/auth/url-configuration).

### 2.1 Checklist — recuperación de contraseña

La app envía el correo con `redirectTo`:

`{NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/reset-password`

Verifica **antes** de probar en producción o preview:

| Paso | Dónde | Qué comprobar |
|------|-------|---------------|
| 1 | Vercel → Environment Variables | `NEXT_PUBLIC_APP_URL` = URL real del despliegue (ej. `https://tu-app.vercel.app`), **no** `localhost` en Production |
| 2 | Supabase → URL Configuration | **Site URL** = misma URL de producción |
| 3 | Supabase → Redirect URLs | Incluye `{APP_URL}/api/auth/callback` para production **y** preview si usas previews de Vercel |
| 4 | Supabase → Email Templates → Reset password | Pegar plantilla de [`docs/email-templates/reset-password.html`](../email-templates/reset-password.html) (botón con `token_hash`, saludo `{{ .Data.full_name }}`) |
| 5 | Tras cambiar variables | Redeploy en Vercel para que el build tome `NEXT_PUBLIC_APP_URL` |

> **Desarrollo local:** Site URL debe ser `http://localhost:3000` mientras pruebas en local. El botón del correo usa `{{ .SiteURL }}`; si apunta a Vercel, el enlace abrirá producción.

> **Producción:** Site URL debe ser `https://sistema-de-gestion-documental.vercel.app` (sin `/login`). Si Site URL incluye `/login`, los errores de enlace expirado aterrizan ahí con `#error_code=otp_expired`.

#### Plantilla de correo personalizada

1. En Supabase, abre **Authentication → Email Templates → Reset password**.
2. **Subject:** `Restablece tu contraseña — IPS Gestión Documental`
3. **Body:** copia el HTML de [`docs/email-templates/reset-password.html`](../email-templates/reset-password.html) (sin el comentario inicial).
4. Guarda los cambios.

La plantilla saluda al usuario con `{{ .Data.full_name }}` cuando el nombre está en `auth.users.user_metadata`. El botón del correo apunta primero a:

`{SiteURL}/auth/confirm?token_hash={TokenHash}&type=recovery&next=/reset-password`

El usuario confirma con «Continuar» y entonces se llama a `/api/auth/callback`, que verifica el token con `verifyOtp`. Esto evita que escáneres de correo consuman el enlace antes del clic humano.

**Verificación del saludo:**

1. Solicita recuperación para un usuario con nombre en su perfil.
2. El correo debe mostrar «Hola, {nombre},».
3. Si no hay nombre en metadata, el correo usa «Hola,» genérico.

**Prueba manual del flujo:**

1. Abre `/forgot-password` en el entorno desplegado.
2. Envía un correo de prueba a una cuenta existente.
3. Inspecciona el enlace del email: debe apuntar a `{tu-dominio}/auth/confirm?token_hash=...&type=recovery&next=/reset-password` (no a `/login` ni `supabase.co/auth/v1/verify`).
4. Tras el clic en el correo, verás «Confirmar acción» → pulsa **Continuar** → `/reset-password` con el formulario visible.
5. Define la nueva contraseña → redirección a `/login?reset=success` con mensaje de confirmación.

**Si el paso 4 te redirige a `/login?error=auth_error`:** el callback no pudo crear la sesión. Revisa Site URL, Redirect URLs y que la plantilla use `token_hash` (no solo `ConfirmationURL`).

**Si el paso 4 te devuelve a `/forgot-password?error=expired`:** el enlace expiró o ya fue usado; solicita uno nuevo.

### Base de datos y storage (antes del primer uso)

```bash
pnpm db:migrate
```

Scripts SQL adicionales en `docs/sql/` (RLS, bucket `documents`, seeds) deben ejecutarse en el SQL Editor de Supabase si aún no están aplicados.

---

## 3. GitHub Pages — landing del proyecto

### 3.1 Activar Pages (elige una opción)

**Opción A — GitHub Actions (recomendada)**

El workflow [`.github/workflows/deploy-github-pages.yml`](../.github/workflows/deploy-github-pages.yml) publica `docs/` en cada push a `main`.

1. Repo en GitHub → **Settings → Pages**.
2. **Source:** GitHub Actions.
3. Tras el siguiente push a `main`, el workflow `Deploy GitHub Pages landing` publicará la landing.

**Opción B — Rama /docs (sin Actions)**

1. Repo en GitHub → **Settings → Pages**.
2. **Source:** Deploy from a branch.
3. **Branch:** `main`
4. **Folder:** `/docs`
5. Guardar.

La URL quedará en:

`https://julianandrescaracas0623.github.io/sistema-de-gestion-documental/`

### 3.2 Archivos de la landing

| Archivo | Descripción |
|---------|-------------|
| `docs/index.html` | Página principal |
| `docs/.nojekyll` | Desactiva Jekyll para servir assets correctamente |
| `docs/assets/style.css` | Estilos de la landing |

Tras cambiar la URL de Vercel en `docs/index.html`, haz commit y push; GitHub Pages se actualiza en 1–2 minutos.

---

## 4. Despliegue con Vercel CLI (opcional)

```bash
vercel login
vercel link
vercel env pull .env.local
vercel --prod
```

---

## 5. Solución de problemas

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Login redirige con error | Redirect URLs incorrectas | Revisar Supabase Auth URLs |
| Clic en correo de reset → `/login#error_code=otp_expired` | Enlace expirado/usado o plantilla antigua con `ConfirmationURL` | Site URL = dominio raíz (sin `/login`); pegar plantilla con `token_hash`; solicitar **nuevo** correo |
| Correo de reset no abre formulario | `NEXT_PUBLIC_APP_URL` incorrecta o callback no permitido | Ver sección 2.1; enlace del email debe ir a `/api/auth/callback` |
| `/reset-password` muestra «Enlace no válido» | Sesión no creada (código expirado, cookies bloqueadas) | Solicitar nuevo enlace; revisar Redirect URLs y plantilla de email |
| `/admin/users` falla | Falta `SUPABASE_SERVICE_ROLE_KEY` | Añadir variable en Vercel |
| Subida de archivos falla | Bucket o políticas RLS | Ejecutar `docs/sql/storage-documents-bucket.sql` |
| Landing sin estilos | Jekyll procesando `docs/` | Confirmar que existe `docs/.nojekyll` |
