# AGENTS.md Format

`AGENTS.md` (repo root) is the operating manual for AI agents and humans working in the repo. It is the de-facto cross-tool standard (read by Claude Code, Cursor, Codex, Copilot, and others), so keep it portable and concrete. It tells contributors how to *work here* — distinct from the product (PRD) and design (ARCHITECTURE) docs.

## Structure

```md
# AGENTS.md — Working in the {Project} repo

- Product / scope: docs/PRD.md
- Architecture: docs/ARCHITECTURE.md
- Decisions (read before changing settled calls): docs/adr/
- Domain language: CONTEXT.md — use these terms exactly.

## Tech stack
{One line per major choice.}

## Commands
{install / dev / test / lint / typecheck / build / migrate — with the actual command and flags.
Stub as "TBD until scaffolded" if no code exists yet.}

## Project structure
{Directory map and where things live. Stub if not yet scaffolded.}

## Code style
{Concrete examples over prose. Strictness, typing, module conventions.}

## Testing
{Framework, where tests live, what must be tested (the invariants below first).
Include the rule: **never weaken or delete an existing test/eval to make a change pass unless explicitly asked** —
a test going red is a signal, not an obstacle. This guards a common agent failure mode.}

## Git workflow
State the required per-feature loop explicitly so agents follow it every time:
1. **Sync** — `git checkout main && git pull` (start from latest `main`).
2. **Branch** — `<type>/<short-slug>` (`feat/…`, `fix/…`, `docs/…`). Never work on, commit to, or push to `main`.
3. **Work** — implement with tests; small conventional commits. Never commit secrets / `.env`.
4. **Verify** — typecheck/lint/test (+ evals where relevant) all green before the PR.
5. **PR** — push the branch, open a PR against `main`; merge only after CI is green and review. Rebase/merge `main` in if the branch falls behind.

Mirror "never commit/push to `main`" in the 🚫 Never boundary. For *hard* enforcement, recommend GitHub branch protection / a ruleset on `main` (require PR + passing checks, block direct pushes) — note this needs a public repo or a paid plan for private repos; otherwise it stays a soft rule.

## Boundaries
### ✅ Always
{Safe, expected actions — and the invariants from the ADRs that must be upheld.}
### ⚠️ Ask first
{High-impact changes: tool contracts, schema/migrations, new deps, new ADR-worthy decisions.}
### 🚫 Never
{Hard stops. Always include: never commit secrets. Plus the project's irreversible-harm rules
(e.g. "never add a cross-tenant parameter", "never mutate the append-only log").}
```

## Rules

- **Concrete over abstract.** Show real commands and real code-style examples, not adjectives.
- **The three-tier Boundaries block is the heart.** ✅ always / ⚠️ ask-first / 🚫 never. Pull the 🚫 and ✅ items straight from the project's ADR invariants — this is how a future agent inherits hard-won constraints.
- **Keep it within context size.** It's loaded into every agent session — be relevant, not exhaustive. Link out to PRD/ARCHITECTURE/ADRs rather than restating them.
- **Stub honestly.** Before code exists, mark Commands/Structure/Testing as TBD; fill them in as the repo is scaffolded rather than inventing details.
- **`never commit secrets` is non-negotiable** and always present in 🚫.
