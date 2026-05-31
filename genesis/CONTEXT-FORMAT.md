# CONTEXT.md Format

`CONTEXT.md` is a glossary of the project's ubiquitous language — nothing else. Not a spec, not a scratch pad, not a home for implementation decisions (those go in ADRs and ARCHITECTURE.md).

## Structure

```md
# {Project Name}

{One or two sentence description of what this project is and why it exists.}

## Language

**Order**:
A one or two sentence description of the term — what it IS, not what it does.
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

## Rules

- **Be opinionated.** When multiple words exist for one concept, pick the best and list the rest under `_Avoid_`.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not how it works.
- **Only project-specific terms.** General programming concepts (timeouts, retries, error types) don't belong even if used heavily. Ask: is this a concept unique to this domain, or general? Only the former belongs.
- **Group under subheadings** when natural clusters emerge; a flat list is fine when terms cohere.
- **Update inline.** The moment a term is pinned during the grill, record it — don't batch.
- **Challenge conflicts.** If the user uses a term in a way that contradicts an existing entry, surface it immediately and resolve it before moving on.

## Single vs multi-context projects

Most projects: one `CONTEXT.md` at the root. If the project spans clearly separate bounded contexts, add a `CONTEXT-MAP.md` at the root listing each context, where it lives, and how they relate — and give each context its own `CONTEXT.md`.
