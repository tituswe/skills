---
name: ticket
description: Tickets, written short and filed in any project tracker. Use when turning a spec or description into tickets, or creating a ticket or issue.
---

# Ticket

Turns a spec or a description into the tickets that fulfil it: one ticket when the work is one PR, several when it is more. A ticket is read on **one screen** by someone deciding whether to pick it up. Problem first, then what done looks like.

**Input:** a spec (a file, a link, a tracker doc or pasted text) or a description in words. With neither, use the conversation; if that holds no work either, ask.

## Steps

1. **Find the tracker.** Take the one the repo's docs name (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`). Else Linear, if connected. Else any tracker connected as an MCP server or CLI (Jira, GitHub Issues, ...). Else write the tickets as markdown for the user to paste. Done when you know the tracker and the team or project they go in. Ask if two fit.
2. **Read the work.** Read the whole spec, or the description. List every **requirement**: each behaviour, change or outcome the work must deliver, edge cases included. Note the spec's non-goals so no ticket takes them on. If the done state is unclear, ask one question. Done when every requirement is on the list and none is a guess.
3. **Slice.** Cut the requirements into tickets. Each ticket is a **vertical slice**: one PR that ships alone and can be checked alone, cutting through every layer it needs (data, API, UI) rather than one layer for the whole feature. Put the thinnest end-to-end slice first; later slices widen it. Order them by what blocks what. Work that fits one PR is one ticket. Done when every requirement maps to a Done when line in exactly one ticket, and every ticket fits the limits below. If a ticket breaks a limit, slice again.
4. **Confirm.** With more than one ticket, show the user a numbered list: each title, one line on its slice, and what it is blocked by. Wait for their OK or changes. Done when the user approves the list. Skip this step for a single ticket.
5. **Write** each ticket in the format below. Done when every limit is met and every Done when line is checkable.
6. **File.** Search the tracker for duplicates first. Put the tickets under the spec's project or parent issue, if it has one. Set the fields the repo's docs ask for (labels, estimate). Link tickets with blocks / blocked by, in the order from step 3. Put logs, payloads and repro steps in a first comment, not the body. Done when you reply with each ticket's ID and link, in order.

## Format

Title: names the failure or the outcome, 10 words max.

```markdown
## Problem
What is wrong or missing, as the person who hits it sees it.

## Solution
- What changes. One line each.

## Done when
- A checkable outcome. One line each.

## Notes
Source (link the spec), size, links, what a sibling ticket owns.
```

Skip Notes when empty.

## Limits

| Part | Limit |
|---|---|
| Problem | 3 sentences. What the user sees, in their words. |
| Solution | 3 bullets. What changes, not how. |
| Done when | 4 bullets. Each one checkable. |
| Notes | 2 lines. |
| Whole body | 150 words. |

## Style

- Short sentences. Plain words. The project's own terms (its glossary, if it has one).
- Join clauses with a comma, colon or full stop (no em-dashes).
- Flat bullets. Each link once.

## Example

Title: **Discount codes are ignored at checkout**

```markdown
## Problem
A cart with a discount code is charged the full price at checkout.
The cart shows the discounted total, so the charge and the receipt disagree.

## Solution
- Checkout charges the discounted total the cart shows.

## Done when
- Discounted cart: the charge matches the cart total.
- No discount: the charge is unchanged.
- 100% discount: no payment step.

## Notes
Server only, one file. Found in the checkout review.
```
