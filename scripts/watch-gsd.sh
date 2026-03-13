#!/bin/bash
# watch-gsd.sh — watches the GSD overview file and auto-pushes on change
# Install fswatch: brew install fswatch
# Install: see com.swey.gsd-watcher.plist

WORKSPACE="$HOME/GitHub Repos/claude-workspace"
DASHBOARD="$HOME/GitHub Repos/claude-usage-dashboard"
OVERVIEW="$WORKSPACE/plans/gsd-projects-overview.md"
PARSER="$DASHBOARD/scripts/parse-gsd.js"
LOCKFILE="/tmp/gsd-watcher.lock"

log() { echo "[$(date '+%H:%M:%S')] GSD-WATCHER: $*"; }

run_parse_and_push() {
  # Debounce: ignore if ran in the last 30s
  if [ -f "$LOCKFILE" ]; then
    local age=$(( $(date +%s) - $(stat -f %m "$LOCKFILE" 2>/dev/null || echo 0) ))
    [ "$age" -lt 30 ] && return
  fi
  touch "$LOCKFILE"

  log "Change detected — parsing GSD state..."
  node "$PARSER" || { log "Parser failed"; return; }

  cd "$DASHBOARD" || return
  if git diff --quiet data/gsd-state.json 2>/dev/null; then
    log "No changes in gsd-state.json — skipping push"
    return
  fi

  git add data/gsd-state.json
  git commit -m "chore: auto-sync gsd-state $(date '+%Y-%m-%d %H:%M')" --no-verify
  git push origin main
  log "Pushed — deploying to Vercel..."
  vercel --prod --yes > /tmp/gsd-vercel-deploy.log 2>&1 && log "Vercel deployed ✓" || log "Vercel deploy failed — check /tmp/gsd-vercel-deploy.log"
}

log "Starting GSD watcher on: $OVERVIEW"
log "Dashboard: $DASHBOARD"

# Run once on startup
run_parse_and_push

# Watch for changes
fswatch -o "$OVERVIEW" | while read -r _; do
  run_parse_and_push
done
