---
name: work
description: Work a Linear ticket end-to-end. Read the ticket via the Linear MCP, open a worktree in .claude/worktrees off the default branch, plan, build, test (Chrome for UI changes, unit/integration/e2e coverage otherwise), then commit, push, and open the PR (per the repo's own docs). Use when the user says "/work ABC-10", or asks to start, do, or work on a Linear ticket by ID (e.g. "start ABC-10", "do ABC-10", "work on ABC-10").
---

<what-to-do>

Take a single Linear ticket ID (e.g. `ABC-10`) and carry it from "untouched backlog
item" to "open pull request". Read the ticket, open a worktree, plan, build, test,
then commit, push, and open the PR so the user can review it.

</what-to-do>

<inputs>

- **Required:** a Linear ticket ID, like `ABC-10`. It is passed as the skill argument.
- If no ID is given, ask for one before doing anything else. Do not guess a ticket.

</inputs>

<operating-principles>

- **The repo's docs win.** This skill is the default flow. Where the repo's
  `CLAUDE.md`, `AGENTS.md`, or `CONTRIBUTING.md` say otherwise (branch names, worktree
  path, checks, PR format), follow the repo.
- **Never touch the default branch.** Branch off an up-to-date `origin/<default>`
  (usually `main`). Never commit or push to it.
- **Always work in a dedicated worktree.** Every run creates its own worktree (see
  step 2). This keeps the main checkout untouched and lets several agents run different
  tickets at once. Two agents sharing one checkout would clobber each other's files,
  whatever the branch.
- **Never ship untested work.** Step 5 must pass before step 6.
- **One ticket, one branch, one worktree, one PR.** Don't bundle unrelated work.
- **Read before you write.** Read the ticket, the repo's `CLAUDE.md`, `AGENTS.md`,
  `CONTRIBUTING.md`, and `CONTEXT.md`, and the docs for whatever part you're touching,
  before editing code.

</operating-principles>

<steps>

## 1. Read the ticket

- Resolve the ID via the Linear MCP. Prefer `mcp__linear__get_issue` with the ID
  (e.g. `ABC-10`). Pull the title, description, done list, size, labels, and any
  comments. Comments often hold the evidence (logs, payloads, repro steps) or change
  scope.
- If the ID doesn't resolve, stop and tell the user. Don't invent scope.

## 2. Open a worktree

- Find the main checkout first:
  `root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"`. This
  skill may start from inside another worktree, and a relative path from there would
  nest the new worktree inside it.
- Find the default branch: `git -C "$root" symbolic-ref --short refs/remotes/origin/HEAD`
  (e.g. `origin/main`). If that is unset, use `origin/main`.
- Pick a branch name. Use the repo's convention if its docs name one. Otherwise use a
  conventional prefix (`feat/`, `fix/`, `chore/`, `docs/`) from the ticket kind, the
  lowercased ID, and a short slug, e.g. `feat/abc-10-bulk-export`.
- Pick the path. Use the repo's worktree path if its docs name one. Otherwise use
  `.claude/worktrees/<lowercased ID>` at the root of the main checkout.
- Fetch, then create the worktree and branch in one step, straight off the fresh remote
  ref. **Do not** check out the default branch first: it can only be checked out in one
  worktree, so that fails as soon as a second agent runs it.

  ```bash
  root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
  git -C "$root" fetch origin
  git -C "$root" worktree add .claude/worktrees/abc-10 -b feat/abc-10-bulk-export origin/main
  cd "$root/.claude/worktrees/abc-10"
  ```

- Keep worktrees out of `git status`. If `git -C "$root" check-ignore -q .claude/worktrees/`
  fails, add `.claude/worktrees/` to `$root/.git/info/exclude` (local only, never
  committed).
- Do all later work from inside the worktree.

## 3. Plan

- Read the repo's docs for the parts you'll touch, for conventions.
- Think through the approach and form a concrete plan. Use TODOs to track multi-step
  work.
- Plan the tests too: which unit, integration, and end-to-end tests the change needs, or
  which UI flows to click through in step 5.
- Before writing code, post a short summary to the user. **What the ticket is:** 1-2
  sentences in your own words, plus the done list. **What you're going to do:** the
  approach, and which parts of the repo (apps, packages, services) and layers you expect
  to touch.

## 4. Build

- Set up the worktree. A fresh worktree has no dependencies and no gitignored env
  files:
  - Install dependencies the way the repo's docs say. In a repo with several apps or
    packages, install each one you'll touch.
  - Copy any gitignored env files the code or its tests need (`.env`, `.env.local`)
    from the same path in the main checkout (`$root/...`) if they are missing.
- Implement the change. Keep it scoped to this ticket.
- Update affected docs as part of the change.

## 5. Test

Prove the change works before shipping. The path depends on the change.

**UI change** (anything a user sees):

- Load the `claude-in-chrome` skill first.
- Start the dev server from the worktree, the way the repo's docs say. Start any
  backend the page needs too. If the port is taken, use the one the dev server prints.
- In Chrome, click through every flow the ticket touches. Include the empty, error, and
  edge states the ticket names. Check the console for errors.
- Check each "Done when" line that the UI can show.
- Take screenshots of the changed screens and save the files locally for the PR.

**Not a UI change:**

- Make sure coverage is adequate at every level the change touches. Find where the repo
  keeps each kind of test and follow its patterns. Add the tests that are missing:
  - **Unit:** each new or changed function, including edge cases and failure paths.
  - **Integration:** the parts working together (routes, services, the database).
  - **End-to-end:** user flows the change affects.
- Each "Done when" line maps to at least one test.
- A bug fix gets a test that fails before the fix and passes after it.
- If the repo has no setup for a level the change needs, don't build one inside this
  ticket. Say so in the PR.

**Every change:**

- Run every check the repo's docs list before a PR, for each part you touched:
  typecheck, lint, tests, and e2e. If the docs list none, run the matching scripts the
  repo defines (e.g. in `package.json`).
- Everything must pass. If something fails, go back to step 4. Never move on with
  failing or skipped tests.

## 6. Ship

- Commit the work on the ticket branch (a conventional commit message referencing the
  ticket ID), push the branch to `origin`, and open the PR with `gh pr create` against
  the default branch.
- If the repo has PR rules (often in `CONTRIBUTING.md`), read them fresh every time and
  follow them exactly, including any length limits. Do not work from memory of an older
  version. With no rules, write a conventional title with the ticket ID, and a short
  body: why, what changed, how it was tested.
- For a UI PR, use the screenshots from step 5.
- After opening the PR, report back with the PR URL and a short recap of what was done.
  Tell the user the worktree path (e.g. `.claude/worktrees/abc-10`), and that once the
  PR is merged they can clean it up from the main checkout with
  `git worktree remove .claude/worktrees/abc-10`.

</steps>
