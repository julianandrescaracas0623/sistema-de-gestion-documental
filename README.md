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

## 🛠️ Tecnologías

- ⚛️ React 19
- ⚡ Next.js 16
- 🟢 Supabase (Auth, DB, Storage)
- 🐘 PostgreSQL
- 🎨 Tailwind CSS v4
- 📋 shadcn/ui
- ✅ Vitest + Playwright (testing)
- 🔷 TypeScript (strict mode)

---

## 📦 Funcionalidades principales

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

Variables requeridas:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública de Supabase |
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role (solo servidor; alta de usuarios en `/admin/users`) |
| `DOCUMENT_UPLOAD_MAX_MB` | (Opcional) Tamaño máximo de subida en MB; por defecto 25 |

### Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Habilita **Auth** > Authentication > Providers > Email
3. **Desactiva el registro público** (p. ej. *Disable sign ups* / impedir que cualquiera cree cuenta con el endpoint público). Las cuentas deben crearse desde el panel de administración de la app (`/admin/users`) o por procedimiento operativo acordado con la IPS.
4. Añade `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` (solo servidor; nunca en el cliente ni en variables `NEXT_PUBLIC_*`). Es necesaria para que un administrador pueda crear usuarios desde la aplicación.
5. **Primer administrador:** crea el usuario en Supabase (Auth) y asegúrate de tener filas coherentes en `profiles` y `user_roles` con rol `admin` (o usa el flujo de `/admin/users` si ya existe otro admin).
6. Tras `pnpm db:migrate`, ejecuta en el SQL Editor de Supabase (en este orden): migraciones ya aplicadas, luego [docs/sql/seed-categories.sql](docs/sql/seed-categories.sql) para categorías iniciales, y [docs/sql/storage-documents-bucket.sql](docs/sql/storage-documents-bucket.sql) para el bucket privado `documents` y sus políticas de Storage.
7. Copia las credenciales a `.env.local`

---

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

## 🤝 Guía de contribución

1. **Nueva feature**: Usa `/discover-feature` para definir requerimientos primero
2. **Workflow de 2 conversaciones**:
   - Conversación 1: Discovery con `/discover-feature`
   - Conversación 2: Implementación con `/build-feature`
3. **Tests primero**: Escribe los tests antes de implementar
4. **Coverage**: Mantén el coverageabove los thresholds
5. **RLS**: Siempre implementa RLS cuando crees nuevas tablas

---

## 📝 Licencia

Privado — IPS Salud Integral
