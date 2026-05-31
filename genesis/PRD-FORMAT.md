# PRD.md Format

`docs/PRD.md` is the *why* and *what* — never the *how* (that's ARCHITECTURE.md). It defines outcomes, scope, and constraints so both humans and agents share one source of truth for intent.

## Structure

```md
# {Project} — Product Requirements (v{N})

> The why and what. Domain terms: CONTEXT.md. The how: ARCHITECTURE.md. Rationale: docs/adr/.

## Problem
{What hurts today, concretely. The failure mode you're fixing.}

## What it is
{One paragraph: the product in plain language.}

## Users
{Who they are, their context, what makes them distinct (e.g. private per-user, non-technical).}

## Goals (v{N})
{3–5 outcomes, each a capability the user gains — not a feature list.}

## Core use cases
{Numbered, concrete, in the user's words. "Remind me Friday to email the landlord" → fires Friday.}

## In scope (v{N})
{Bullet list of what ships.}

## Explicit non-goals (v{N})
{Bullet list of what deliberately does NOT ship. The "no"s are as load-bearing as the "yes"s —
they stop scope creep and tell the agent what not to build.}

## Success criteria
{Measurable / checkable statements. "A captured item is never lost." "No user reads another's data."}
```

## Rules

- **Outcomes over features.** Goals describe what the user can now do, not the mechanism.
- **Non-goals are mandatory.** An explicit "not in v1" list is one of the most valuable parts — write it deliberately, drawn from what the grill chose to defer.
- **Success criteria must be checkable.** Vague aspirations ("fast", "intuitive") don't belong; concrete invariants do.
- **No implementation.** Stack, schema, and components live in ARCHITECTURE.md. If you're describing *how*, you're in the wrong doc.
- **Living + versioned.** Tag the scope to a version; revise as the product evolves rather than rewriting history.
