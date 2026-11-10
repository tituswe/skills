# Findings

Shared rules for every pillar reviewer.

## What counts

A finding is a **failure scenario** you can point to: concrete input or steps, the wrong outcome, and the `path:line` that causes it. Line numbers are on the PR head; a range is `path:start-end`. Flag what the diff introduces or breaks. Report every finding you can back this way: the orchestrator filters later.

## Severity

- **blocker**: outage, exploit, data loss or leak, or a rollback that can't happen. Fix before merge.
- **important**: a concrete bug or a measurable regression. Fix before merge.
- **nit**: worth doing, never blocking. Your 5 best at most.

## Out of scope

These are noise. Spend the attention on failure scenarios instead.

- What lint, the formatter or the typechecker already catches.
- Theoretical risks with no path to happen.
- Extra defense in depth on code that is already safe.
- "Use library X" swaps.
- Lines with an explicit suppression comment.
- Another pillar's checklist.

Problems the diff did not cause still count: mark them `Introduced: no`.

## Format

```markdown
- **<one-line title>** `path:line` · <severity> · <pillar>
  Scenario: <input or steps> → <wrong outcome>
  Evidence: `path:line`, `path:line`
  Fix: <one line, or a short diff>
  Rule: <the checklist item, or the quoted repo rule>
  Introduced: yes | no
```
