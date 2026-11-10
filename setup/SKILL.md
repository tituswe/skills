---
name: setup
description: Set up a new machine with tmux, Alt shortcuts, Claude Code settings and this skills repo. Linux (incl. WSL) or macOS.
disable-model-invocation: true
---

# Setup

Brings a machine to the standard dev setup: tmux with Alt shortcuts, mouse copy and tabs named after their Claude session, tmux auto-start, Claude Code with agent teams, and the skills repo in `~/.claude/skills`.

Every step is **idempotent**: check first, change only what differs, and report a step that already matches as `already done`. Back up any file before changing it (`<file>.bak-<YYYYMMDD>`).

When a command needs a password or a GUI (`sudo`, an installer, a terminal's preferences window), hand it to the user: give the exact command as `! <command>`, or the exact menu path, and wait for them to confirm.

## Steps

1. **Pick the OS file.** An argument (`linux`, `mac-os`) wins. Else run `uname -s`: `Darwin` → [`setup-mac-os.md`](setup-mac-os.md), `Linux` → [`setup-linux.md`](setup-linux.md). Anything else: stop and say it is unsupported. Read the whole OS file now. Done when you know the OS file, the clipboard command, the shell rc file and the terminal app.
2. **Install packages** per the OS file's *Install* section. Done when `tmux -V` (3.2 or later), `git --version` and `claude --version` all succeed.
3. **tmux config.** Copy [`tmux.conf`](tmux.conf) to `~/.tmux.conf`, replacing `@CLIPBOARD@` with the OS file's clipboard command. Carry any line from the old file that the template does not cover into its *Machine-specific* section. Copy [`claude-tab-names.sh`](claude-tab-names.sh) to `~/.config/tmux/claude-tab-names.sh` and make it executable: tmux runs it to name each tab after the Claude session in it. Apply the OS file's *tmux* section, if it has one. Done when `tmux -L setup-check -f ~/.tmux.conf new-session -d \; kill-server` exits 0, and, inside tmux, `tmux source-file ~/.tmux.conf` exits 0 and running the script exits 0.
4. **Shell start-up.** Append this block to the OS file's shell rc file, once (skip if `# setup: tmux autostart` is already there):

   ```sh
   # setup: tmux autostart
   # Start in ~/dev when a shell opens in the home directory
   mkdir -p "$HOME/dev"
   if [[ $- == *i* ]] && [[ "$PWD" == "$HOME" ]]; then
     cd "$HOME/dev"
   fi
   # Attach to session "main" or create it (skip if already in tmux or in VS Code's terminal)
   if command -v tmux >/dev/null 2>&1 && [[ $- == *i* ]] && [[ -z "$TMUX" ]] && [[ "$TERM_PROGRAM" != "vscode" ]]; then
     tmux new-session -A -s main
   fi
   ```

   Done when the block appears exactly once and `bash -n` (or `zsh -n`) on the rc file passes.
5. **Terminal keys** per the OS file's *Terminal* section. The terminal must pass Alt (Option) keys through to tmux and must not bind them itself. Done when every conflicting binding is removed or handed to the user as a manual step.
6. **Claude Code settings.** Deep-merge [`claude-settings.json`](claude-settings.json) into `~/.claude/settings.json`: its keys win, every other key already in the file stays. Done when `~/.claude/settings.json` parses as JSON and contains every key from `claude-settings.json` with the same value.
7. **Skills repo.** Install `https://github.com/tituswe/skills.git` into `~/.claude/skills`:
   - Already a git repo with that origin: `git -C ~/.claude/skills pull --ff-only`.
   - Missing or empty: `git clone https://github.com/tituswe/skills.git ~/.claude/skills`.
   - Has other files (synced or third-party skills): `git init -b main`, `git remote add origin <url>`, `git fetch origin`, `git checkout -t origin/main` inside it. Leave the existing files in place; if a tracked path collides with one, stop and ask.

   Done when `git -C ~/.claude/skills status` shows branch `main` tracking `origin/main`, and `setup/SKILL.md` exists there.
8. **Report.** One line per step: `done`, `already done`, or `manual: <what the user must do>`. Then this check list for the user to try in a new terminal window:

   | Keys | Expect |
   |---|---|
   | Alt+D / Alt+Shift+D | split right / split down |
   | Alt+T, then Alt+1 | new tab, back to tab 1 |
   | Alt+arrows | move between panes; Left/Right at the edge changes tab |
   | Alt+W | closes the pane |
   | Start `claude` in a new tab | within ~5 s the tab takes the session's name |
   | Click a pane or tab | selects it |
   | Drag over text, paste elsewhere | text was copied |

   Done when every step has a status and the check list is shown.
