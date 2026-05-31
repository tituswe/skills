# ADR Format

ADRs (Architecture Decision Records) live in `docs/adr/` with sequential numbering: `0001-slug.md`, `0002-slug.md`, etc. Create the directory lazily — only when the first ADR is needed. Scan the folder for the highest number and increment.

## Template

```md
# {Short title of the decision}

{1–3 sentences: the context, what was decided, and why.}

## Consequences   ← optional

{Only when there are non-obvious downstream effects, a switch/trigger condition,
or an invariant a future engineer must not break.}
```

An ADR can be a single paragraph. The value is recording *that* a decision was made and *why* — not filling out sections. Optional extras only when they earn their place: a **Status** line (`proposed | accepted | superseded by ADR-NNNN`), **Considered Options** (when rejected alternatives are worth remembering), **Consequences**.

## When to offer an ADR

Offer one only when **all three** are true:

1. **Hard to reverse** — the cost of changing your mind later (or the cost of the consequence, e.g. a data leak) is meaningful.
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons.

If any one is missing, skip it. Easy to reverse → you'll just reverse it. Not surprising → nobody wonders why. No real alternative → nothing to record beyond "we did the obvious thing."

A frequent and high-value case: the ADR exists **to stop a future engineer from breaking an invariant** ("do not add a userId param to any tool — it would blow a hole in tenant isolation"). Here the "hard to reverse" bar is met by the *consequence* being irreversible, even if the code change is small.

### What qualifies

- Architectural shape (monorepo; event-sourced write model; append-only log + derived state).
- Integration patterns between components (events vs synchronous calls).
- Technology choices that carry lock-in (database, message bus, auth provider, embedding model).
- Boundary and scope decisions, including the explicit "no"s.
- Deliberate deviations from the obvious path (manual SQL over an ORM, and why).
- Constraints not visible in the code (compliance, latency budgets, partner contracts).
- Invariants that are easy to violate accidentally and costly when violated.
