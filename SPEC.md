# SPEC.md - Spec Driven Development

## Sistema de Gestión Documental - IPS Salud Integral

---

## 1. Introducción

### 1.1 Propósito

Este documento establece las convenciones, patrones y reglas de desarrollo para el Sistema de Gestión Documental de IPS Salud Integral. El objetivo es garantizar consistencia, calidad y mantenibilidad del código a través de todo el ciclo de desarrollo.

### 1.2 Alcance

- **Estado actual**: Documentar las convenciones implementadas actualmente en el proyecto
- **Evoluciones**: Proponer mejoras y funcionalidades candidatas para implementación futura

### 1.3 Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16.2 (App Router), React 19, Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix UI + CVA) |
| Backend | Supabase (Auth, Database, Storage) |
| ORM | Drizzle ORM 0.44 |
| Validación | Zod 3 + @hookform/resolvers |
| State Management | TanStack React Query v5 |
| Forms | React Hook Form v7 |
| Testing | Vitest + React Testing Library, Playwright |

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Browser)                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐  │
│  │  Pages/Next  │   │  Componentes  │   │  React Query / Forms  │  │
│  │   Router     │   │   (shadcn)    │   │                       │  │
│  └──────┬───────┘   └──────┬───────┘   └───────────┬───────────┘  │
│         │                  │                       │               │
│         └──────────────────┼───────────────────────┘               │
│                            │                                       │
│                     "use server"                                  │
└────────────────────────────┼───────────────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────────────┐
│                            │           SERVIDOR (Next.js)          │
├────────────────────────────┼───────────────────────────────────────┤
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Server Actions                         │   │
│  │  • loginAction    • uploadDocumentAction                    │   │
│  │  • logoutAction   • updateDocumentMetadataAction            │   │
│  │  • createUserByAdminAction  • softDeleteDocumentAction       │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                            │                                       │
│  ┌─────────────────────────┼───────────────────────────────────┐   │
│  │                    Services Layer                           │   │
│  │  • Supabase Client (server)  • Auth Helpers                 │   │
│  │  • Drizzle Queries            • Storage Service             │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                            │                                       │
└────────────────────────────┼───────────────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────────────┐
│                            ▼           SUPABASE                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   Auth      │  │  Database   │  │  Storage    │                │
│  │  (Users)    │  │  (Postgres) │  │  (Buckets)  │                │
│  │             │  │  + RLS      │  │             │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Usuario    │────▶│  Middleware │────▶│  Server      │────▶│  Supabase   │
│  (Browser)   │     │  (Auth)     │     │  Action      │     │  (DB/Auth)  │
└──────────────┘     └─────────────┘     └──────────────┘     └─────────────┘
                           │                    │                    │
                           │                    │                    │
                    ┌──────┴──────┐      ┌──────┴──────┐      ┌──────┴──────┐
                    │   Login     │      │ Validación  │      │  RLS        │
                    │   Redirect │      │   Zod       │      │  Policies   │
                    └─────────────┘      └─────────────┘      └─────────────┘
```

---

## 3. Estructura del Proyecto

### 3.1 Árbol de Carpetas

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   └── login/                # Página de login público
│   │       └── page.tsx
│   ├── (protected)/              # Grupo de rutas protegidas
│   │   ├── layout.tsx            # Layout con header y navegación
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── admin/                # Rutas de administración
│   │   │   └── users/            # Gestión de usuarios
│   │   │       └── page.tsx
│   │   └── documents/            # Gestión de documentos
│   │       ├── page.tsx          # Listado con filtros
│   │       ├── new/              # Subida de documentos
│   │       │   └── page.tsx
│   │       └── [id]/             # Detalle del documento
│   │           └── page.tsx
│   ├── api/                      # API Routes
│   │   └── auth/                 # Autenticación
│   │       └── callback/         # OAuth callback
│   │           └── route.ts
│   ├── layout.tsx                # Root layout global
│   └── error.tsx                 # Error boundary
│
├── features/                     # Estructura por dominio (Feature-based)
│   ├── auth/                    # Dominio de autenticación
│   │   ├── actions/             # Server Actions
│   │   │   ├── login.action.ts
│   │   │   └── logout.action.ts
│   │   ├── components/          # Componentes específicos del dominio
│   │   │   └── login-form.tsx
│   │   └── hooks/               # Custom hooks
│   │       └── use-auth.ts
│   │
│   ├── documents/               # Dominio de documentos
│   │   ├── actions/             # Server Actions
│   │   │   ├── upload-document.action.ts
│   │   │   ├── update-metadata.action.ts
│   │   │   └── soft-delete.action.ts
│   │   ├── components/          # Componentes del dominio
│   │   │   ├── upload-form.tsx
│   │   │   ├── document-list.tsx
│   │   │   ├── document-card.tsx
│   │   │   └── delete-button.tsx
│   │   ├── queries/            # Queries de datos
│   │   │   ├── documents.queries.ts
│   │   │   └── categories.queries.ts
│   │   └── lib/                # Utilidades del dominio
│   │       ├── config.ts
│   │       ├── tag-utils.ts
│   │       └── format-bytes.ts
│   │
│   └── user-admin/              # Dominio de administración de usuarios
│       ├── actions/
│       │   └── create-user.action.ts
│       └── components/
│           └── create-user-form.tsx
│
├── shared/                       # Código compartido
│   ├── components/              # Componentes reutilizables
│   │   └── ui/                  # Componentes shadcn/ui
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── label.tsx
│   │       ├── badge.tsx
│   │       ├── spinner.tsx
│   │       ├── avatar.tsx
│   │       ├── separator.tsx
│   │       └── sonner.tsx       # Toasts
│   │
│   ├── db/                      # Base de datos (Drizzle)
│   │   ├── schema/              # Esquemas de tablas
│   │   │   ├── profiles.schema.ts
│   │   │   ├── user-roles.schema.ts
│   │   │   ├── categories.schema.ts
│   │   │   ├── tags.schema.ts
│   │   │   ├── documents.schema.ts
│   │   │   └── document-tags.schema.ts
│   │   ├── index.ts             # Export aggregated del schema
│   │   └── migrations/          # Migraciones generadas
│   │
│   └── lib/                     # Utilidades compartidas
│       ├── supabase/
│       │   ├── client.ts        # Cliente para browser
│       │   ├── server.ts       # Cliente para server
│       │   └── helper.ts       # Auth helpers
│       ├── utils.ts            # Funciones utilitarias
│       └── types.ts            # Tipos globales
│
└── styles/
    └── globals.css              # Estilos globales (Tailwind)
```

### 3.2 Convenciones de Naming

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| **Archivos de componentes** | kebab-case | `upload-form.tsx` |
| **Archivos de acciones** | kebab-case con sufijo `.action.ts` | `login.action.ts` |
| **Archivos de queries** | plural del dominio `.queries.ts` | `documents.queries.ts` |
| **Archivos de schemas** | nombre de tabla `.schema.ts` | `documents.schema.ts` |
| **Componentes React** | PascalCase | `UploadForm` |
| **Funciones de server actions** | camelCase descriptivo | `loginAction` |
| **Zod Schemas** | Sufjo `Schema` | `LoginSchema` |
| **Types/Interfaces** | PascalCase con prefijo según tipo | `Document`, `UserRole` |

### 3.3 Patrón Feature-based Structure

Cada dominio funcional vive en `features/{dominio}/` con la siguiente estructura:

```
features/{dominio}/
├── actions/           # Server Actions (mutaciones)
│   └── *.action.ts
├── components/       # Componentes específicos del dominio
│   └── *.tsx
├── queries/          # Queries (data fetching)
│   └── *.queries.ts
├── hooks/            # Custom hooks
│   └── *.ts
└── lib/              # Utilidades específicas del dominio
    └── *.ts
```

---

## 4. Reglas de Desarrollo

### 4.1 Server Actions

#### Estructura Obligatoria

```typescript
// features/{dominio}/actions/{nombre}.action.ts
"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { z } from "zod";

// 1. Zod Schema para validación
const Schema = z.object({
  field1: z.string().min(1, "Requerido"),
  field2: z.number().positive(),
});

// 2. Tipo inferido del schema
type Input = z.infer<typeof Schema>;
type Response = { success: boolean; data?: Output; error?: string };

// 3. Función principal con "use server"
export async function actionName(prevState: unknown, formData: FormData): Promise<Response> {
  // Validar input
  const validated = Schema.parse(Object.fromEntries(formData));

  // Crear cliente
  const supabase = await createClient();

  // Lógica de negocio
  const { data, error } = await supabase
    .from("tabla")
    .insert(validated)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
```

#### Reglas

1. **Siempre usar Zod** para validación de entrada
2. **Siempre retornar** `{ success: boolean; data?: T; error?: string }`
3. **Siempre crear cliente** de Supabase con `await createClient()`
4. **Nunca exponer** credenciales o keys en el cliente
5. **Usar `useActionState`** en componentes cliente para manejo de estado
6. **Naming**: suffijo `Action` en exports, sufijo `.action.ts` en archivos

#### Ejemplo Completo

```typescript
// features/auth/actions/login.action.ts
"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors.map((e) => e.message).join(", "),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/");
}
```

### 4.2 Componentes

#### Server vs Client Components

| Usar Server Component | Usar Client Component |
|----------------------|----------------------|
| Renderizado inicial de datos | Interactividad (onClick, onChange) |
| Fetching de datos | useState, useEffect |
| No necesita client-side logic | Forms con useForm |
| SEO importante | Animaciones |
| Acceso a cookies/headers | Integraciones con librerías cliente |

```typescript
// Server Component (default)
import { createClient } from "@/shared/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from("documents").select("*");
  return <DocumentList documents={data} />;
}

// Client Component
"use client";

import { useActionState } from "react";

export function MyForm() {
  const [state, action, isPending] = useActionState(myAction, null);
  // ...
}
```

#### shadcn/ui Usage

1. **Instalar componente**: `npx shadcn@latest add button`
2. **Usar con variantes**:
   ```typescript
   <Button variant="default" size="sm">Click me</Button>
   <Button variant="destructive">Delete</Button>
   <Button variant="outline">Cancel</Button>
   <Button variant="secondary">Secondary</Button>
   <Button variant="ghost">Ghost</Button>
   <Button variant="link">Link</Button>
   ```
3. **Composición**:
   ```typescript
   <Card>
     <CardHeader>
       <CardTitle>Title</CardTitle>
       <CardDescription>Description</CardDescription>
     </CardHeader>
     <CardContent>
       {/* content */}
     </CardContent>
     <CardFooter>
       <Button>Action</Button>
     </CardFooter>
   </Card>
   ```

#### Composición de Componentes

```typescript
// ✅ Patrón recomendado: Componer desde componentes más pequeños
export function DocumentList({ documents }) {
  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}

// ✅ Separar lógica de presentación
export function DocumentCard({ document }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{document.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge>{document.category}</Badge>
      </CardContent>
    </Card>
  );
}
```

### 4.3 Base de Datos

#### Convenciones de Schema Drizzle

```typescript
// src/shared/db/schema/documents.schema.ts
import { pgTable, text, timestamp, uuid, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { categories, profiles } from "./index";

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  storageObjectPath: text("storage_object_path").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  mimeType: text("mime_type").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relaciones
export const documentsRelations = relations(documents, ({ one, many }) => ({
  category: one(categories, {
    fields: [documents.categoryId],
    references: [categories.id],
  }),
  uploadedByUser: one(profiles, {
    fields: [documents.uploadedBy],
    references: [profiles.id],
  }),
  tags: many(documentTags),
}));
```

#### Reglas de Schema

1. **Siempre usar** `uuid` para IDs primarios con `defaultRandom()`
2. **Siempre incluir** `createdAt` y `updatedAt` con `defaultNow()`
3. **Foreign keys** con `references()` y políticas de `onDelete` explícitas
4. **Nombres de columnas** en snake_case en DB, camelCase en código
5. **Índices** en campos frecuentemente queryados
6. **Soft deletes** usar campo `deletedAt` nullable

#### Migraciones

```bash
# Generar migración desde schema
pnpm db:generate

# Aplicar migraciones pendientes
pnpm db:migrate

# Push schema (desarrollo solo)
pnpm db:push
```

#### RLS Policies

```sql
-- Ejemplo: Documents - usuarios ven solo los propios
CREATE POLICY "users_see_own_documents" ON documents
FOR SELECT
USING (
  auth.uid() = uploaded_by
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

### 4.4 API Routes

#### Cuándo Usar API Routes vs Server Actions

| Server Actions | API Routes |
|----------------|------------|
| Mutaciones desde formularios | Integraciones externas (webhooks) |
| Operaciones con acceso a cookies | Endpoints públicos sin sesión |
| UI que requiere estados de carga | APIs para terceros |
| Type-safe con Zod | Streaming responses |

#### Estructura de API Route

```typescript
// src/app/api/endpoint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("table").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Validar con Zod, procesar, responder
}
```

---

## 5. Flujo de Desarrollo

### 5.1 Setup Local

```bash
# 1. Clonar repositorio
git clone <repo-url>

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Completar NEXT_PUBLIC_SUPABASE_URL
# Completar NEXT_PUBLIC_SUPABASE_ANON_KEY
# Completar DATABASE_URL (opcional, para drizzle studio)

# 4. Ejecutar migraciones
pnpm db:migrate

# 5. Iniciar servidor de desarrollo
pnpm dev
```

### 5.2 Workflow Git

```
main (production)
  │
  ├── develop (integración)
  │     │
  │     ├── feature/nueva-funcionalidad
  │     │     │
  │     │     └── PR → review → merge → delete branch
  │     │
  │     ├── fix/bug-description
  │     │     │
  │     │     └── PR → review → merge → delete branch
  │     │
  │     └── chore/tarea
```

### 5.3 Commit Messages

Formato: `tipo(alcance): descripción`

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `style` | Formateo, sin cambio de lógica |
| `refactor` | Refactorización |
| `test` | Tests |
| `chore` | Tareas varias (deps, config) |

Ejemplos:
```
feat(documents): agregar filtro por fecha
fix(auth): corregir redirect tras login
docs(readme): actualizar instrucciones de setup
```

### 5.4 Pull Requests

1. **Título**: descripción clara del cambio
2. **Descripción**:
   - ¿Qué problema resuelve?
   - ¿Cómo lo resuelve?
   - Pasos para testar
3. **Reviewers**: asignar al menos 1
4. **Checks**: lint y tests pasando

---

## 6. Testing

### 6.1 Unit Tests (Vitest)

```typescript
// features/auth/actions/login.action.test.ts
import { describe, it, expect, vi } from "vitest";
import { loginAction } from "./login.action";

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("loginAction", () => {
  it("debería fallar con email inválido", async () => {
    const formData = new FormData();
    formData.set("email", "invalid");
    formData.set("password", "password123");

    const result = await loginAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("email");
  });
});
```

#### Reglas

1. **Naming**: `*.test.ts` o `*.spec.ts`
2. **Ubicación**: junto al archivo que prueba (mismo directorio)
3. **Cobertura mínima**: 70% en archivos modificados
4. **Mockear** Supabase en tests de server actions
5. **Tests de componentes**: usar React Testing Library

### 6.2 E2E Tests (Playwright)

```typescript
// e2e/login.spec.ts
import { test, expect } from "@playwright/test";

test("login exitoso", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL("/");
  await expect(page.locator("text=Dashboard")).toBeVisible();
});
```

---

## 7. CI/CD

### 7.1 Pre-commit Hooks

Configurado con Husky + lint-staged:

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "vitest --run"]
  }
}
```

### 7.2 Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - uses: pnpm/action-setup
      - run: pnpm install
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - run: pnpm install
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - run: pnpm install
      - run: pnpm test
```

### 7.3 Comandos de Calidad

```bash
pnpm lint          # ESLint
pnpm typecheck     # TypeScript strict
pnpm test          # Vitest unit tests
pnpm test:e2e      # Playwright E2E
pnpm build         # Next.js production build
```

---

## 8. Mejoras Propuestas

### 8.1 Funcionalidades Candidatas

| Prioridad | Feature | Descripción |
|-----------|---------|-------------|
| Alta | Búsqueda full-text | Implementar búsqueda en contenido de documentos |
| Alta | Versiones de documentos | Control de versiones con historial |
| Media | Notificaciones | Alerts por email cuando se suben/actualizan docs |
| Media | Exportación | Exportar listados a PDF/Excel |
| Baja | Firmas digitales | Integración con servicio de firmas |
| Baja | OCR | Extracción automática de texto de PDFs/imágenes |

### 8.2 Refactorizaciones Sugeridas

| Área | Propuesta |
|------|-----------|
| **Queries** | Migrar queries de Server Components a React Query para caching |
| **Forms** | Crear form components genéricos con useForm + zod |
| **UI** | Crear Design System propio con tokens de Tailwind |
| **Error Handling** | Implementar error boundary a nivel de dominio |
| **Testing** | Agregar coverage reporting con Codecov |

### 8.3 Mejoras de Performance

1. **Optimización de imágenes**: usar `next/image` para thumbnails
2. **Infinite scroll**: implementar en listado de documentos
3. **Prefetching**: cargar datos de detalle al hacer hover en lista
4. **Streaming**: usar React Suspense para componentes pesados

---

## 9. Anexos

### 9.1 Glosario

| Término | Definición |
|---------|------------|
| **RLS** | Row Level Security - Políticas de seguridad a nivel de fila en PostgreSQL |
| **Server Action** | Función servidor ejecutable desde cliente en Next.js |
| **Soft Delete** | Eliminación lógica (marcado) vs física (borrado de DB) |
| **Feature-based** | Arquitectura organizando por dominio funcional |
| **Zod** | Library de validación TypeScript-first |

### 9.2 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/)

---

## Historial de Versiones

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| 1.0.0 | Mayo 2026 | Versión inicial del documento |

---

*Documento generado para SPEC-Driven Development del Sistema de Gestión Documental IPS Salud Integral*