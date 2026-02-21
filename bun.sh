#!/bin/bash
# Bun wrapper script for Stellar Game Studio
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/node_modules/.bin/bun" "$@"
