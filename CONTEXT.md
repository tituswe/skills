# Skills

Personal Claude Code skills for turning project ideas into solid, agent-ready foundations — and keeping them honest as the work evolves.

## Language

**Skill**:
A self-contained slash-command instruction set for Claude Code, living in its own subdirectory with a SKILL.md.

**Foundation**:
The core doc set a project needs to be agent-ready: CONTEXT.md, PRD, ARCHITECTURE, AGENTS.md, and ADRs.
_Avoid_: Docs, documentation set

**Catchup**:
Bringing a stale local repo up to date with the remote's main branch: fetch, fast-forward main, prune remote-tracking refs, and delete merged local branches.
_Avoid_: Sync, pull

**Merged branch**:
A local branch whose pull request has been merged into main in any style (merge commit, squash, or rebase), as reported by the GitHub CLI — with git ancestry as the fallback definition when gh is unavailable.
_Avoid_: Defining merged as `git branch --merged` ancestry only — it misses squash merges.

**In-flight branch**:
A local branch carrying commits not yet merged into main. Catchup never deletes, rebases, or otherwise touches these — it only reports them.
_Avoid_: Stale branch, WIP branch
