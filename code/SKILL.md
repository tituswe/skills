---
name: code
description: Code a ticket or task in a new worktree, from plan to proven commit. Use when asked to code or implement a ticket by its ID.
---

# Code

Carry one ticket or task from words to proven, committed code. One task, one worktree, one branch. The repo's docs (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`) win on branch names, worktree path and checks.

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
- `<slug>`: the lowercased ticket ID plus a few words (`abc-10-bulk-export`), or just a few words for a task. The ID in the branch lets the tracker link the work.
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
- **New behaviour:** tests at each level the change touches (unit, integration, end-to-end), in the repo's patterns. Each "Done when" line maps to a test. Where the repo has no setup for a level, say so in the hand-off.
- **UI change:** load the browser skill, start the dev server from the worktree, and click through every flow the work touches, including empty and error states. Take before and after screenshots.
- **Every change:** run every check the repo's docs list (typecheck, lint, tests).

Save the proof (test output, screenshots) outside the repo. Done when every "Done when" line has proof and every check is green. On red, go back to 4.

## 6. Hand off

- Commit with a conventional message, with the ticket ID if there is one.
- Stop at the local commit. Pushing and the PR are a separate step.
- Reply with the worktree path, the branch, a short recap, and where the proof is saved.
