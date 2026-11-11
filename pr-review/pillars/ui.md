# UI

Does every screen this change reaches still work, and can every user see, reach and understand it, in every state? A backend change reaches screens too: they show its data and send its requests. Run the app and look: reading the code is not enough. WCAG 2.2 AA is the bar.

## Find the screens

List the flows to walk, each one a screen plus what the user does there:

- **Frontend changes:** the changed screens and every flow through them.
- **Backend changes:** trace each changed route, service, job or migration to the screens that use it. Grep the frontend's API client for the route paths, then find the pages that make those calls. A job or webhook with no screen of its own is walked through the screen that shows its result. Add the neighbouring flows that share the changed code, since that is where regressions hide.

When no screen reaches the change, say so in your click-through log, with the searches that proved it, and skip running the app. Done when every changed file maps to a flow, or to a search showing it has none.

## Run it

1. Open a worktree at the PR head, then install dependencies and copy gitignored env files (`.env`, `.env.local`) from the same paths in `$root`:
   ```bash
   root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
   git -C "$root" worktree add "$root/.claude/worktrees/pr-<n>-ui" --detach <sha>
   ```
2. Start the backend and the frontend the way the repo's docs say, on free ports. Point the frontend at that backend, and allow the frontend's origin in the backend's CORS setting. Use a fresh local database with seed data, never the main checkout's. A PR with a migration: build the database at the base commit, create data through the UI there, then boot the PR head on it so the migration runs on that data.
3. Load the Chrome skill and sign in with the dev account the repo's docs or seed files name.

If the app won't start, say why in your return and review the code alone. Done when you are signed in on the first flow's screen.

## Test it

Walk every flow from **Find the screens**:

- The happy path, then each state the change affects: loading, empty and error. Force errors with bad input or by stopping your backend.
- The result: the numbers, lists and messages the screen shows after the action. Where the screen can't show the whole outcome (a row written, a seat cancelled), check the database or the API too.
- The console: no errors or failed requests.

On screens whose frontend code changed, also:

- Keyboard only: every control is reachable and operable, with no traps and a visible focus ring.
- Phone widths, 375 and 320 px. Chrome windows stop near 500 px, so load the page in an iframe of that width from a scratch HTML file in the app's public folder.
- The checklist below.

Done when every flow has a pass or fail and a screenshot.

## Checklist

- Native elements first. Every control has an accessible name and label.
- Contrast is at least 4.5:1 for text and 3:1 for controls. Targets are at least 24×24 px.
- No sideways scroll at 320 px.
- Loading, empty and error states all exist. Empty says why and what to do next. Loading never shows the empty state.
- Errors say what went wrong and how to fix it. Async results are announced to screen readers.
- It uses the design system's components, tokens and copy style.

## Screenshots

Every flow gets one screenshot of its end state, pass or fail: it is the evidence the flow was walked. Every UI finding also carries a screenshot of the failure. Mark the problem first: outline the element with a script (`el.style.outline = "3px solid red"`), or zoom to it. Capture with `save_to_disk`, and copy each file outside the repo. Screenshot seed data only.

## Return

Your findings, in the FINDINGS.md format, each with its `Screenshot:` line. Then the click-through log, one line per flow:

```markdown
Click-through:
- <flow> · pass | fail · <screenshot path> · <what you saw, one line>
```

## Clean up

Stop the servers, then remove the worktree: `git -C "$root" worktree remove --force "$root/.claude/worktrees/pr-<n>-ui"`. Done when both are gone.
