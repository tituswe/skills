# skills

Personal [Claude Code](https://claude.com/claude-code) skills.

These live in `~/.claude/skills/` and run as slash commands (e.g. `/pr`).

## Skills

| Skill | What it does |
|-------|--------------|
| **[ticket](./ticket)** | Writes short tickets that fit on one screen and files them in any tracker (Linear by default). |
| **[pr](./pr)** | Writes PR bodies that are fast to review. Copy of [Matt Pocock's `pr`](https://github.com/mattpocock/skills/tree/main/skills/engineering/pr) (MIT), plus one line on annotating screenshots. |
| **[writing-for-agents](./writing-for-agents)** | Guides writing docs an agent reads: skills, `AGENTS.md`, `CLAUDE.md`. Copy of [Matt Pocock's `writing-for-agents`](https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-for-agents) (MIT). |

## Install

Clone into your Claude Code skills directory:

```sh
git clone https://github.com/tituswe/skills.git ~/.claude/skills
```

Each subdirectory is a self-contained skill. Claude Code finds them on its own.

Third-party skills (like Railway's `use-railway`) and claude.ai synced skills also land in this folder. They are gitignored.
