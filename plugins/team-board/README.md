# team-board

A Claude Code panel beside the chat that shows your agent team at a glance: what each teammate is doing right now, its PR, CI, and the `pr-review` merge gate. Teammates waiting on you are pinned to the top.

```
 ! 1 needs you

 ! abc-497   ready to merge
   #392 ready to merge
   #392 open · CI ✓ · gate ✓
 ● abc-479   fixing
   running: Run the server tests · 1m 23s
   #391 open · CI ✓ · gate ✗ 0 blockers, 1 important open
 ○ abc-498   awaiting review
   idle · waiting on lead
   #393 open · CI … · gate –
 lead  2 agents running
   thinking…

 ───────────────────────────────────────────────
 Your usage
 On track. You should reach Saturday's reset with room to spare.

 Current session                       56% used
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Resets at 8:10 PM

 This week                             40% used
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Resets Saturday 12:00 PM
```

## What it shows

- **Teammates**, in groups: waiting on you, working, idle, done. Alphabetical within a group.
- **What each is doing now**: `thinking…`, `writing a reply…`, `editing booking.ts`, `running: … · 1m 23s`, `waiting for approval: Bash`, `idle · waiting on lead`.
- **Its PR**, the one its spawn description names (`Look after PR 401`), else matched by the ticket ID in the teammate's name (`abc-479` → a branch or title holding `ABC-479`): CI, merge conflicts and the `pr-review` gate, refreshed every 30 s and right after any `gh pr` or `git push`.
- **Its phase**, from the PR: `coding`, `merge conflicts`, `awaiting review`, `in review`, `fixing`, `CI running`, `CI failing`, `ready to merge`, `merged`. A PR with merge conflicts is never ready to merge, and a teammate still working is never shown as waiting on you to merge.
- **Waiting on you**: a real approval dialog, a question (`AskUserQuestion`), a PR ready to merge, or the lead's turn ending on a question.
- **The lead**: its own activity and the subagents it runs (review pillars).
- **Your usage**, at the foot: the current session (5-hour) and this week's (7-day) limits as claude.ai's usage page shows them, each with its bar and reset time, and whether this week's pace reaches the reset. While the panel is open it asks your account every 60 s, and up to every 15 s while a session is working, so it counts usage from every terminal, claude.ai and the apps. The request goes through Claude Code's own sign-in: the panel never sees your token. That account endpoint is undocumented; if it fails, the panel says so and shows this session's own figures, which update after each reply. Claude subscriptions only.

Teammates must run in-process (`"teammateMode": "in-process"` in `~/.claude/settings.json`). A teammate in a tmux pane of its own shows only working or idle.

## Use

- `/team` opens or closes the panel. It also opens by itself when the first teammate appears.
- `/team repo <path>` sets the repo PRs come from (default: the session's folder).
- Focus it from the keyboard with `ctrl+x tab` (or bind `abovePrompt:focus`, e.g. to `alt+e`). `Tab` walks the names, `Enter` opens that teammate's conversation, `Esc` returns to the prompt.

## Install

At the prompt of a terminal session:

```
/plugin install team-board --marketplace tituswe/skills
```

From a shell:

```
claude plugin install team-board --marketplace tituswe/skills
```

Needs the GitHub CLI (`gh`) signed in for the PR lines.

## Develop

`claude plugin test plugins/team-board` runs the tests; `claude --plugin-dir plugins/team-board` runs a session with the working copy loaded.
