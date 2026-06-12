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
- [ ] `/` — dashboard
- [ ] `/documents/new` — subida de documento
- [ ] `/admin/users` — gestión de usuarios (requiere service role)
- [ ] `/api/documents/export` — exportación ZIP

---

## 2. Supabase — autenticación en producción

En **Authentication → URL Configuration**:

| Campo | Valor |
|-------|-------|
| **Site URL** | `https://<tu-app>.vercel.app` |
| **Redirect URLs** | `https://<tu-app>.vercel.app/api/auth/callback` |
| | `https://<tu-app>.vercel.app/**` |

### Base de datos y storage (antes del primer uso)

```bash
pnpm db:migrate
```

Scripts SQL adicionales en `docs/sql/` (RLS, bucket `documents`, seeds) deben ejecutarse en el SQL Editor de Supabase si aún no están aplicados.

---

## 3. GitHub Pages — landing del proyecto

### 3.1 Activar Pages

1. Repo en GitHub → **Settings → Pages**.
2. **Source:** Deploy from a branch.
3. **Branch:** `main` (o tu rama principal).
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
| `/admin/users` falla | Falta `SUPABASE_SERVICE_ROLE_KEY` | Añadir variable en Vercel |
| Subida de archivos falla | Bucket o políticas RLS | Ejecutar `docs/sql/storage-documents-bucket.sql` |
| Landing sin estilos | Jekyll procesando `docs/` | Confirmar que existe `docs/.nojekyll` |
