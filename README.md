# 📄 Sistema de Gestión Documental - IPS Salud Integral

## 🚀 Descripción

Sistema web desarrollado para la digitalización, organización y gestión de documentos administrativos en la IPS Salud Integral (Cartago, Valle del Cauca).

Permite reemplazar el manejo manual de archivos físicos por una plataforma digital segura, accesible y eficiente.

---

## 🎯 Objetivo

Optimizar la gestión documental mediante una aplicación web que permita:

- Carga de documentos
- Organización por categorías
- Búsqueda rápida
- Control de acceso por usuarios

---

## 🧠 Problema

Actualmente, la IPS maneja documentos en formato físico, lo que genera:

- Dificultad en la búsqueda
- Riesgo de pérdida
- Ineficiencia operativa

Más detalles en [docs/problema.md](./docs/problema.md).

---

## 🛠️ Tecnologías estas tecnologias deben incluirse en el documento 

- ⚛️ React 19
- ⚡ Next.js 16
- 🟢 Supabase (Auth, DB, Storage)
- 🐘 PostgreSQL
- 🎨 Tailwind CSS v4
- 📋 shadcn/ui
- ✅ Vitest + Playwright (testing)
- 🔷 TypeScript (strict mode)

---

## 📦 Funcionalidades principales (ignorar esto) 

- [x] Autenticación de usuarios (login/logout)
- [x] Alta de usuarios y roles solo para administrador (`/admin/users`, sin registro público en la app)
- [x] Subida de documentos (`/documents/new`, bucket `documents` en Supabase Storage)
- [x] Clasificación por categorías y etiquetas (`document_tags`, edición en detalle)
- [x] Búsqueda y listado paginado (`/documents` con filtros)
- [x] Descarga y visualización (URLs firmadas en detalle `/documents/[id]`)
- [x] Eliminación lógica y borrado de objeto en Storage

---

## 👥 Roles

- **Administrador**: Gestiona usuarios, controla acceso, supervisa el sistema
- **Usuario administrativo**: Sube documentos, consulta información, organiza archivos

---

## 🧱 Arquitectura

```
Frontend (Next.js)
       ⬇
Supabase (Backend as a Service)
       ⬇
PostgreSQL + Storage
```

### Patrones de código

- **Server Actions** para mutaciones
- **Supabase Client** para consultas en runtime
- **RLS (Row Level Security)** para seguridad a nivel de fila
- **Zod** para validación de esquemas
- **TDD** — tests antes de implementación

---

## 📂 Estructura del proyecto

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (public)
│   │   └── login/
│   │       └── page.tsx
│   ├── (protected)/              # Protected routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/                      # API routes
│   │   └── auth/callback/
│   │       └── route.ts
│   ├── __tests__/                # Page/component tests
│   ├── layout.tsx                # Root layout
│   └── error.tsx                 # Error boundary
├── features/                     # Feature modules
│   └── auth/                     # Auth feature
│       ├── actions/              # Server Actions
│       │   ├── login.action.ts
│       │   └── logout.action.ts
│       ├── components/           # React components
│       │   └── login-form.tsx
│       ├── hooks/                # Custom hooks
│       │   └── use-auth.ts
│       └── __tests__/            # Feature tests
├── shared/                       # Shared code
│   ├── components/
│   │   ├── providers.tsx         # Context providers
│   │   └── ui/                   # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── spinner.tsx
│   │       └── sonner.tsx
│   ├── db/                       # Database
│   │   ├── schema.ts             # Schema exports
│   │   ├── profiles.schema.ts    # Profiles table
│   │   └── migrations/           # Drizzle migrations
│   ├── lib/                      # Utilities
│   │   ├── utils.ts              # cn() and others
│   │   ├── action-result.ts      # Action result types
│   │   ├── form-utils.ts         # FormData helpers
│   │   ├── zod-utils.ts          # Zod helpers
│   │   ├── upload-utils.ts       # File upload helpers
│   │   └── supabase/             # Supabase clients
│   │       ├── client.ts
│   │       ├── server.ts
│   │       └── middleware.ts
│   └── test-utils/               # Test utilities
│       └── supabase-mock.ts
├── e2e/                          # Playwright E2E tests
│   ├── login.spec.ts
│   └── home.spec.ts
└── test-setup.ts                # Vitest setup
```

---

## 🚴 Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Iniciar servidor de desarrollo |
| `pnpm build` | Construir para producción |
| `pnpm start` | Iniciar servidor de producción |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm lint:fix` | Corregir errores de lint automáticamente |
| `pnpm typecheck` | Verificar tipos TypeScript |
| `pnpm test` | Ejecutar tests unitarios |
| `pnpm test:watch` | Ejecutar tests en modo watch |
| `pnpm test:coverage` | Ejecutar tests con cobertura |
| `pnpm test:e2e` | Ejecutar tests E2E con Playwright |
| `pnpm db:generate` | Generar migraciones Drizzle |
| `pnpm db:migrate` | Aplicar migraciones |
| `pnpm db:push` | Push schema a DB (solo desarrollo) |
| `pnpm db:studio` | Abrir Drizzle Studio |

---

## 🔧 Configuración

### Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

Variables de entorno requeridas:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública de Supabase |
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role (solo servidor; alta de usuarios en `/admin/users`) |
| `DOCUMENT_UPLOAD_MAX_MB` | (Opcional) Tamaño máximo de subida en MB; por defecto 25 |


## 🧪 Testing

```bash
# Tests unitarios
pnpm test

# Tests con cobertura
pnpm test:coverage

# Tests E2E (requiere que el servidor esté corriendo)
pnpm test:e2e
```

### Coverage thresholds

- Statements: 95%
- Functions: 95%
- Lines: 95%
- Branches: 90%

---

## 📖 Documentación adicional

| Archivo | Descripción |
|---------|-------------|
| [docs/problema.md](./docs/problema.md) | Planteamiento del problema |
| [docs/contexto_operacional.md](./docs/contexto_operacional.md) | Contexto operacional |
| [.requirements/README.md](./.requirements/README.md) | Guía de requerimientos |
| [.requirements/auth.md](./.requirements/auth.md) | Requerimientos de autenticación |
| [.requirements/use-cases.md](./.requirements/use-cases.md) | Casos de uso |
| [.requirements/requerimiento_funcional.md](./.requirements/requerimiento_funcional.md) | Requerimientos funcionales |
| [.requirements/non-functional.md](./.requirements/non-functional.md) | Requerimientos no funcionales |
| [.opencode/memory/architecture-snapshot.md](./.opencode/memory/architecture-snapshot.md) | Snapshot de arquitectura |

---
## 📝 Licencia

Privado — IPS Salud Integral (esto debe definirse)

---
