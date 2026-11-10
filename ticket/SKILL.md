---
name: ticket
description: Tickets, written short and filed in any project tracker. Use when creating a ticket or issue, or splitting work into tickets.
---

# Ticket

A ticket is read on **one screen** by someone deciding whether to pick it up. Problem first, then what done looks like.

## Steps

1. **Find the tracker.** Take the one the repo's docs name (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`). Else Linear, if connected. Else any tracker connected as an MCP server or CLI (Jira, GitHub Issues, ...). Else write the ticket as markdown for the user to paste. Done when you know the tracker and the team or project it goes in. Ask if two fit.
2. **Gather.** Pull the problem and the done state from the conversation. If either is unclear, ask one question. Done when you can fill every heading without guessing.
3. **Size.** One ticket is one piece of work that ships alone (one PR, for code). If the draft breaks a limit below, split it so each ticket ships and can be checked alone. Done when every ticket fits.
4. **Write** in the format below. Done when every limit is met and every Done when line is checkable.
5. **File.** Search the tracker for a duplicate first. Set the fields the repo's docs ask for (labels, project, estimate). Link split tickets with blocks / blocked by. Put logs, payloads and repro steps in a first comment, not the body. Done when you reply with each ticket's ID and link.

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
Source, size, links, what a sibling ticket owns.
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
