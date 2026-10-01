---
name: work
description: Work a Linear ticket end-to-end. Read the ticket via the Linear MCP, open a worktree in .claude/worktrees off main, plan, build, test (Chrome for UI changes, unit/integration/e2e coverage otherwise), then commit, push, and open the PR (per CONTRIBUTING.md). Use when the user says "/work GLA-10" (or the aliases "/start", "/do") or asks to begin work on a Linear ticket by ID.
---

<what-to-do>

Take a single Linear ticket ID (e.g. `GLA-10`) and carry it from "untouched backlog
item" to "open pull request". Read the ticket, open a worktree, plan, build, test,
then commit, push, and open the PR so the user can review it on GitHub.

</what-to-do>

<inputs>

- **Required:** a Linear ticket ID, like `GLA-10`. It is passed as the skill argument.
- If no ID is given, ask for one before doing anything else. Do not guess a ticket.

</inputs>

<operating-principles>

- **Never touch `main`.** Branch off an up-to-date `origin/main`. Never commit or push
  to `main`.
- **Always work in a dedicated worktree in `.claude/worktrees/`.** Every run creates its
  own worktree there, at the root of the main checkout (see step 2). This keeps the main
  checkout untouched and lets several agents run different tickets at once. Two agents
  sharing one checkout would clobber each other's files, whatever the branch.
- **Never ship untested work.** Step 5 must pass before step 6.
- **One ticket, one branch, one worktree, one PR.** Don't bundle unrelated work.
- **Read before you write.** Read the ticket, the relevant `docs/`, `CONTEXT.md`, and the
  per-app `AGENTS.md` for whatever app you're touching before editing code.

</operating-principles>

<steps>

## 1. Read the ticket

- Resolve the ID via the Linear MCP. Prefer `mcp__linear__get_issue` with the ID
  (e.g. `GLA-10`). Pull the title, description, done list, size, labels, and any
  comments. Comments often hold the evidence (logs, payloads, repro steps) or change
  scope.
- If the ID doesn't resolve, stop and tell the user. Don't invent scope.

## 2. Open a worktree in `.claude/worktrees/`

- Pick a branch name with the conventional prefix from CONTRIBUTING.md (`feat/`, `fix/`,
  `chore/`, `docs/`) derived from the ticket kind, including the lowercased ID and a short
  slug, e.g. `feat/gla-10-subset-billing-cycle`.
- Find the main checkout first. This skill may start from inside another worktree, and a
  relative path from there would nest the new worktree inside it.
- Fetch, then create the worktree and branch in one step, straight off the fresh remote
  ref. **Do not** `git switch main` first: `main` can only be checked out in one
  worktree, so that fails as soon as a second agent runs it.

  ```bash
  root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
  git -C "$root" fetch origin
  git -C "$root" worktree add .claude/worktrees/gla-10 -b feat/gla-10-subset-billing-cycle origin/main
  cd "$root/.claude/worktrees/gla-10"
  ```

- Name the worktree directory after the lowercased ticket ID (`gla-10`). Do all later
  work from inside it.
- `.claude/worktrees/` is gitignored. If CONTRIBUTING.md names a different worktree
  path, follow CONTRIBUTING.md.

## 3. Plan

- Read the relevant `docs/`, `CONTEXT.md`, and the target app's `AGENTS.md` for
  conventions.
- Think through the approach and form a concrete plan. Use TODOs to track multi-step
  work.
- Plan the tests too: which unit, integration, and end-to-end tests the change needs, or
  which UI flows to click through in step 5.
- Before writing code, post a short summary to the user. **What the ticket is:** 1-2
  sentences in your own words, plus the done list. **What you're going to do:** the
  approach, and which apps (`apps/web-v2`, `apps/marketing`, `apps/server`) and layers
  you expect to touch.

## 4. Build

- Set up each app you'll touch. A fresh worktree has no `node_modules` and no env files
  (both gitignored), and each app has its own:
  - `npm install --prefix apps/<app>`
  - Copy the app's env file (`.env` or `.env.local`) from the same app in the main
    checkout (`$root/apps/<app>/`) if it is missing.
- Implement the change. Keep it scoped to this ticket.
- Update affected docs (`docs/`, `apps/<app>/docs/`, `README.md`) as part of the change.

## 5. Test

Prove the change works before shipping. The path depends on the change.

**UI change** (anything a user sees in `apps/web-v2`, `apps/web`, or `apps/marketing`):

- Load the `claude-in-chrome` skill first.
- Start the app's dev server from the worktree (`npm run dev --prefix apps/<app>`), plus
  the server if the page needs the API. If the port is taken, use the one the dev server
  prints.
- In Chrome, click through every flow the ticket touches. Include the empty, error, and
  edge states the ticket names. Check the console for errors.
- Check each "Done when" line that the UI can show.
- Take screenshots of the changed screens and save the files locally for the PR.

**Not a UI change:**

- Make sure coverage is adequate at every level the change touches. Add the tests that
  are missing:
  - **Unit:** each new or changed function, including edge cases and failure paths.
  - **Integration:** routes, services, and the database working together
    (`apps/server/test/`).
  - **End-to-end:** user flows the change affects (`apps/web-v2/e2e/`, Playwright).
- Each "Done when" line maps to at least one test.
- A bug fix gets a test that fails before the fix and passes after it.

**Every change:**

- Run the checks in CONTRIBUTING.md "Before opening a PR" for each app you touched.
  Today that means:
  - `npm run typecheck --prefix apps/<app>`
  - `npm run test --prefix apps/server` (needs a `.env` with `JWT_SECRET`) and
    `npm run test --prefix apps/web-v2`
  - `npm run e2e --prefix apps/web-v2` against a running dev server, when you touched a
    flow it covers
- Everything must pass. If something fails, go back to step 4. Never move on with
  failing or skipped tests.

## 6. Ship

- Commit the work on the ticket branch (a conventional commit message referencing the
  ticket ID), push the branch to `origin`, and open the PR with `gh pr create` against
  `main`.
- Write the PR title and body by the **Pull requests** section of the repo's
  `CONTRIBUTING.md`. Read it fresh every time and follow it exactly, including its hard
  length limits. Do not work from memory of an older version.
- For a UI PR, use the screenshots from step 5.
- After opening the PR, report back with the PR URL and a short recap of what was done.
  Tell the user the worktree path (e.g. `.claude/worktrees/gla-10`), and that once the
  PR is merged they can clean it up from the main checkout with
  `git worktree remove .claude/worktrees/gla-10`.

</steps>
