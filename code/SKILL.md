---
name: code
description: Code a ticket or task end to end, in a new worktree, through to an open PR. Use when asked to code or implement a ticket by its ID.
---

# Code

Carry one ticket or task from words to an open PR. One task, one worktree, one branch, one PR. The repo's docs (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`) win on branch names, worktree path, checks and PR title.

**Input:** a ticket ID (e.g. `ABC-10`) or a task in words. With neither, ask.

## 1. Read the work

- **Ticket:** fetch it from the tracker the repo's docs name, else Linear, else whichever is connected. Read its comments too: they hold logs, repro steps and scope changes. If the ID doesn't resolve, stop and say so.
- **Task:** treat the user's words as the ticket. If the done state is unclear, ask one question.

Done when you can list every "Done when" line.

## 2. Open a worktree

Branch straight off the fresh remote ref, from the main checkout's root. Checking out the default branch first fails once another worktree has it.

```bash
root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
git -C "$root" fetch origin
git -C "$root" worktree add "$root/.claude/worktrees/<slug>" -b <type>/<slug> origin/<default>
```

- `<default>`: from `git -C "$root" symbolic-ref --short refs/remotes/origin/HEAD`, else `main`.
- `<slug>`: the lowercased ticket ID plus a few words (`abc-10-bulk-export`), or just a few words for a task. The ID in the branch lets the tracker link the PR.
- `<type>`: `feat`, `fix`, `chore` or `docs`.
- If `.claude/worktrees/` isn't ignored, add it to `$root/.git/info/exclude`.
- In the worktree, install dependencies and copy gitignored env files (`.env`, `.env.local`) from the same path in `$root`.

Done when the repo's test command runs inside the worktree. Work only there from now on.

## 3. Plan

Read the docs for the parts you'll touch. Tell the user in a few lines: the work in your own words, the approach, the files you expect to touch, and the tests you'll add. Then carry on.

## 4. Build

Change only what the work needs. Update the docs the change affects.

## 5. Prove

- **Bug fix:** a test that goes red before the fix and green after. Keep both runs' output.
- **New behaviour:** tests at each level the change touches (unit, integration, end-to-end), in the repo's patterns. Each "Done when" line maps to a test. Where the repo has no setup for a level, say so in the PR.
- **UI change:** load the browser skill, start the dev server from the worktree, and click through every flow the work touches, including empty and error states. Take before and after screenshots.
- **Every change:** run every check the repo's docs list before a PR (typecheck, lint, tests).

Done when every "Done when" line has proof and every check is green. On red, go back to 4.

## 6. Ship

- Commit with a conventional message, with the ticket ID if there is one. Push the branch.
- Open the PR against the default branch with `gh pr create`. Write the body with the `pr` skill, loaded fresh. The repo's rules set the title, image uploads and footer. Put step 5's proof in Evidence.
- Stop at the open PR. Merging is the user's call.
- Reply with the PR link, the worktree path, and the cleanup command for after merge: `git worktree remove <path>`.
