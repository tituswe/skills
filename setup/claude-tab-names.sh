#!/usr/bin/env bash
# Names each tmux tab (window) after the title of the main Claude Code session in it.
# Run by tmux from status-right every status-interval; prints nothing.
# Main session = the live Claude session in the window's lowest-numbered pane
# (teammates split off the lead, so the lead keeps the first pane).
# A tab the user renamed by hand is left alone; a tab whose Claude exits
# goes back to tmux's automatic naming. Works with macOS's bash 3.2.

dir="$HOME/.claude/sessions"
[ -d "$dir" ] || exit 0

# One line per live session: <window_id> <pane_index> <title>, then keep the lowest pane per window.
mains="$(
  for f in "$dir"/*.json; do
    [ -e "$f" ] || continue
    pid="${f##*/}"; pid="${pid%.json}"
    kill -0 "$pid" 2>/dev/null || continue
    json="$(cat "$f")"
    pane="$(printf '%s' "$json" | sed -nE 's/.*"tmux":"[^"]*\.(%[0-9]+)".*/\1/p')"
    [ -n "$pane" ] || continue
    # Window, pane index and Claude's title for the session, minus its leading status glyph (✳, spinner).
    loc="$(tmux display -p -t "$pane" '#{window_id}	#{pane_index}	#{pane_title}' 2>/dev/null)" || continue
    loc="$(printf '%s' "$loc" | LC_ALL=C sed -E 's/	[^	A-Za-z0-9]+ +([^	]*)$/	\1/')"
    [ -n "$loc" ] && printf '%s\n' "$loc"
  done | sort -t "$(printf '\t')" -k1,1 -k2,2n | awk -F '\t' '!seen[$1]++ { print $1 "\t" $3 }'
)"

tmux list-windows -a -F '#{window_id}	#{window_name}	#{@claude_name}' 2>/dev/null |
while IFS="$(printf '\t')" read -r win cur ours; do
  want="$(printf '%s\n' "$mains" | awk -F '\t' -v w="$win" '$1 == w { print $2; exit }')"
  # Renamed by hand since we last named it: leave it alone.
  if [ -n "$ours" ] && [ "$cur" != "$ours" ]; then continue; fi
  if [ -n "$want" ]; then
    if [ "$cur" != "$want" ] || [ "$ours" != "$want" ]; then
      tmux rename-window -t "$win" "$want" \; set -w -t "$win" @claude_name "$want"
    fi
  elif [ -n "$ours" ]; then
    tmux set -w -t "$win" -u @claude_name \; set -w -t "$win" automatic-rename on
  fi
done
exit 0
