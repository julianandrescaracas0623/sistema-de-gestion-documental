# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are staff of a small healthcare provider (IPS Salud Integral, Cartago,
Valle del Cauca, Colombia) doing back-office administrative work — billing support,
HR records, audit preparation, service paperwork. Two roles in daily use:

- **Administrador** — manages users, roles and permissions, categories and tags;
  oversees the system.
- **Usuario administrativo** — uploads, classifies, searches, views and downloads
  documents within the permissions their role grants.

They work at a desk, in a browser, on an institutional network; no dedicated client
is installed. The interface is in Spanish.

> Project status: academic capstone (*proyecto de grado*). No production deployment
> at the IPS is currently planned. The audience above is the real-world user the
> system is modeled and designed for, not a live customer base.

## Product Purpose

Replace the institution's manual, paper-based handling of administrative documents
(physical folders, filing cabinets, boxes) with a single secure web repository.
Staff digitize, organize (categories + optional tags), store in the cloud, search,
and retrieve documents, with access governed by role-based permissions.

Success = a frequent task (log in → upload → classify → find → view/download) is
completed in a few actions, and every sensitive operation is gated by the actor's
permissions.

## Positioning

An internal document-management tool scoped tightly to one small healthcare
provider's administrative reality: a fixed permission catalog with seed roles
(`admin`, `user`) plus organization-defined custom roles, enforced in depth
(Row Level Security in Postgres + guards in server actions) — not a generic DMS or
an enterprise ECM. The differentiator is fit and rigor for this context
(least-privilege by default, destructive actions always confirmed), not feature
breadth.

## Operating Context

- Documents originate from administrative processes: billing soportes, HR records,
  medical orders and service soportes, audit evidence.
- Pre-system flow: generate → manual review → physical classification → folder
  storage → archive placement → manual search on demand.
- Target flow: sign in → upload digital file → classify by category (and optional
  tags) → system persists binary + metadata in Supabase → search → view or
  download.
- App areas: authentication (login, forgot/reset password, email confirm),
  protected dashboard, documents (list, detail, new), admin (users, roles,
  categories, tags), and a document-export API route.
- Browser-based, modern browsers, typical institutional network conditions.

## Capabilities and Constraints

Confirmed capabilities:

- **User management** — create (full name, email, dynamically assigned role), edit,
  delete (`users.manage`); no public self-registration.
- **Authentication** — Supabase Auth; login, logout, protected routes; password
  recovery by email.
- **RBAC** — fixed permission catalog; seed roles `admin` / `user`; custom roles
  with granular permissions; role assigned at user creation; managed at
  `/admin/roles` under `roles.manage`.
- **Documents** — upload with metadata, cloud storage of binary + DB reference,
  in-browser view when the format allows, permission-checked download, logical
  deletion.
- **Classification** — one category per document; optional tags.
- **Search & organization** — search by name/text; filter by category; filter by
  tags; paginated listing; breadcrumb navigation; quick date filters.
- **Export** — document-export route.
- **Consistent UX patterns** — centered AlertDialog for every destructive action;
  `⋯` row-action menus across documents, users, categories and tags.

Technical constraints:

- Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4,
  shadcn/ui on Radix primitives.
- Supabase: Auth + PostgreSQL + Storage; access enforced with Row Level Security
  and `has_permission` checks; server actions are the write path.
- Drizzle ORM; migrations are generated, never hand-edited.
- Feature-based + layered architecture under `src/features/*` (auth, user-admin,
  role-admin, documents, categories, tags).
- TDD workflow; coverage targets 95% statements / functions / lines, 90% branches;
  Vitest + Playwright.
- Project deploy targets: Vercel (app), GitHub Pages (project landing),
  Supabase Cloud.

Undecided / deliberately open:

- Exact performance SLAs (numeric response-time and upload-size limits) — to be set
  later from real measurements.
- Supported-browser list — to be documented in README/manual per deployment.
- Legal / data-protection registry (Colombian *habeas data* and personal-data
  rules, IPS retention policy) — flagged as required before any real production
  use; not resolved here.

## Brand Commitments

- Name in use: "Sistema Web de Gestión Documental para IPS Salud Integral";
  "IPS Salud Integral" as the modeled institution.
- Interface language: Spanish.
- **No binding visual identity.** The current palette (teal `#0b8fc9` primary, navy
  `#1a2744` sidebar, light-gray background, `--radius` `0.625rem`) is a self-made
  mockup, explicitly open to redesign — treat it as the incumbent implementation,
  not a constraint.
- No official logo or brand manual exists.

## Evidence on Hand

- Requirements and context: `docs/problema.md`, `docs/contexto_operacional.md`,
  `.requirements/requerimiento_funcional.md`, `.requirements/non-functional.md`,
  `.requirements/auth.md`, `.requirements/rbac.md`, `.requirements/use-cases.md`,
  `.requirements/ux-confirmaciones.md`, `.requirements/mejoras-qa-jun2026.md`.
- `docs/email-templates/`, `docs/sql/`, `docs/assets/`, project landing
  `docs/index.html`.
- Working incumbent UI across auth, dashboard, documents and admin routes.

Absent — must not be fabricated as if real:

- No real IPS logo, brand assets, or official color specification.
- No real administrative documents; all document content is seed / synthetic.
- No real users, staff lists, or usage data; all accounts are seed data.
- No real testimonials, customers, benchmarks, pricing, or signed deployment.

## Product Principles

1. **Least privilege is the default.** Every sensitive operation (upload, download,
   delete, user/role management) is denied unless the actor's role grants it, and
   the check exists in depth — database (RLS) and server action — not only in the
   UI.
2. **Destructive actions are always confirmed, consistently.** One pattern (centered
   AlertDialog) for deleting documents, users, categories and tags; no inline or
   side-panel variants.
3. **Optimize the frequent path.** Log in → upload → classify → search →
   open/download stays reachable in a few actions from the dashboard; loading and
   error states are legible.
4. **Fit over breadth.** Model one small healthcare provider's administrative
   document reality well rather than adding generic DMS features.
5. **Quality is enforced, not aspirational.** Strict typing, repository
   conventions, and high test coverage (TDD) are part of the definition of done.

## Accessibility & Inclusion

- Browser-only access on modern browsers, no dedicated client (RNF4.1).
- Spanish-language UI for all users.
- Usability requirements (RNF3): frequent tasks reachable in few actions;
  recognizable system state (logged-in user, legible errors); consistent
  navigation between modules.
- No formal accessibility standard (e.g. a mandated WCAG level) has been set for
  the project; not established here.
