#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_DIR_WIN="$(cygpath -w "$SCRIPT_DIR")"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$SCRIPT_DIR_WIN\\status-dev.ps1" "$@"
