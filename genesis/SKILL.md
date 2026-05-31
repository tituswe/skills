---
name: genesis
description: Golden-standard setup for a new greenfield project — stress-test the plan through a relentless one-question-at-a-time interview, sharpen domain language into a glossary, record hard decisions as ADRs, research best practices when unsure, produce the foundational doc set (CONTEXT.md, PRD, ARCHITECTURE, AGENTS.md), and initialize git. Use when the user wants to start, scaffold, kick off, plan, or properly set up a new project from an idea.
---

<what-to-do>

Turn a raw project idea into a solid, agent-ready foundation: a stress-tested design, a glossary, decision records, the core docs, and an initialized git repo. Work the phases in order. Do not rush to code — the value is in the upfront thinking, captured durably. Invest human time in planning; reclaim it later in implementation.

</what-to-do>

<operating-principles>

Apply these throughout every phase:

- **One question at a time.** Interview relentlessly: ask a single question, give your recommended answer, wait for the response, then go deeper. Never batch questions.
- **Walk the design tree.** Resolve dependencies one by one — each answer unlocks the next question. Start at the root (the core domain entity and its lifecycle), not the leaves.
- **Explore over ask.** If a question can be answered by reading the codebase or the web, do that instead of asking.
- **Recommend, don't just ask.** Every question carries your opinionated recommendation and the trade-off behind it.
- **Sharpen fuzzy language.** When the user uses a vague or overloaded term, propose a precise canonical term and record it. Challenge any term that conflicts with the existing glossary immediately.
- **Use concrete artifacts.** Put DDL, draft prompts, ASCII flows, schemas, and option previews in front of the user to react to — not abstract questions. Reactions to artifacts beat answers to questions.
- **Reconcile, never paper over.** When a new answer contradicts a settled decision, say so explicitly, then amend the affected docs/ADRs in place. A contradiction surfaced is far cheaper than one buried.
- **Living docs.** Update CONTEXT.md and ADRs the moment a decision crystallises — don't batch them up at the end.
- **Don't over-spec.** Write the foundation now; leave per-feature specs for when each feature is actually built (just-in-time, not waterfall). The "curse of instructions": models and humans both degrade under a wall of premature requirements.

</operating-principles>

<phases>

## Phase 0 — Intake

Get the one-paragraph pitch: what it is, who it's for, what problem it solves. Just enough to start the interview. Don't design yet.

## Phase 1 — Grill the plan

Interview the user relentlessly about every aspect of the plan until you reach shared understanding, walking down each branch of the design tree.

- As terminology resolves, maintain **CONTEXT.md** — a pure glossary of the project's ubiquitous language. Create it lazily when the first term is pinned. Keep implementation detail out of it. See [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).
- As hard decisions crystallise, record **ADRs** in `docs/adr/`. Offer one only when all three hold: **hard to reverse**, **surprising without context**, and **the result of a real trade-off**. Often an ADR's real value is to stop a future engineer from unknowingly breaking an invariant. See [ADR-FORMAT.md](./ADR-FORMAT.md).

Branches to walk (adapt to the domain): the core entity and its lifecycle; how distinct concepts relate and where their boundaries lie; the data model; external interfaces; the processing / agent model; security and multi-tenancy boundaries; failure modes and durability; operations and deployment; the UX / interaction surface. Probe each with concrete edge-case scenarios to force precision.

## Phase 2 — Research & harden

When the user signals unfamiliarity, or when an industry standard would beat your priors, **research before committing**: web-search and fetch primary docs. Synthesize, cite sources, and explicitly reconcile findings against decisions already made — confirm, refine, or flag a contradiction. Scale rigor to the project: a personal tool is not a production platform.

Then, once the design is settled, run an explicit **hardening pass** before writing the final docs — don't ship the happy path. Adversarially stress-test the settled design against the failure modes the grill is prone to gloss over: **failure & durability** (crashes mid-operation, retries, at-least-once vs exactly-once delivery, partial writes), **security & isolation** (trust boundaries, tenant leakage, prompt-injection / the lethal trifecta for agentic systems, secret handling), **concurrency** (races, ordering, locking), and **domain edge cases** (time-zone/DST math, empty/first-run states, encoding pitfalls). For anything beyond a small project, fan out parallel subagents — one per dimension — to red-team concurrently, then fold confirmed findings back into the ADRs and the design. This proactive sweep is distinct from the reactive "research when unsure" above, and is often the single highest-leverage step in the whole process.

## Phase 3 — Produce the foundational doc set

Once the design is settled, write the core docs (CONTEXT.md and the ADRs already exist from Phase 1). Keep them DRY and cross-linked: rationale lives in ADRs, terms in CONTEXT.md, scope in the PRD — reference, never duplicate.

In order:

1. **docs/PRD.md** — product requirements: problem, users, goals, core use cases, in-scope, **explicit non-goals**, success criteria. See [PRD-FORMAT.md](./PRD-FORMAT.md).
2. **docs/ARCHITECTURE.md** — the coherent technical design: tech stack, components, data flows, data model / schema, the processing / agent model, security, ops, scaling triggers. Links to ADRs for the *why*. See [ARCHITECTURE-FORMAT.md](./ARCHITECTURE-FORMAT.md).
3. **AGENTS.md** (repo root) — the operating manual for agents and humans: stack, commands, structure, code style, testing, git workflow, and boundaries as ✅ always / ⚠️ ask-first / 🚫 never. Stub commands/structure if no code exists yet. See [AGENTS-FORMAT.md](./AGENTS-FORMAT.md).

Resulting layout:

```
/
├── CONTEXT.md
├── AGENTS.md
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── adr/
│   └── specs/        ← per-feature specs, added just-in-time later
```

## Phase 4 — Initialize git

1. `git init -b main` (skip if already a repo).
2. Write a **.gitignore** for the stack — always exclude secrets / `.env`, databases and data files, build artifacts, and editor/OS cruft.
3. Stage, then **verify no secrets or data files are staged** before committing — grep the staged list for `.env`, secret, and database patterns.
4. Make the initial commit only after that check passes. Use the project's configured identity and the standard co-author trailer.
5. Establish the **ongoing per-feature workflow** in AGENTS.md (sync `main` → branch → work + tests → verify → PR; never commit or push to `main`). Recommend GitHub **branch protection** on `main` for hard enforcement (require PR + passing checks, block direct pushes); note it needs a public repo or a paid plan for private repos — otherwise it remains a soft rule.

## Done

Summarize what now exists (docs + commit) and offer the next step: a milestoned build plan, scaffolding the repo, or stopping. If the user wants to move toward building, produce **docs/BUILD-PLAN.md** — a dependency-ordered, vertically-sliced milestone plan that lets agents build in parallel without collisions; see [BUILD-PLAN-FORMAT.md](./BUILD-PLAN-FORMAT.md). Do not begin implementation unless asked.

</phases>
