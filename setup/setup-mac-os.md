# macOS

The macOS branch of [`/setup`](SKILL.md). The step numbers there decide the order; this file fills in the macOS parts.

## Values

- Clipboard command: `pbcopy`
- Shell rc file: `~/.zshrc` (zsh is the default shell; if `$SHELL` is bash, `~/.bash_profile`)
- Alt is the **Option** key, and the terminal must be told to send it as Meta (see *Terminal*).

## Install

1. **Homebrew**, if `brew` is missing. Its installer asks for a password, so hand it over: `! /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`. Then add its shellenv line to `~/.zprofile` as the installer prints (`/opt/homebrew` on Apple silicon, `/usr/local` on Intel).
2. `brew install tmux git`.
3. Claude Code, if `claude` is missing: `curl -fsSL https://claude.ai/install.sh | bash`, then make sure `~/.local/bin` is on `PATH`.

## tmux

The macOS system ncurses can lack the `tmux-256color` terminfo, which breaks `less`, `vim` and others inside tmux ("unknown terminal"). Check with `infocmp tmux-256color`. If it fails, either install the entry (`brew install ncurses`, then `$(brew --prefix ncurses)/bin/infocmp -x tmux-256color > /tmp/t.src && tic -x /tmp/t.src`) or set `default-terminal` to `screen-256color` in the *Machine-specific* section. Done when `infocmp` succeeds for whatever `default-terminal` is.

## Terminal

Read the terminal from `$TERM_PROGRAM` (`Apple_Terminal`, `iTerm.app`, `ghostty`, `WezTerm`) or ask. Each needs Option sent as Meta, and Option+arrows sent as plain Alt+arrows (many presets remap them to word jumps).

- **Terminal.app**: hand over: Settings → Profiles → (default profile) → Keyboard → tick "Use Option as Meta key", and in the key list delete any ⌥← / ⌥→ entries. Its plist is overwritten while Terminal runs, so do not edit it from the shell.
- **iTerm2**: hand over: Settings → Profiles → Keys → General → Left Option key: `Esc+` (Right Option too, if they want it). Then Key Mappings: delete ⌥← / ⌥→ entries, or pick Presets → "Terminal.app Compatibility" only if they had none.
- **Ghostty**: add `macos-option-as-alt = true` to `~/.config/ghostty/config`.
- **WezTerm**: in `~/.wezterm.lua` set `config.send_composed_key_when_left_alt_is_pressed = false` and the same for right.
- **Alacritty**: in `alacritty.toml` under `[window]` set `option_as_alt = "Both"`.

Check: in a new window of that terminal, run `cat -v` and press Option+D then Option+Left. Expect `^[d` and `^[[1;3D`. `∂` means Option is not Meta yet; `^[b` means Option+Left is still remapped. Done when the user confirms both outputs.

Cmd-based shortcuts (Cmd+D etc.) are the terminal's own and are left alone; the tmux shortcuts are Option-based on purpose so they match Linux.
