#!/usr/bin/env sh
# Baton installer (macOS / Linux / Git Bash). Usage: curl -fsSL <site>/install.sh | sh   or run from a clone.
set -e
command -v node >/dev/null 2>&1 || { echo "Node.js 18+ is required: https://nodejs.org" >&2; exit 1; }
HERE="$(cd "$(dirname "$0")" 2>/dev/null && pwd || echo "")"
SRC=""
[ -n "$HERE" ] && [ -d "$HERE/skill/baton" ] && SRC="$HERE"
if [ -z "$SRC" ]; then
  TMP="$(mktemp -d)"; curl -fsSL "https://BATON_SITE/baton.zip" -o "$TMP/baton.zip"
  (cd "$TMP" && unzip -q baton.zip); SRC="$TMP"
fi
mkdir -p "$HOME/.claude/skills/baton" "$HOME/.baton/bin" "$HOME/.baton/overlay"
cp -R "$SRC/skill/baton/." "$HOME/.claude/skills/baton/"
cp "$SRC/skill/baton/scripts/baton.mjs" "$HOME/.baton/bin/baton.mjs"
[ -d "$SRC/overlay" ] && cp -R "$SRC/overlay/." "$HOME/.baton/overlay/"
echo "Baton installed."
echo " skill   : $HOME/.claude/skills/baton"
echo " engine  : $HOME/.baton/bin/baton.mjs"
echo " overlay : $HOME/.baton/overlay  (claude --plugin-dir \"$HOME/.baton/overlay\")"
echo "Optional auto-save without the overlay: node \"$HOME/.baton/bin/baton.mjs\" install-hooks"
