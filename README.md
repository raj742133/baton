# Baton

Pass the work, not the explanation. Baton keeps one living `BATON.md` (project location, state, decisions, exact next step, recent conversation). Drop it into any Claude chat on any account and the new chat locates the project and continues from the same point.

- `skill/baton/` the Claude skill (`SKILL.md`) plus the zero-dependency engine `scripts/baton.mjs` (Node 18+)
- `overlay/` the Claude Code plugin: auto-saves after every turn, `/baton` opens a live pane (copy whole file, save to OneDrive/Dropbox/Drive, live log)
- `site/` the website (static, deploys to Vercel as-is)
- `install.ps1`, `install.sh` installers; `build.py` builds `site/baton.zip`

## Install
Windows: `./install.ps1` · macOS/Linux: `sh install.sh`, then `claude --plugin-dir ~/.baton/overlay` and type `/baton`.
Optional hooks-only auto-save: `node ~/.baton/bin/baton.mjs install-hooks`.

## Use
Say "baton, hand off". In the new chat, drop `~/.baton/BATON.md` and send.
