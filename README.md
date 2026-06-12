# 📄 Sistema Web de Gestión Documental para IPS Salud Integral

## 🚀 Descripción del Proyecto

**Sistema Web de Gestión Documental** desarrollado como proyecto de grado para la **IPS Salud Integral** de Cartago, Valle del Cauca.

La solución surge a partir de una problemática común en muchas organizaciones, especialmente en el sector salud: la gestión manual de documentos físicos. Aunque muchas instituciones han avanzado en la digitalización de algunos procesos, gran parte de la documentación administrativa continúa almacenándose en carpetas, archivadores y cajas físicas, dificultando su búsqueda, control y conservación.

Con el objetivo de modernizar estos procesos, se desarrolló una plataforma web que permite digitalizar, organizar, almacenar y consultar documentos de forma segura, optimizando la gestión documental y fortaleciendo el control de acceso a la información institucional.

---

## 🎯 Problema

En la IPS Salud Integral, gran parte de la documentación administrativa era gestionada de forma física, generando dificultades como:

* Dificultad para localizar documentos de forma rápida.
* Pérdida de tiempo en procesos de búsqueda y consulta.
* Riesgo de pérdida o deterioro de archivos físicos.
* Acumulación excesiva de documentación en papel.
* Dependencia de procesos manuales.
* Falta de control sobre el acceso a la información.

Estas situaciones impactaban procesos importantes como la facturación, auditorías, control documental y la gestión administrativa de la institución.

---

## 💡 Solución Implementada

Se desarrolló un sistema web que permite:

* Digitalizar documentos institucionales.
* Centralizar la información en un único repositorio.
* Organizar documentos mediante categorías y etiquetas.
* Realizar búsquedas rápidas y eficientes.
* Gestionar usuarios, roles y permisos.
* Controlar el acceso a la información mediante RBAC.
* Almacenar documentos de forma segura en la nube.
* Facilitar la consulta y recuperación de archivos.

---

## 🏆 Objetivo General

Desarrollar un sistema web de gestión documental para la IPS Salud Integral que permita la digitalización, organización, consulta y control de la documentación administrativa y de soporte institucional, contribuyendo a la modernización de sus procesos mediante el uso de tecnologías de la información.

---

## 🛠️ Tecnologías Utilizadas

### Frontend

* ⚛️ React 19
* ⚡ Next.js 16
* 🔷 TypeScript (Strict Mode)
* 🎨 Tailwind CSS v4
* 📋 shadcn/ui

### Backend y Base de Datos

* 🟢 Supabase

  * Authentication
  * PostgreSQL Database
  * Storage
* 🐘 PostgreSQL

### Calidad de Software

* ✅ Vitest
* 🎭 Playwright
* 🧪 TDD (Test Driven Development)
* 🛡️ Zod Validation

### Infraestructura y Despliegue

* ▲ Vercel (aplicación en producción)
* 📄 GitHub Pages (landing del proyecto)
* ☁️ Supabase Cloud

---

## 📦 Funcionalidades Principales

### 🔐 Autenticación y Seguridad

* Inicio y cierre de sesión.
* Control de acceso basado en roles (RBAC).
* Gestión granular de permisos.
* Protección mediante Row Level Security (RLS).

### 👥 Gestión de Usuarios

* Registro de usuarios.
* Edición de usuarios.
* Eliminación de usuarios.
* Asignación dinámica de roles.

### 📁 Gestión Documental

* Carga de documentos.
* Descarga de documentos.
* Visualización de archivos.
* Eliminación lógica de documentos.
* Gestión de categorías.
* Gestión de etiquetas.

### 🔍 Búsqueda y Organización

* Búsqueda por nombre.
* Filtrado por categorías.
* Filtrado por etiquetas.
* Listado paginado de documentos.
* Navegación mediante breadcrumbs.

---

## 👥 Roles del Sistema

| Rol                        | Descripción                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------- |
| **Administrador**          | Gestión completa del sistema, usuarios, roles, categorías, etiquetas y documentos. |
| **Usuario Administrativo** | Gestión documental, carga, consulta y descarga de documentos.                      |

Además, el sistema permite la creación de roles personalizados y la asignación de permisos específicos según las necesidades de la organización.

---

## 🏗️ Arquitectura

```text
Frontend (Next.js + React)
            │
            ▼
     Supabase (BaaS)
            │
            ▼
 PostgreSQL + Storage
```

### Patrones y Enfoques Utilizados

* Feature-Based Architecture
* Layered Architecture
* Backend as a Service (BaaS)
* Server Actions
* Row Level Security (RLS)
* Role-Based Access Control (RBAC)

---

## 📂 Estructura del Proyecto

```bash
src/
├── app/
├── features/
├── shared/
├── e2e/
└── test-setup.ts
```

### Organización por Features

```bash
features/
├── auth/
├── user-admin/
├── role-admin/
├── documents/
├── categories/
└── tags/
```

---

## 🧪 Testing

```bash
# Tests unitarios
pnpm test

# Cobertura
pnpm test:coverage

# Tests E2E
pnpm test:e2e
```

### Cobertura Objetivo

| Métrica    | Cobertura |
| ---------- | --------- |
| Statements | 95%       |
| Functions  | 95%       |
| Lines      | 95%       |
| Branches   | 90%       |

---

## 🚴 Scripts Disponibles

| Comando           | Descripción                       |
| ----------------- | --------------------------------- |
| `pnpm dev`        | Iniciar entorno de desarrollo     |
| `pnpm build`      | Generar build de producción       |
| `pnpm start`      | Ejecutar aplicación en producción |
| `pnpm lint`       | Ejecutar ESLint                   |
| `pnpm typecheck`  | Verificar tipos TypeScript        |
| `pnpm test`       | Ejecutar pruebas unitarias        |
| `pnpm test:e2e`   | Ejecutar pruebas End-to-End       |
| `pnpm db:migrate` | Aplicar migraciones               |
| `pnpm db:studio`  | Abrir Drizzle Studio              |

---

## 🌐 Despliegue

El sistema usa un esquema híbrido: la **aplicación completa** en Vercel y una **landing estática** del proyecto de grado en GitHub Pages.

| Entorno | URL | Contenido |
| ------- | --- | --------- |
| **Sistema en producción** | [sistema-de-gestion-documental.vercel.app](https://sistema-de-gestion-documental.vercel.app) | Login, documentos, administración |
| **Presentación del proyecto** | [julianandrescaracas0623.github.io/sistema-de-gestion-documental](https://julianandrescaracas0623.github.io/sistema-de-gestion-documental/) | Landing del proyecto de grado |

Instrucciones detalladas (variables de entorno, Supabase Auth y activación de Pages): [`docs/DEPLOY.md`](docs/DEPLOY.md).

### Variables de entorno en producción

| Variable | Obligatoria |
| -------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí |
| `DATABASE_URL` | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí (módulo `/admin/users`) |
| `NEXT_PUBLIC_APP_URL` | Sí (URL de Vercel) |

---

## 📈 Impacto del Proyecto

La implementación de esta solución permite:

* Reducir significativamente el uso de documentos físicos.
* Optimizar tiempos de búsqueda y recuperación de información.
* Mejorar el control documental institucional.
* Fortalecer la seguridad y confidencialidad de la información.
* Facilitar auditorías y procesos administrativos.
* Contribuir a la transformación digital de la IPS Salud Integral.

---

## 🎓 Proyecto de Grado

Este proyecto fue desarrollado como trabajo de grado para optar al título de:

**Tecnólogo en Sistemas de Información**

**Corporación de Estudios Tecnológicos del Norte del Valle – COTECNOVA**

Cartago, Valle del Cauca – Colombia

---

## 👨‍💻 Autor

**Julián Andrés Caracas Sánchez**

GitHub: [@julianandrescaracas0623](https://github.com/julianandrescaracas0623)

---

## 📝 Licencia

Este proyecto fue desarrollado para uso institucional de la **IPS Salud Integral**.

Todos los derechos reservados © 2026.
