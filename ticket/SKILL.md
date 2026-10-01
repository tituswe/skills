---
name: ticket
description: Write or split Linear tickets so each one is a single reviewable PR. Use when the user says "/ticket", asks to write, file, create or split a Linear ticket, or asks to break work down. Also use before filing any ticket from a review finding or a follow-up.
---

# Writing a Linear ticket

A ticket is a promise about a PR. One ticket, one branch, one PR.

## Size is the first decision

**A ticket must fit in one PR of roughly ten files or fewer.**

That number is not a style preference. Past PRs of 18-28 files got reviewed
badly: real bugs sat next to noise, and the reviewer's attention ran out before
the diff did. A reviewer who cannot hold the whole change in their head will
approve it anyway, which is worse than a slow review.

Before writing, estimate the files. If it is over ten, split. Do not write the
big ticket and promise to split later.

**A ticket that breaks the limits below is also too big.** If the problem needs
more than three sentences, or the done list more than four bullets, split it.

### How to split

Split along **seams a PR can stop at**, not along layers.

Good seams:
- Storage and the thing that reads it, when the read is provable alone.
- A backend that is testable without its UI. The UI as its own ticket.
- One surface at a time, when several surfaces need the same change.
- The additive change, then the risky change that depends on it.

Bad seams:
- "Types" and "logic" and "tests" as three tickets. None ships alone.
- Splitting one atomic behaviour so main is briefly broken or lying.

Each half must be **independently shippable and independently provable**. If
part two is the only thing that makes part one true, it is one ticket.

Name split tickets after the parent: `8`, then `8a`, `8b`. Say in Notes what
moved and link the sibling.

## Structure

Use these four headings, in this order. Skip Notes if it would be empty.

```markdown
## Problem
What is wrong or missing today. The failure a user or operator would hit.

## Proposed solution
What changes, as bullets. Where, in a word or a file name.

## Done when
Checkable statements. Behaviour, not implementation.

## Notes
Size, source, what a sibling owns.
```

## Limits

Hard limits. The ticket is read in Linear by someone deciding whether to pick
it up. It must fit on one screen.

| Part | Limit |
|---|---|
| Title | 10 words, not counting a prefix like `[8E]`. Names the failure. |
| Problem | 3 sentences, 50 words. No file paths or function names. |
| Proposed solution | 3 bullets, one line each. |
| Done when | 4 bullets, one line each. |
| Notes | 2 lines. |
| Whole body | 150 words. |

Count before filing. Over a limit means cut. If it cannot be cut, split.

### What stays out of the body

- Logs, payloads, repro steps, code walkthroughs. Put them in the first
  comment. `/start` reads comments.
- The story of how it was found. One line in Notes: "Found in GLA-448 review."
- The same link twice. Link each issue once.
- Nested bullets.

### Rules for the body

- **Lead with the problem, not the solution.** The reader needs to know why
  before what.
- **Proposed solution says what, not how.** "Use the balance, not the total,
  for the amount and the QR" beats a function-by-function plan.
- **"Done when" is a test list.** "A centre can request approval" is checkable.
  "Approval works properly" is not.
- **Name the failure.** "The row says off while messages go out" beats
  "inconsistent state".
- Short sentences. Plain words.
- No em-dashes. Comma, colon, parentheses or a full stop.

### Example

```markdown
## Problem
A part-paid invoice on the shared number asks the parent for the full total.
The message and PayNow QR use the total. The PDF shows the balance, so they disagree.

## Proposed solution
- Manual PayNow path uses the outstanding balance for "Amount due" and the QR.

## Done when
- Part-paid: message and QR show the balance.
- Unpaid: shows the total, as today.
- Fully paid: no QR is sent.

## Notes
Server only, one file, no migration. Found in GLA-448 review.
```

## Filing it

- `mcp__linear__save_issue`, team `Glassroom`, project and milestone set.
- Set `blockedBy` / `blocks` when order matters. That is what stops a ticket
  being picked up too early.
- Put evidence in a comment right after, with `mcp__linear__save_comment`.
  Skip it if there is none.
- A ticket from a review finding says in Notes where it came from and whether
  it is live or latent. A latent bug says what makes it live. One line.

## Before you finish

Read it back and ask:
- Does it fit on one screen? Is every limit met?
- Is every "Done when" line checkable?
- Is this one PR of ten files or fewer? If not, split it now.
- Is the detail the builder needs in the comment, not the body?
