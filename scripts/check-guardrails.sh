#!/usr/bin/env bash
# check-guardrails.sh — crm
# Audits known risk patterns. WARN-ONLY (exit 0). Exit 1 only on infra error.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0; WARN=0
echo "=========================================="
echo " Guardrails check: crm"
echo "=========================================="
SCAN_DIRS=()
for d in app lib components; do [[ -d "$REPO_ROOT/$d" ]] && SCAN_DIRS+=("$REPO_ROOT/$d"); done
if [[ ${#SCAN_DIRS[@]} -eq 0 ]]; then echo "ERROR: no source dirs (app/lib/components) found"; exit 1; fi
echo ""; echo "CHECK 1: toLocaleDateString/toLocaleString without timeZone"
TZ_VIOLATIONS=$(grep -rn "toLocaleDateString(\|toLocaleString(" "${SCAN_DIRS[@]}" 2>/dev/null | grep -v "timeZone" || true)
TZ_COUNT=$(echo "$TZ_VIOLATIONS" | grep -c "." || true)
if [[ "$TZ_COUNT" -gt 0 ]]; then echo "  WARN: $TZ_COUNT call(s) without timeZone:'America/Mexico_City'"; echo "$TZ_VIOLATIONS" | sed 's/^/    /'; WARN=$((WARN+1)); else echo "  OK: none"; PASS=$((PASS+1)); fi
echo ""; echo "CHECK 2: hardcoded Supabase project URL"
SB_VIOLATIONS=$(grep -rn "https://[a-z0-9]\{15,\}\.supabase\.co" "${SCAN_DIRS[@]}" 2>/dev/null || true)
SB_COUNT=$(echo "$SB_VIOLATIONS" | grep -c "." || true)
if [[ "$SB_COUNT" -gt 0 ]]; then echo "  WARN: $SB_COUNT hardcoded Supabase URL(s) — use NEXT_PUBLIC_SUPABASE_URL"; echo "$SB_VIOLATIONS" | sed 's/^/    /'; WARN=$((WARN+1)); else echo "  OK: none"; PASS=$((PASS+1)); fi
echo ""; echo " RESULT: $PASS clean, $WARN warn — exit 0 (warn-only)"; exit 0
