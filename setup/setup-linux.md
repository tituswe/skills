# Linux

The Linux branch of [`/setup`](SKILL.md), covering native Linux and WSL. The step numbers there decide the order; this file fills in the Linux parts.

Detect WSL with `grep -qi microsoft /proc/version`. Several sections split on it.

## Values

| | WSL | Native, Wayland (`$WAYLAND_DISPLAY` set) | Native, X11 (`$DISPLAY` set) | Headless / SSH |
|---|---|---|---|---|
| Clipboard command | `clip.exe` | `wl-copy` | `xclip -selection clipboard` | empty string (OSC 52 only) |
| Extra package | none | `wl-clipboard` | `xclip` | none |

Shell rc file: `~/.bashrc` (if `$SHELL` is zsh, `~/.zshrc`).

## Install

Use the distro's package manager: `apt` (Debian/Ubuntu), `dnf` (Fedora), `pacman` (Arch). Install `tmux`, `git`, `curl`, and the extra package above. `sudo` will usually need a password, so hand it over: `! sudo apt update && sudo apt install -y tmux git curl`.

Claude Code, if `claude` is missing: `curl -fsSL https://claude.ai/install.sh | bash`, then make sure `~/.local/bin` is on `PATH`.

tmux must be 3.2 or later (for the `terminal-features` and `copy-command` options). Ubuntu 22.04+ and current Fedora/Arch ship that.

## Terminal

### WSL: Windows Terminal

Windows Terminal grabs some Alt keys before tmux sees them: `alt+shift+d` (duplicate pane) and `alt+arrows` (move pane focus).

1. Find the settings file. Windows user: `cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r'`. Path: `/mnt/c/Users/<user>/AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json` (Preview: `Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe`; unpackaged: `/mnt/c/Users/<user>/AppData/Local/Microsoft/Windows Terminal/settings.json`).
2. Back it up. In its `keybindings` array (older files call it `actions`), remove entries whose `keys` is one of `alt+shift+d`, `alt+left`, `alt+right`, `alt+up`, `alt+down`, then add `{"id": null, "keys": "<key>"}` for each of the five. A `null` id unbinds the default.
3. The file may be JSONC (comments, trailing commas). If `python3 -I -c 'import json,sys; json.load(open(sys.argv[1], encoding="utf-8-sig"))' <file>` fails, edit the array by hand rather than rewriting the file.

Windows Terminal reloads the file on save. Done when all five unbinds are in the file and it still loads (no error banner when the user opens a new tab).

### Native Linux

Read the terminal from `$TERM_PROGRAM` or ask. Known grabs:

- **GNOME Terminal / Ptyxis**: Alt+1..9 switch its own tabs, and menu mnemonics take Alt+letters. Hand over: Preferences → Shortcuts → disable "Switch to Tab 1..9"; Preferences → General → untick "Enable mnemonics".
- **Konsole**: Alt+1..9 switch tabs. Hand over: Settings → Configure Keyboard Shortcuts → clear "Activate Tab 1..9".
- Others (Alacritty, kitty, WezTerm, foot): no default Alt grabs for these keys.

Done when the terminal is named and each grab above is cleared or handed over.
