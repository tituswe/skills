---
name: start
description: Start work on a Linear ticket end-to-end — read the ticket via the Linear MCP, branch off main, summarize the ticket and the plan, then think/plan/execute the change, and finish by committing, pushing, and opening the PR (per CONTRIBUTING.md). Use when the user says "/start GLA-10" or asks to begin work on a Linear ticket by ID.
---

<what-to-do>

Take a single Linear ticket ID (e.g. `GLA-10`) and carry it from "untouched backlog
item" to "open pull request". You read the ticket, create the branch, restate what the
ticket is and what you intend to do, plan and implement it, then commit, push, and open
the PR so the user can review it on GitHub.

</what-to-do>

<inputs>

- **Required:** a Linear ticket ID, like `GLA-10`. It is passed as the skill argument.
- If no ID is given, ask for one before doing anything else. Do not guess a ticket.

</inputs>

<operating-principles>

- **Never touch `main`.** Branch off an up-to-date `main` (see CONTRIBUTING.md). Never
  commit or push to `main`.
- **Always work in a dedicated worktree.** Every invocation creates its own git worktree
  off `origin/main` (see step 2). This keeps the main clone's working tree untouched and
  lets multiple agents run different tickets in parallel without colliding — a single
  clone has only one working tree and one HEAD, so two agents sharing it would clobber
  each other's files regardless of branch.
- **Finish with the PR open.** This skill ends at "work done, committed, pushed, and PR
  opened via `gh pr create`". Only open the PR once the checks in step 4 pass — never
  push failing work.
- **One ticket → one branch → one worktree → one PR.** Don't bundle unrelated work.
- **Read before you write.** Read the ticket, the relevant `docs/`, `CONTEXT.md`, and the
  per-app `AGENTS.md` for whatever app you're touching before editing code.

</operating-principles>

<steps>

## 1. Read the ticket

- Resolve the ID via the Linear MCP. Prefer `mcp__linear__get_issue` with the ID
  (e.g. `GLA-10`). Pull the title, description, acceptance criteria, size, labels, and
  any comments that change scope.
- If the ID doesn't resolve, stop and tell the user — don't invent scope.

## 2. Create a worktree off an up-to-date main

- Pick a branch name with the conventional prefix from CONTRIBUTING.md (`feat/`, `fix/`,
  `chore/`, `docs/`) derived from the ticket kind, including the lowercased ID and a short
  slug — e.g. `feat/gla-10-subset-billing-cycle`.
- Fetch, then create the worktree and branch in one step, branching directly off the fresh
  remote ref — **do not** `git switch main` first (a single clone can only have `main`
  checked out in one worktree, so that step fails the moment a second agent runs it):

  ```bash
  git fetch origin
  git worktree add ../glassroom-gla-10 -b feat/gla-10-subset-billing-cycle origin/main
  cd ../glassroom-gla-10
  ```

  Name the worktree directory as a sibling of the repo, keyed to the ticket (e.g.
  `../glassroom-gla-10`). Do all subsequent work from inside that directory.
- The worktree shares the repo's `.git` object store, so `fetch`/`commit` across parallel
  worktrees is concurrency-safe — but each app has its **own `node_modules`** (no
  workspace tooling), and a fresh worktree starts with none. You'll install them in step 4
  before running checks.

## 3. Summarize the ticket and your intended approach

Before writing code, post a short summary to the user covering:

- **What the ticket is** — 1–2 sentences restating the problem/goal in your own words,
  plus the acceptance criteria.
- **What you're going to do** — your intended approach at a high level, and which app(s)
  (`apps/web`, `apps/marketing`, `apps/server`) and layers you expect to touch.

## 4. Think, plan, execute

- Think through the approach and form a concrete plan (use TODOs to track multi-step work).
- Read the relevant `docs/`, `CONTEXT.md`, and target app's `AGENTS.md` for conventions.
- Implement the change. Keep it scoped to this ticket.
- Update affected docs (`docs/`, per-app `docs/`, `README.md`) as part of the change.
- Run the checks for **each app you touched** before declaring done (per CONTRIBUTING.md
  "Before opening a PR"). A fresh worktree has no `node_modules`, so install per touched
  app first, then run its checks:
  - Web/marketing: `npm install --prefix apps/web` then `npm run typecheck --prefix apps/web`
    (or `apps/marketing`).
  - Server: `npm install --prefix apps/server` then `npm run typecheck --prefix apps/server`
    and `npm run test --prefix apps/server`.

## 5. Commit, push, and open the PR

Once the checks in step 4 pass, commit the work on the ticket branch (a conventional
commit message referencing the ticket ID), push the branch to `origin`, and open the PR
with `gh pr create` against `main`.

Write the PR title and body by the **Pull requests** section of the repo's
`CONTRIBUTING.md`. Read it fresh every time and follow it exactly, including its hard
length limits. Do not work from memory of an older version.

For a UI PR, take the screenshots with the Chrome tools and save the files locally.

After opening the PR, report back with the PR URL and a short recap of what was done.
Tell the user which worktree the work lives in (e.g. `../glassroom-gla-10`), and that once
the PR is merged they can clean it up with `git worktree remove ../glassroom-gla-10`.

</steps>
