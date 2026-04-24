@AGENTS.md
@.claude/rules/general.mdc
@.claude/rules/architecture.mdc
@.claude/rules/coding-standards.mdc

# Context-Specific Rules

Read these rules when working on related files:
- Data fetching (components, queries, hooks, actions): `.claude/rules/data-fetching.mdc`
- Security (actions, API routes, auth, config): `.claude/rules/security.mdc`
- Components (UI, shadcn/ui, Tailwind): `.claude/rules/components.mdc`
- Forms: `.claude/rules/forms.mdc`
- Migrations: `.claude/rules/migrations.mdc`
- Next.js specifics: `.claude/rules/nextjs.mdc`
- Supabase (Drizzle, RLS, repository pattern): `.claude/rules/supabase.mdc`
- Testing: `.claude/rules/testing.mdc`

# Agent Workflow

This project uses specialist agents in `.claude/agents/`. Follow the technical-lead workflow:

- **New feature**: `/discover-feature` (Conversation 1) → `/build-feature` (Conversation 2, fresh)
- **Bug fix**: reproduce with failing test (`test-qa`) → fix (`backend`/`frontend`) → review (`code-reviewer`)
- **Refactor**: plan (`technical-lead`) → implement (`backend`/`frontend`) → verify (`test-qa`) → review (`code-reviewer`)

## Recommended: 2-Conversation Workflow for New Features

Split new feature work across two conversations to avoid context exhaustion:

**Conversation 1 — Requirements** (Agent mode)
```
/discover-feature <description>  →  discovery questions  →  writes .requirements/<name>.md
```

**Conversation 2 — Build** (Agent mode, fresh conversation)
```
/build-feature @.requirements/<name>.md  →  planning → TDD pipeline → review → memory sync
```

The `/build-feature` skill reads the requirements file directly and runs the full pipeline — tech-lead planning, TDD implementation (backend + frontend in parallel), review gate, and memory sync. This keeps each conversation well under 60% context usage.

# File Naming

- Server Actions: `name.action.ts` with `"use server"` at top
- React hooks: `use-name.ts`
- Components: PascalCase `.tsx`
- Tests: colocated in `__tests__/`, named `name.test.ts`

# MCP Memory Service

This project uses [mcp-memory-service](https://github.com/doobidoo/mcp-memory-service) for persistent semantic memory across sessions.
Config is shared via `.cursor/mcp.json` (symlinked to `.mcp.json`).

If not installed automatically during scaffolding, install via `pipx` (works on macOS, Linux, Windows):

```bash
# macOS
brew install pipx && pipx ensurepath
pipx install mcp-memory-service

# Linux / Windows
pip install pipx
pipx install mcp-memory-service
```

> **macOS note:** If you see `SQLite extension loading not supported`, pipx picked Apple's Python.
> Fix: `pipx install mcp-memory-service --python $(brew --prefix python@3.12)/bin/python3.12`

## Memory Skill

Use `/memory` to sync and query project knowledge:

- `/memory sync` — Parse `architecture-snapshot.md` and store each entry in MCP memory (run after scaffolding; `/build-feature` runs this automatically at the end of each feature)
- `/memory recall "query"` — Semantic search across stored memories (avoids reading the full snapshot)
- `/memory update` — Merge `status:pending-snapshot` memories back into the snapshot file

## How Agents Use Memory

All agents (`technical-lead`, `frontend`, `backend`, `business-analyst`, `test-qa`) load context via targeted `search_memory` calls instead of reading the full snapshot. Each agent queries only the domains it needs, saving tokens. If the memory service is unavailable, agents fall back to reading `.cursor/memory/architecture-snapshot.md` directly.

# Maintenance Notes
