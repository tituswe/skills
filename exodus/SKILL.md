---
name: exodus
description: Golden-standard setup for an existing (brownfield) project — reverse-engineer the system from its code, git history, and existing docs; relentlessly grill the user one question at a time to resolve every uncertainty about how the standard should apply here; separate reality from intent; canonicalize the domain language already present in the code into a glossary; recover the implicit decisions as ADRs; research best practices when unsure; reconcile or produce the foundational doc set (CONTEXT.md, PRD, ARCHITECTURE, AGENTS.md); and establish the git workflow without disturbing the working tree. Use when the user wants to document, formalize, onboard, retrofit, or properly set up an existing/inherited codebase that lacks a solid foundation.
---

<what-to-do>

Lead an existing codebase out of its undocumented, ad-hoc state into the same solid, agent-ready foundation that `genesis` produces for greenfield projects: a glossary, decision records, the core docs, and an enforced git workflow — but **derived from the code that already exists**, not from a fresh idea.

The hard part of brownfield is not writing docs; it is **establishing ground truth**. The code, the git history, and the existing docs are three witnesses that have drifted apart from each other and from the user's intent. Your job is to reconcile them into one coherent foundation. Work the phases in order. Read before you ask — every uncertainty you can resolve from the codebase, you must; every uncertainty you cannot, you grill the user on, one question at a time.

This is **documentation and foundation work, not a refactor.** Do not rewrite code, rename things, or change configs to fit the ideal. Capture what is real, mark the gaps, and propose changes separately.

</what-to-do>

<operating-principles>

Apply these throughout every phase. The first block is shared with `genesis`; the second is what brownfield adds.

**Shared with genesis:**

- **One question at a time.** Interview relentlessly: ask a single question, give your recommended answer, wait for the response, then go deeper. Never batch questions.
- **Walk the design tree.** Resolve dependencies one by one — each answer unlocks the next. Start at the root (the core domain entity and its lifecycle), not the leaves.
- **Explore over ask.** If a question can be answered by reading the codebase, the git history, or the web, do that instead of asking. This bar is *higher* in brownfield: the answer is usually already in the code.
- **Recommend, don't just ask.** Every question carries your opinionated recommendation and the trade-off behind it.
- **Use concrete artifacts.** Put the actual DDL you found, the real function signatures, ASCII flows of the existing code paths, and option previews in front of the user to react to — not abstract questions.
- **Living docs.** Update CONTEXT.md and ADRs the moment a decision crystallises — don't batch them up at the end.
- **Don't over-spec.** Write the foundation now; leave per-feature specs for when each feature is next touched (just-in-time, not waterfall).

**Brownfield-specific:**

- **The code is the primary witness.** When code, docs, comments, commit messages, and the user's memory disagree, the running code is the most reliable account of what the system *does*. Cite file:line for what you find. Treat existing prose docs and verbal recollection as claims to verify, not facts.
- **Separate reality from intent, always.** For every area, hold two distinct things: *what the code does today* and *what the user wants it to do*. Never silently merge them. Document reality first; record the gap explicitly (in the PRD's current-vs-target framing, or as a noted limitation in ARCHITECTURE).
- **Intentional vs. accidental.** Everything surprising in the code is either a deliberate decision (→ candidate ADR) or an accident of history (→ noted as debt/limitation). Do **not** canonicalize an accident into an invariant. When you cannot tell which it is from the code or history, this is exactly what you grill the user on.
- **Reconcile existing docs, don't clobber them.** A README, wiki, or stale `ARCHITECTURE.md` may already exist. Read it fully, salvage what is still true, and supersede the rest consciously — never blind-overwrite. Call out where the existing doc contradicts the code.
- **Mind the git history.** History reveals intent: when an invariant was added and why, what was tried and reverted, what the original authors named things. It also hides hazards: secrets or data files committed in the past survive in history even after deletion.
- **Don't break the working tree.** Your output is docs and a git workflow. If you believe code *should* change, propose it as a follow-up — do not edit it as part of exodus unless explicitly asked.

</operating-principles>

<phases>

## Phase 0 — Intake & reconnaissance

Two inputs, gathered in parallel:

1. **From the user:** a one-paragraph pitch of what the project is *now* — what it does, who uses it, what state it's in (prototype, in production, inherited/abandoned), and **why they want to formalize it now** (onboarding agents, a rewrite, a handover, taming chaos). Just enough to orient. Don't design yet.
2. **From the codebase:** reconnoiter before asking anything answerable by looking. Build a working model of reality:
   - **Inventory existing docs** — README, `docs/`, wikis, comments, any prior `AGENTS.md`/`CLAUDE.md`/`CONTEXT.md`/ADRs. Note what exists so you reconcile rather than duplicate.
   - **Read the manifests** — `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` / `Gemfile` / `Makefile` / CI config: the real stack, scripts, and commands.
   - **Map the structure** — top-level layout, entry points, the module/directory boundaries that already exist.
   - **Find the data model** — schema files, migrations, ORM models, DDL — the source of truth for the domain shape.
   - **Survey the git history** — `git log` for age, cadence, contributors; recent churn vs. stable core; reverts and "fix" commits that hint at sharp edges.
   - **Note the test surface** — what's tested tells you what the authors considered load-bearing.

   For anything beyond a small repo, fan out parallel `Explore`/`general-purpose` agents to map subsystems concurrently, then synthesize. You only need the conclusions, not the file dumps.

Produce a short **reconnaissance summary** for the user: the stack, the apparent core entities, the major components, existing docs found, and — most importantly — **the open questions and contradictions** you'll need to resolve. This list seeds Phase 1.

### Gate — confirm exodus is the right tool before grilling

Before entering Phase 1, check the two preconditions exodus depends on. If either fails, **stop and recommend the right next step instead of grilling** — do not march into the interview or touch the docs.

- **No meaningful code to reverse-engineer.** If recon found only docs / a bare skeleton (no implemented source, schema, or tests), there is no ground truth to recover. Exodus is premature — this is a *greenfield* situation. Recommend `genesis` (if no foundation exists) or going straight to the build plan (if one does), and stop.
- **A complete, current golden-standard foundation already exists.** If CONTEXT.md, PRD, ARCHITECTURE, AGENTS.md, and ADRs are all present *and* still match the code, there is nothing to reconcile. Confirm with the user; if they agree, stop rather than rewriting good docs. (Exodus applies later, if the code and docs drift apart.)

Only proceed to Phase 1 when there is real code **and** the foundation is missing, partial, or demonstrably out of sync with it — that gap is exactly what exodus reconciles. State which precondition you're relying on, in one line, before continuing.

## Phase 1 — Grill the plan (resolve every uncertainty)

Interview the user relentlessly until the foundation is unambiguous, walking down each branch of the design tree. In brownfield the grill is **uncertainty-driven**: every gap between what the code does, what the user intends, and what good practice recommends is a question you must resolve rather than guess. **Grill the user on every such uncertainty — do not paper over ambiguity with an assumption.** Prefer reading the code first; ask only what the code cannot answer.

The brownfield uncertainties to hunt for and grill on (each with your recommendation, one at a time):

- **Inconsistent terminology.** The code calls the same concept three things (`user` / `account` / `member`), or one word means two things in different modules. Which is canonical? → pin it in CONTEXT.md, list the rest under `_Avoid_`.
- **Reality vs. intent.** "The code does X. Is X intended, or is it what you want to *change*?" Drives whether X is documented as design or flagged as a gap/non-goal.
- **Intentional vs. accidental.** A surprising choice (manual SQL over the ORM; a global lock; a retry of exactly 3). Was this deliberate (→ ADR, preserve it) or incidental (→ debt, don't enshrine it)?
- **Conflicting existing docs.** The README says one thing, the code does another. Which is the source of truth, and what should the reconciled doc say?
- **Dead / abandoned code.** Features that look half-built or unused. In scope (document + keep), or out (an explicit non-goal / removal candidate)?
- **Scope of this exercise.** Document the whole repo, or one bounded context? Reality as-is, or reality + the near-term target state?
- **Invariants vs. bugs.** Behavior that could be either a hard rule or a latent bug (e.g. cross-tenant data visible in one path). Confirm before recording it as an invariant *or* a defect.
- **Hidden constraints.** Things not visible in code — compliance, partner contracts, latency budgets, a deploy environment you must not break.

As terminology resolves, maintain **CONTEXT.md** — a pure glossary of the project's ubiquitous language, seeded from the vocabulary already in the code and made consistent. Create it lazily when the first term is pinned. See [CONTEXT-FORMAT.md](../genesis/CONTEXT-FORMAT.md).

As you recover hard decisions — both the ones the user makes now *and* the implicit ones already baked into the code — record **ADRs** in `docs/adr/`. Offer one only when all three hold: **hard to reverse**, **surprising without context**, and **the result of a real trade-off**. Brownfield's highest-value ADRs are *recovered* ones: capturing why the existing code does a surprising thing, so the next engineer doesn't "fix" a load-bearing decision. See [ADR-FORMAT.md](../genesis/ADR-FORMAT.md).

Branches to walk (adapt to the domain, anchoring each to what you found in the code): the core entity and its lifecycle; how distinct concepts relate and where their boundaries lie; the data model; external interfaces; the processing / agent model; security and multi-tenancy boundaries; failure modes and durability; operations and deployment; the UX / interaction surface. Probe each with the concrete edge cases the code already reveals.

## Phase 2 — Research & harden

When the user signals unfamiliarity, when the existing code uses a library/pattern in a way you should validate, or when an industry standard would beat both your priors and the incumbent code, **research before committing**: web-search and fetch primary docs. Synthesize, cite sources, and explicitly reconcile findings against both the existing code and decisions already made — confirm, refine, or flag a contradiction. Scale rigor to the project: a personal tool is not a production platform.

Then run an explicit **hardening pass** over the system *as it actually is*, before finalizing the docs. Adversarially stress-test the real code against the failure modes brownfield systems hide: **failure & durability** (crashes mid-operation, retries, at-least-once vs exactly-once, partial writes), **security & isolation** (trust boundaries, tenant leakage, prompt-injection / the lethal trifecta for agentic systems, committed secrets), **concurrency** (races, ordering, locking), and **domain edge cases** (time-zone/DST math, empty states, encoding pitfalls). For anything beyond a small repo, fan out parallel subagents — one per dimension — to red-team the code concurrently. Crucially, **triage each finding as intentional, accidental, or latent bug** (per the operating principles): a deliberate mitigation becomes a recovered ADR; an accident becomes noted debt; a genuine defect is surfaced as a finding for Phase 4's open-items list — never silently "fixed" as part of exodus.

## Phase 3 — Reconcile / produce the foundational doc set

Once the design is settled, write the core docs — **merging into whatever already exists** rather than starting blank. Where a doc is present, salvage what's still true and supersede the rest. Keep everything DRY and cross-linked: rationale in ADRs, terms in CONTEXT.md, scope in the PRD — reference, never duplicate. (CONTEXT.md and the ADRs already exist from Phase 1.)

In order:

1. **docs/PRD.md** — product requirements reverse-engineered from the code and sharpened by the grill: problem, users, goals, core use cases, in-scope, **explicit non-goals** (often the dead/deferred code from Phase 1), success criteria. Where reality and intent differ, make the **current-vs-target** distinction explicit. See [PRD-FORMAT.md](../genesis/PRD-FORMAT.md).
2. **docs/ARCHITECTURE.md** — the coherent technical design **as the system actually is today**: real tech stack, the components you mapped, the actual data flows, the canonical schema from the migrations, the processing/agent model, security, ops. Link to ADRs for the *why*. Record **known limitations / tech debt** and the **scaling triggers** the code is already near. See [ARCHITECTURE-FORMAT.md](../genesis/ARCHITECTURE-FORMAT.md).
3. **AGENTS.md** (repo root) — the operating manual, with **real commands and real code-style examples lifted from the repo** (the scripts in the manifest, the linter config, the conventions actual files follow), and boundaries as ✅ always / ⚠️ ask-first / 🚫 never drawn from the recovered ADR invariants. No stubbing here — unlike greenfield, the code exists, so fill these in from it. See [AGENTS-FORMAT.md](../genesis/AGENTS-FORMAT.md).

Target layout (create what's missing; reconcile what's present):

```
/
├── CONTEXT.md
├── AGENTS.md
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── adr/          ← recovered + new decisions
│   └── specs/        ← per-feature specs, added just-in-time later
```

## Phase 4 — Establish the git workflow

The repo is almost certainly already under git — **do not re-init or rewrite history.**

1. **Confirm it's a repo** (`git status`). If, unusually, it isn't, `git init -b main` and treat the first commit as the import of existing code.
2. **Audit `.gitignore`** against the real stack — ensure secrets / `.env`, databases and data files, build artifacts, and editor/OS cruft are excluded. Add what's missing.
3. **Scan for already-committed hazards** — check both the working tree *and the git history* for committed secrets or data files (grep tracked files and `git log` for `.env`, key/secret, and database patterns). If any are found, flag them prominently: removing them needs history rewriting (e.g. `git filter-repo`) and secret rotation — surface this as a finding, don't silently rewrite history.
4. **Commit the new foundation** on a branch (e.g. `docs/exodus-foundation`), never directly to `main`. Verify no secrets or data files are staged before committing. Use the project's configured identity and the standard co-author trailer. Open it as a PR.
5. **Establish the ongoing per-feature workflow** in AGENTS.md (sync `main` → branch → work + tests → verify → PR; never commit or push to `main`). Recommend GitHub **branch protection** on `main` (require PR + passing checks, block direct pushes); note it needs a public repo or a paid plan for private repos — otherwise it stays a soft rule.

## Done

Summarize what now exists (which docs were created vs. reconciled, the recovered ADRs, the commit/PR) and the **open items you surfaced but did not resolve** — committed-secret hazards, dead code flagged for removal, latent bugs from the hardening pass, gaps between reality and intent. Offer the next step: a milestoned cleanup/build plan, addressing a flagged hazard, or stopping. If the user wants a cleanup/build plan, produce **docs/BUILD-PLAN.md** — dependency-ordered, vertically-sliced milestones (here, often sequencing the debt paydown and the gaps surfaced above); see [BUILD-PLAN-FORMAT.md](../genesis/BUILD-PLAN-FORMAT.md). Do not begin implementation or refactoring unless asked.

</phases>
