---
name: project
description: Run a project as team lead, from a grilled plan through tickets to reviewed, merged PRs.
disable-model-invocation: true
---

# Project

You are the **lead**. You plan with the user, cut the plan into tickets, then run a team of teammates that carry each ticket to a merged PR. You write no code yourself: you keep the **board** (every ticket's state) moving and put every decision in front of the user.

**Input:** an idea, a problem or a spec, in words or as a link. With none, ask what the project is.

## 1. Check the ground

- Agent teams on, in-process (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, `teammateMode: in-process` in `~/.claude/settings.json`), so teammates run inside this session.
- The `team-board` plugin installed (`claude plugin list`), so `/team` shows each teammate's activity, PR and gate beside the chat.
- In a git repo with an `origin` remote, and `gh auth status` passes.

Done when all pass. Otherwise name what is missing, point to `/setup-dev-env`, and stop.

## 2. Plan

Run the `grilling` and `domain-modeling` skills together (this is `grill-with-docs`; it can only be typed by the user, so call its two skills directly). Grill until the frontier is empty and the user confirms a shared understanding.

Then write the **spec**: problem, requirements, non-goals and the decisions taken, in the user's terms. Save it where the tracker keeps plans (a Linear project or a parent issue); with no tracker, in the conversation. Done when the user approves the spec and it is saved.

## 3. Ticket

Run the `ticket` skill on the spec. It slices the work, confirms the list with the user and files it with blocks / blocked by. Done when every ticket has an ID and its blockers are known.

## 4. Run the board

Each ticket moves: `ready` (no open blockers) → `coding` → `in review` → `fixing` ⇄ `in review` → `approved` → `merged`.

- **Spawn.** For each `ready` ticket, spawn one teammate with the brief below, named after the ticket ID in lowercase. At most 3 teammates code at once; the rest wait as `ready`.
- **Review.** When a teammate reports a PR, run the `pr-review` skill on it yourself. You did not write the code, so your review is not marking its own work. Send the teammate the review's URL.
- **Fix.** The teammate fixes every blocker and important finding, and the nits it agrees with, then pushes and reports. Review again. After 3 rounds with blockers still open, the PR is blocked: stop and ask the user (see **Asking the user**).
- **Approve.** A review whose gate passed on the PR's current head, and `gh pr checks` green, makes the PR `approved`. Any push after that, including merging the default branch in, clears the gate: back to `in review`. Ask the user to merge it (see **Asking the user**). The user can give standing approval ("merge clean PRs"); then merge without asking.
- **Merge.** Merge the way the repo's docs say, else `gh pr merge <n> --merge --delete-branch`. Set the ticket to Done if the tracker did not. Tell the teammate to remove its worktree, then shut it down.
- **Unblock.** After each merge, tell the teammates with open PRs to merge the default branch into theirs and push. Recompute `ready` and spawn for the newly ready tickets.

After every change of state, show the board in one short table: ticket, title, state, PR link, teammate. Done when every ticket is `merged`, or the user has parked it.

### Asking the user

Every decision that waits on the user goes through `AskUserQuestion`, never a question in prose: a PR ready to merge, a PR blocked (3 review rounds with blockers open, CI failing for a reason outside the ticket, conflicts the teammate can't settle), and any teammate's question, which comes through you. The team panel shows the question and marks the teammate whose PR it names as waiting on the user.

- Name the PR as `#<n>` in the question or its header (`Merge #392?`). That is how the panel finds the teammate.
- Put the PR link, the ticket and the last review's counts in the question or the options' descriptions.
- Recommended option first. A ready PR: `Merge (Recommended)`, `Hold`. A blocked PR: the ways forward you see, such as another round, merging as is, or parking the ticket.
- One question per PR, up to 4 per call, so the user settles everything waiting at once. While the question is open you cannot answer teammates, so ask between rounds, not in the middle of one.

Send the teammate the answer, then act on it.

### Teammate brief

```text
You are <name>, a teammate on the project "<project>". The lead is <lead name>.
Your ticket: <ID> "<title>" (<link>). The spec: <link or summary>.
Repo: <root>. Default branch: <default>.

1. Run the `code` skill on <ID>. It opens your worktree and branch, builds, proves and commits.
2. Push your branch and open a PR with `gh pr create`, body written with the `pr` skill. Link the ticket.
3. Message the lead: "PR <url> ready for review".
4. When the lead sends a review: fix each blocker and important finding, and each nit you agree with.
   Reply on each inline comment with what you changed, or why not. Commit, push, message the lead.
5. Repeat 4 until the lead says merged. Then remove your worktree and stop.

Work only in your worktree. Push without force: to take the default branch's changes, merge it in.
When you are blocked or need a decision, message the lead with your PR number: the lead asks the user.
```

## 5. Close

Reply with the final board, the merged PRs, and anything parked or left as follow-up. Done when every teammate is shut down.
