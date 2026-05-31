# skills

Personal [Claude Code](https://claude.com/claude-code) skills for turning project ideas into solid, agent-ready foundations — and keeping them honest as the work evolves.

These live in `~/.claude/skills/` and are invoked as slash commands (e.g. `/genesis`).

## Skills

| Skill | What it does |
|-------|--------------|
| **[genesis](./genesis)** | Golden-standard setup for a **new (greenfield)** project — stress-test the plan through a relentless one-question-at-a-time interview, sharpen domain language into a glossary, record hard decisions as ADRs, research & harden, and produce the foundational doc set (CONTEXT.md, PRD, ARCHITECTURE, AGENTS.md) plus an initialized git repo. |
| **[exodus](./exodus)** | The **brownfield** sibling of genesis — reverse-engineer an **existing** codebase from its code, git history, and docs; grill the user to resolve every uncertainty; separate reality from intent; recover implicit decisions as ADRs; and reconcile (not clobber) the same foundational doc set without disturbing the working tree. |
| **[grill](./grill)** | A focused grilling session that stress-tests a plan against the project's existing domain model and documented decisions, sharpening terminology and updating CONTEXT.md / ADRs inline as decisions crystallise. |

## Shared doc formats

genesis defines the output-format guides (`CONTEXT-FORMAT.md`, `PRD-FORMAT.md`, `ARCHITECTURE-FORMAT.md`, `AGENTS-FORMAT.md`, `ADR-FORMAT.md`, `BUILD-PLAN-FORMAT.md`). exodus references them so the two skills produce a consistent doc set.

## Install

Clone into your Claude Code skills directory:

```sh
git clone https://github.com/tituswe/skills.git ~/.claude/skills
```

Each subdirectory is a self-contained skill; Claude Code discovers them automatically.
