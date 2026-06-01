---
name: catchup
description: Bring a stale local repo up to date with the remote's main branch — fetch, fast-forward, prune remote-tracking refs, and delete local branches whose PRs have merged — then report the git facts. Use when returning to a repo after work was merged remotely (other machines, web sessions, merged agent PRs) and the local clone has fallen behind.
---

<what-to-do>

Bring this local repo up to date with the remote's main branch, clean up local branches whose work has already landed, and report the git facts. Plain facts, no summarization.

</what-to-do>

<operating-principles>

- **Never lose work.** Catchup never forces, rebases, stashes, or discards anything. In-flight branches (branches with unmerged commits) and dirty working trees are never touched — only reported.
- **Do the safe parts, report the rest.** When something blocks part of the sync (diverged main, dirty tree), skip that part, do everything else, and state exactly what was skipped and why.
- **Merged means the PR merged.** A branch is merged if GitHub says its PR merged — in any style (merge commit, squash, rebase). Do NOT use `git branch --merged` as the primary check: it misses squash merges, which most repos use. Use it only as the fallback when `gh` or a GitHub remote is unavailable.

</operating-principles>

<steps>

## 1. Establish the lay of the land

- Confirm a remote exists (default `origin`). If none, stop — nothing to catch up with.
- Detect the default branch from the remote (don't assume `main`).
- Note the current branch and whether the working tree is dirty.

## 2. Fetch and prune

`git fetch origin --prune` — updates remote-tracking refs, removes dead ones. Always safe.

## 3. Fast-forward the default branch

- On the default branch with a clean tree: `git pull --ff-only origin <default>`
- On any other branch: `git fetch origin <default>:<default>`
- Diverged (local commits not on remote) or blocked by a dirty tree: skip, and report exactly why.

## 4. Delete merged local branches

- With `gh`: a branch whose PR is merged is deletable (`gh pr list --state merged --json headRefName,number`).
- Without `gh`: fall back to `git branch --merged <default>`, and note in the report that squash-merged branches can't be detected this way.
- Delete with `git branch -D` only after merge status is confirmed.
- Never delete: the default branch, the current branch, or any in-flight branch.

## 5. Report the git facts

```
Caught up.
- main: 14 commits pulled (abc123..def456)
- Pruned: 2 remote-tracking refs
- Deleted: feat/webhooks (#42), fix/dst (#47) — PRs merged
- Kept: feat/reports — 3 unmerged commits, now 12 behind main
- Skipped: fast-forward of main — 2 local commits not on origin
```

</steps>
