# ARCHITECTURE.md Format

`docs/ARCHITECTURE.md` is the coherent technical design — the *how*. It describes the **current** design as a whole; ADRs record **why** each individual call was made and what was rejected. Link to ADRs for rationale; never duplicate it here.

## Structure

```md
# {Project} — Architecture (v{N})

> Technical design. Domain terms: CONTEXT.md. Scope: PRD.md. Rationale: docs/adr/.
> This describes the current coherent design; ADRs record why and the alternatives.

## Tech stack
{A table: concern → choice. Pin notable versions/constraints.}

## Components
{Numbered list. Each component: one line on its job, linking the ADR(s) that govern it.}

## Data flow
{The key flows (e.g. the write path and the read path) as short ASCII diagrams.
Call out durability/ordering boundaries explicitly.}

## Data model
{The canonical schema / DDL — the source of truth until migrations exist —
plus the key modelling decisions in one line each (and the ADRs behind them).}

## Processing / agent model
{The runtime: the loop, queues, tools/contracts, per-request context, concurrency model.}

## Security & privacy
{Trust boundaries, tenant isolation, how untrusted input is handled.}

## Deployment & ops
{Topology, process supervision, secrets handling, backups/durability.}

## Known scaling triggers
{The conditions under which a v1 choice must change, and the additive path to the next step.}

## Deferred edges   ← optional
{Conscious design-level deferrals — edge cases and refinements you deliberately chose NOT to handle yet
(empty/first-run states, a merge-vs-split correction, log retention). Recorded so a future reader
doesn't think they were missed and "fix" them silently. Distinct from PRD non-goals (product scope)
and scaling triggers (when a choice breaks); these are smaller, design-internal "not yet"s.}
```

## Rules

- **Current design, not history.** Describe what *is*. Decisions, alternatives, and "why" belong in ADRs — link them.
- **DRY across docs.** Terms → CONTEXT.md. Rationale → ADRs. Scope/non-goals → PRD. Reference, don't restate.
- **Show, don't hand-wave.** Put the actual schema/DDL and concrete data-flow diagrams in. Make durability and isolation boundaries visible.
- **Name the scaling triggers.** Record where each "good enough for now" choice breaks and the additive migration out — so the future reader isn't surprised.
- **Living document.** Update it as the design changes; it should always match reality.
