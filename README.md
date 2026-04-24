# {{projectName}}

Full-stack Next.js 16 hackathon starter with pre-built auth and todos.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 + App Router |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| ORM | Drizzle (schema + migrations) |
| Runtime Queries | supabase-js (RLS active) |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| UI | shadcn/ui + Tailwind CSS v4 |
| Testing | Vitest + Playwright |
| Code Quality | ESLint 9 + Husky + lint-staged |

## Getting Started

### 1. Add your API keys

`.env.local` was created automatically. Fill in the values:

```bash
# Supabase — https://supabase.com > Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres.your-project-id:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 2. Start the MCP memory service

```bash
docker compose up -d memory
```

MCP endpoint: `http://localhost:8765/mcp` (used by all AI harnesses)

Memory is stored in `.memory/` (gitignored). The service starts automatically on next boot (`restart: unless-stopped`).

### 3. Apply database migrations

```bash
pnpm db:migrate
```

### 3. Run the dev server

```bash
pnpm dev
```

## Scripts

```bash
pnpm dev             # Start dev server
pnpm build           # Production build
pnpm lint            # Lint (0 warnings allowed)
pnpm lint:fix        # Lint and auto-fix
pnpm typecheck       # TypeScript check
pnpm test            # Unit tests
pnpm test:unit       # Unit tests (verbose)
pnpm test:watch      # Watch mode
pnpm test:coverage   # Tests with coverage (100% required)
pnpm test:e2e        # Playwright e2e tests
pnpm db:generate     # Generate Drizzle migrations from schema
pnpm db:migrate      # Apply migrations to database
pnpm db:pull         # Introspect DB and generate schema
pnpm db:push         # Push schema directly (dev only)
pnpm db:studio       # Open Drizzle Studio GUI
```

## Environment Variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API |
| `DATABASE_URL` | Supabase > Project Settings > Database > Connection string > Session mode |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL (default: `http://localhost:3000`) |

See `.env.example` for all required variables with comments.

## Architecture

Feature-based structure:

```
src/
├── app/           # Next.js routing + layouts
├── features/
│   ├── auth/      # Email+password login, logout, session hook, protected routes
│   └── todos/     # CRUD server actions, add form, todo list
├── shared/        # lib | db | components/ui
└── e2e/           # Playwright tests
```

Dependency direction: `features/* → shared/*` (never reverse).

## Pre-commit Hooks

Husky runs `vitest --coverage` on every commit. The commit is blocked if coverage drops below 100%.

## Cursor AI Setup

Cursor rules, agents, and skills are preconfigured in `.cursor/`:

- **Rules** (11): always-on guardrails for coding standards, architecture, security, and more
- **Agents** (7): specialized roles (`technical-lead`, `frontend`, `backend`, `test-qa`, `business-analyst`, `code-reviewer`, `security-researcher`)
- **Skills** (5): `/discover-feature`, `/build-feature`, `/create-api-route`, `/review-branch`, `/security-audit`

### Initial Setup (once per project)

**1. Install mcp-memory-service** (if not already installed):

```bash
# macOS
brew install pipx && pipx ensurepath
pipx install mcp-memory-service

# Linux / Windows
pip install pipx
pipx install mcp-memory-service
```

> **macOS note:** If you see `SQLite extension loading not supported`, run:
> `pipx install mcp-memory-service --python $(brew --prefix python@3.12)/bin/python3.12`

**2. Populate MCP memory** so agents load context efficiently:

```
/memory sync
```

This parses `.cursor/memory/architecture-snapshot.md` into semantic memory. Agents query only what they need instead of reading the full file.

---

### New Feature Workflow

Everything runs in **Agent mode**. Only two prompts across two conversations.

#### Conversation 1 — Requirements

**Prompt:**
```
/discover-feature <describe your feature in plain language>
```

**What happens:**
1. Loads existing features from MCP memory to identify relationships
2. Asks you 9 discovery questions (problem, user flows, edge cases, access rules, etc.)
3. Confirms understanding with you before writing anything
4. Writes the functional issue to `.requirements/<feature-name>.md`
5. Stores the requirement in MCP memory

**Output:** `.requirements/<feature-name>.md` with user story, acceptance criteria, and functional test cases.

> Start a new conversation before the next step.

---

#### Conversation 2 — Build (fresh conversation)

**Prompt:**
```
/build-feature @.requirements/<feature-name>.md
```

**What happens (automated, step by step):**

| Step | What it does |
|------|-------------|
| 1. Read spec | Reads `.requirements/<feature-name>.md` |
| 2. Load context | Queries MCP memory for schema, features, patterns, rules (targeted — no full file read) |
| 3. **Plan** | Tech-lead role: maps acceptance criteria to tasks, plans test structure, identifies reusable patterns → **asks your approval before coding** |
| 4. Feature structure | Creates `src/features/<name>/` directory layout |
| 5. Pre-test setup | Updates `vitest.config.ts` exclusions |
| 6. TDD RED | Writes all test files. Runs `pnpm test:unit` → must FAIL |
| 7. TDD GREEN | Runs `@backend` + `@frontend` in parallel. Runs `pnpm test:unit` → must PASS |
| 8. Refactor | Cleans up while keeping tests green |
| 9. Verify | Runs `pnpm test:coverage` + `pnpm lint` + `pnpm typecheck` in single pass |
| 10. Review gate | Runs `@code-reviewer` + `@security-researcher` in parallel |
| 11. Memory sync | Updates architecture snapshot + runs `/memory sync` |

**Output:** Fully implemented, tested, reviewed feature. Memory updated for the next session.

---

### Example: Hiring Candidates Feature

A real end-to-end walkthrough using the two-conversation workflow.

#### Conversation 1 — Requirements

**Prompt (Agent mode):**
```
/discover-feature Gestión de candidatos de contratación.

Vista principal: tabla de candidatos con columnas nombre e identificación (la
identificación es única por candidato).
Comportamiento maestro-detalle: al seleccionar una fila de la tabla, mostrar en
un panel lateral derecho todos los soportes (documentos adjuntos) que pertenecen
al candidato seleccionado.
Encima de la tabla, un botón "Agregar candidato" que abre un formulario con los
campos nombre e identificación. El número de identificación no puede repetirse.
Toda la UI en español.
```

> **Why this prompt works well:**
> - One concern per line — table, selection behavior, side panel, add form, uniqueness rule
> - Names the UI pattern ("maestro-detalle") so the agent picks the right shadcn components (`ResizablePanelGroup`)
> - Clarifies "soportes" = documentos adjuntos — no ambiguity
> - States uniqueness constraint explicitly (becomes a DB unique index + validation rule)
> - Declares language upfront — no back-and-forth later

**What happens:** The BI agent asks clarifying questions (upload limits? who can add candidates? pagination?), then writes `.requirements/hiring-candidates.md`.

**Output:**
```
.requirements/hiring-candidates.md
├── User Story
├── Acceptance Criteria (AC1–AC6)
└── Functional Test Cases (TC1–TC8)
```

> Start a new conversation before the next step.

---

#### Conversation 2 — Build

**Prompt (Agent mode):**
```
/build-feature @.requirements/hiring-candidates.md
```

**What the automated pipeline produces:**

```
src/features/hiring-candidates/
├── components/
│   ├── candidates-table.tsx         # Table with row selection
│   ├── candidate-detail-panel.tsx   # Right panel — soportes list
│   ├── add-candidate-dialog.tsx     # Dialog with name + ID form
│   └── __tests__/
│       ├── candidates-table.test.tsx
│       ├── candidate-detail-panel.test.tsx
│       └── add-candidate-dialog.test.tsx
├── actions/
│   ├── candidates.action.ts         # createCandidate Server Action
│   └── __tests__/
│       └── candidates.action.test.ts
└── queries/
    ├── candidates.queries.ts        # getCandidates, getSoportes
    └── __tests__/
        └── candidates.queries.test.ts
```

**Planning output (step 3 — shown before coding starts):**

> Backend: new `candidates` table (name, identification UNIQUE), new `soportes` table (candidateId FK), RLS policies, Server Action for createCandidate with Zod validation.
> Frontend: ResizablePanelGroup layout, CandidatesTable with row selection state, CandidateDetailPanel, AddCandidateDialog with React Hook Form + zodResolver.
> Tests: 8 unit tests covering unauthenticated, duplicate ID, DB error, happy path for action; RTL tests for each component.
> Approve to proceed?

**Final output:** Fully tested feature, 0 lint warnings, review gate passed, architecture snapshot updated.

---

### Other Workflows

#### Bug Fix (Agent mode)

```
@test-qa Reproduce this bug: <describe what's broken and where>
```
→ Produces a failing test, then:
```
@backend Fix the failing test in <file>
```
or `@frontend` for UI bugs, then:
```
@code-reviewer Review the changes in src/features/<feature>/
```

#### Refactor (Agent mode)

```
@technical-lead Plan refactor for <scope/reason>
```
→ Plan output, then:
```
@backend Implement the refactor plan
```
Then verify + review:
```
@test-qa Verify all tests still pass
@code-reviewer Review the refactor changes
```

#### Find Context Fast (any mode)

```
/memory recall "form validation patterns"
/memory recall "existing auth tables"
/memory recall "how are errors handled in actions"
```

---

### Quick Reference

| Task | Mode | Prompt |
|------|------|--------|
| Define requirements | Agent | `/discover-feature <description>` |
| Implement feature | Agent | `/build-feature @.requirements/<name>.md` |
| Sync memory after changes | Agent | `/memory sync` |
| Search project knowledge | Any | `/memory recall "query"` |
| Create API route | Agent | `/create-api-route` |
| Review a branch or PR | Agent | `/review-branch` |
| Security audit | Agent | `/security-audit` |
| Reproduce a bug | Agent | `@test-qa Reproduce: <description>` |
| Plan an architectural change | Agent | `@technical-lead Plan: <description>` |
