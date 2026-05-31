# BUILD-PLAN.md Format

`docs/BUILD-PLAN.md` is the bridge from the settled foundation to implementation: a **dependency-ordered, vertically-sliced** sequence of milestones that lets one or several agents build without colliding. It is *sequencing*, not per-feature specs — the "how to build it in what order," never the detailed design (that's ARCHITECTURE) or the scope (PRD). Optional: produce it only when the user wants to move toward building; skip it for a pure documentation pass.

## Structure

```md
# {Project} — Build Plan (v{N})

> Dependency-ordered, vertically-sliced milestones. Scope: PRD.md. Design: ARCHITECTURE.md. Working rules: AGENTS.md.

## How to use this
{One line each: slices are vertical features with their own tests; which milestones block; which parallelize;
what must NOT be parallelized (shared schema / boundary code); every slice lands with tests + green CI.}

## Milestones

### M0 — Scaffold (blocking, single agent)
{Repo skeleton: manifest, strict config, test/lint/CI, migration runner, logging, the git-workflow hook.
Exit: a named, checkable condition — e.g. "install + typecheck + test green on an empty skeleton".}

### M1 — {Foundational slice} (blocking)
{The persistence / ingestion spine everything else needs. Exit: a checkable condition.}

### M2a … M2e — {Parallel slices}
{Decomposed by component so two agents never edit the same files. One worktree per slice.}

### M3 — Integration hardening (single agent, after merges)
{End-to-end pass; full eval/test suite as a release gate; fresh-context review against this plan + the ADRs.}

## Parallelization map
{An ASCII dependency graph: what blocks what, what fans out, where it rejoins.}
```

## Rules

- **Vertical slices, not layers.** Each milestone is a thin end-to-end feature with its own tests — not "all the DB, then all the API." A slice should be independently landable behind green CI.
- **Blocking first, single-agent.** Scaffold (M0) and the foundational spine (M1) gate everything; do them first, one agent. Mark them explicitly as blocking.
- **Decompose parallel work by file ownership.** Parallelizable slices must not edit the same files — that's what makes a worktree-per-slice safe. Call out the shared surfaces (schema, security/scoping code) that must **not** be touched in parallel without coordination.
- **Every exit is checkable.** Each milestone names a concrete, verifiable exit condition — not "done when it works."
- **Name the integration gate.** A final single-agent pass reconciles the slices and runs the full suite as a release gate; don't assume parallel slices compose for free.
- **Sequencing, not specs.** Keep per-feature detail out — link to ARCHITECTURE/ADRs. The plan answers *what order and who*, not *exactly how*.
- **Cross-link.** Reference PRD (scope), ARCHITECTURE (design), AGENTS.md (the per-slice git/worktree workflow) rather than restating them.
- **Living + versioned.** Tag to a version; revise as milestones land rather than rewriting history.
