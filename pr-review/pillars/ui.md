# UI

Can every user see, reach and understand this screen, in every state? Run the app and look: reading the code is not enough. WCAG 2.2 AA is the bar.

## Run it

1. Open a worktree at the PR head, then install dependencies and copy gitignored env files (`.env`, `.env.local`) from the same paths in `$root`:
   ```bash
   root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
   git -C "$root" worktree add "$root/.claude/worktrees/pr-<n>-ui" --detach <sha>
   ```
2. Start the backend and the frontend the way the repo's docs say, on free ports. Point the frontend at that backend, and allow the frontend's origin in the backend's CORS setting. Use a fresh local database with seed data, never the main checkout's.
3. Load the Chrome skill and sign in with the dev account the repo's docs or seed files name.

If the app won't start, say why in your return and review the code alone. Done when you are signed in on a changed screen.

## Test it

Walk every screen and flow the diff touches. On each:

- The happy path, then the loading, empty and error states. Force errors with bad input or by stopping your backend.
- Keyboard only: every control is reachable and operable, with no traps and a visible focus ring.
- Phone widths, 375 and 320 px. Chrome windows stop near 500 px, so load the page in an iframe of that width from a scratch HTML file in the app's public folder.
- The console: no errors or failed requests.

## Checklist

- Native elements first. Every control has an accessible name and label.
- Contrast is at least 4.5:1 for text and 3:1 for controls. Targets are at least 24×24 px.
- No sideways scroll at 320 px.
- Loading, empty and error states all exist. Empty says why and what to do next. Loading never shows the empty state.
- Errors say what went wrong and how to fix it. Async results are announced to screen readers.
- It uses the design system's components, tokens and copy style.

## Screenshots

Every UI finding carries a screenshot of the failure. Mark the problem first: outline the element with a script (`el.style.outline = "3px solid red"`), or zoom to it. Capture with `save_to_disk`, copy the file outside the repo, and put its path on the finding's `Screenshot:` line. Screenshot seed data only.

## Clean up

Stop the servers, then remove the worktree: `git -C "$root" worktree remove --force "$root/.claude/worktrees/pr-<n>-ui"`. Done when both are gone.
