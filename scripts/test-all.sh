#!/bin/bash
# Run all tests with minimal output for AI consumption
# Reports failed tests for individual re-running

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR" || exit 1

# Colors for output (disabled if not a terminal)
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  NC='\033[0m'
else
  RED=''
  GREEN=''
  NC=''
fi

LOCALES_EXIT=0
UNIT_EXIT=0
E2E_EXIT=0
UNIT_FAILED=()
E2E_FAILED=()

# Validate locale files (fast, run first)
echo "Validating locale files..."
LOCALES_OUTPUT=$("$SCRIPT_DIR/validate-locales.sh" 2>&1)
LOCALES_EXIT=$?

# Run unit tests
echo "Running unit tests..."
UNIT_OUTPUT=$(npm run test -- --reporter=json 2>&1)
UNIT_EXIT=$?

if [[ $UNIT_EXIT -ne 0 ]]; then
  # Extract failed test files from JSON output
  while IFS= read -r line; do
    UNIT_FAILED+=("$line")
  done < <(echo "$UNIT_OUTPUT" | grep -oP '"name"\s*:\s*"\K[^"]+\.spec\.ts' | sort -u)

  # Fallback: try to extract from standard output if JSON parsing fails
  if [[ ${#UNIT_FAILED[@]} -eq 0 ]]; then
    while IFS= read -r line; do
      UNIT_FAILED+=("$line")
    done < <(echo "$UNIT_OUTPUT" | grep -oP 'FAIL\s+\K\S+\.spec\.ts' | sort -u)
  fi
fi

# Run e2e tests
echo "Running e2e tests..."
E2E_OUTPUT=$(npm run test:e2e -- --reporter=list 2>&1)
E2E_EXIT=$?

if [[ $E2E_EXIT -ne 0 ]]; then
  # Extract failed test files from Playwright output
  while IFS= read -r line; do
    E2E_FAILED+=("$line")
  done < <(echo "$E2E_OUTPUT" | grep -oP '\[chromium\].*\K\S+\.spec\.ts' | sort -u)

  # Fallback: look for failed marker
  if [[ ${#E2E_FAILED[@]} -eq 0 ]]; then
    while IFS= read -r line; do
      E2E_FAILED+=("$line")
    done < <(echo "$E2E_OUTPUT" | grep -oP 'tests/e2e/\S+\.spec\.ts' | sort -u)
  fi
fi

# Report results
echo ""
echo "========================================"

if [[ $LOCALES_EXIT -eq 0 && $UNIT_EXIT -eq 0 && $E2E_EXIT -eq 0 ]]; then
  echo -e "${GREEN}All tests passed${NC}"
  exit 0
fi

FINAL_EXIT=1

if [[ $LOCALES_EXIT -ne 0 ]]; then
  echo -e "${RED}Locale validation FAILED${NC}"
  echo "$LOCALES_OUTPUT" | grep -E "^(ERROR|WARNING|  )" | head -10
  echo "  Run: npm run validate:locales"
  echo ""
fi

if [[ $UNIT_EXIT -ne 0 ]]; then
  echo -e "${RED}Unit tests FAILED${NC}"
  if [[ ${#UNIT_FAILED[@]} -gt 0 ]]; then
    echo "Failed unit test files:"
    for f in "${UNIT_FAILED[@]}"; do
      echo "  npm run test -- $f"
    done
  else
    echo "  Run: npm run test"
  fi
  echo ""
fi

if [[ $E2E_EXIT -ne 0 ]]; then
  echo -e "${RED}E2E tests FAILED${NC}"
  if [[ ${#E2E_FAILED[@]} -gt 0 ]]; then
    echo "Failed e2e test files:"
    for f in "${E2E_FAILED[@]}"; do
      echo "  npm run test:e2e -- $f"
    done
  else
    echo "  Run: npm run test:e2e"
  fi
fi

echo "========================================"
exit $FINAL_EXIT
