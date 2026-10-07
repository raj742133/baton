---
name: overlay
description: Open the Baton live view (auto-save log, copy whole BATON.md, save to OneDrive/Dropbox/Drive) inside the app. Use when the user types /baton-live or /overlay, or asks to see the Baton overlay, dashboard or live saves.
---

# /overlay: alias of /baton-live (the Baton live view, inside the app)

The live view is a local dashboard at `http://localhost:4747` served by the Baton engine. This skill makes sure it is running and shows it in the app's browser pane.

1. Make sure the engine is installed and the dashboard is running (silent, safe to repeat):
   `node "$HOME/.baton/bin/baton.mjs" live --ensure` (Windows: `%USERPROFILE%\.baton\bin\baton.mjs`).
   If the file does not exist, tell the user to install Baton (`https://baton-handoff.vercel.app`) and stop.
2. Open it: call `mcp__Claude_Browser__preview_start` with `url: "http://localhost:4747"`. If the browser pane is already open on it, `mcp__Claude_Browser__navigate` to the same URL instead.
3. If the browser tools are not available, just give the URL.
4. Reply in one or two lines: what the page shows (live save log, Copy whole .md, Download, Save a copy to OneDrive/Dropbox/Drive, project picker) and that it refreshes by itself every 2 seconds. Do not narrate the setup.

Notes: saves come from the global Baton hooks (every prompt, reply, compaction, session end), not from this skill. If the log stays empty, run `node "$HOME/.baton/bin/baton.mjs" install-hooks`.
