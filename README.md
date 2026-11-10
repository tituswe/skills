# skills

Personal [Claude Code](https://claude.com/claude-code) skills.

These live in `~/.claude/skills/` and run as slash commands (e.g. `/pr`).

## Skills

| Skill | What it does |
|-------|--------------|
| **[setup-dev-env](./setup-dev-env)** | Sets up a new machine (Linux, WSL or macOS): tmux with Alt shortcuts, Claude Code settings with agent teams, and this repo. |
| **[project](./project)** | Runs a project as team lead: grills the plan, files tickets, then spawns teammates that code, open PRs and fix review findings until each ticket merges. |
| **[code](./code)** | Codes a ticket or task in a new worktree: plan, build, prove, commit. Stops before the PR. |
| **[pr-review](./pr-review)** | Reviews a PR with parallel pillar reviewers (code, security, tests, maintainability, UI, data), verifies each finding, then posts it as an inline comment labelled with its pillar. |
| **[ticket](./ticket)** | Turns a spec or description into short tickets, sliced into one-PR pieces, and files them in any tracker (Linear by default). |
| **[pr](./pr)** | Writes PR bodies that are fast to review. Copy of [Matt Pocock's `pr`](https://github.com/mattpocock/skills/tree/main/skills/engineering/pr) (MIT), plus one line on annotating screenshots. |
| **[grill-with-docs](./grill-with-docs)** | Grills you on a plan or design and writes its glossary and ADRs as you go, by running `grilling` and `domain-modeling`. Copy of [Matt Pocock's `grill-with-docs`](https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs) (MIT). |
| **[grilling](./grilling)** | Interviews you in numbered rounds, with a recommended answer for each question, until every decision in the plan is settled. Copy of [Matt Pocock's `grilling`](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling) (MIT). |
| **[domain-modeling](./domain-modeling)** | Challenges fuzzy terms against `GLOSSARY.md`, updates it as terms settle, and offers ADRs for hard-to-reverse decisions. Copy of [Matt Pocock's `domain-modeling`](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling) (MIT). |
| **[writing-for-agents](./writing-for-agents)** | Guides writing docs an agent reads: skills, `AGENTS.md`, `CLAUDE.md`. Copy of [Matt Pocock's `writing-for-agents`](https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-for-agents) (MIT). |

## Install

Clone into your Claude Code skills directory:

```sh
git clone https://github.com/tituswe/skills.git ~/.claude/skills
```

Each subdirectory is a self-contained skill. Claude Code finds them on its own.

Third-party skills (like Railway's `use-railway`) and claude.ai synced skills also land in this folder. They are gitignored.
