# skills

Personal [Claude Code](https://claude.com/claude-code) skills.

These live in `~/.claude/skills/` and run as slash commands (e.g. `/ticket`).

## Skills

| Skill | What it does |
|-------|--------------|
| **[grill](./grill)** | Stress-tests a plan against the project's domain model and past decisions. Sharpens terms and updates CONTEXT.md and ADRs as decisions land. |
| **[work](./work)** | Takes a Linear ticket from backlog to open PR: reads it, opens a worktree in `.claude/worktrees/`, plans, builds, tests, then commits, pushes and opens the PR. |
| **[ticket](./ticket)** | Writes or splits Linear tickets so each one is a single small PR. Hard limits keep tickets short. |

## Install

Clone into your Claude Code skills directory:

```sh
git clone https://github.com/tituswe/skills.git ~/.claude/skills
```

Each subdirectory is a self-contained skill. Claude Code finds them on its own.

Third-party skills (like Railway's `use-railway`) and claude.ai synced skills also land in this folder. They are gitignored.
