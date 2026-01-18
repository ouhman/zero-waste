#!/bin/bash
# Validate locale files for Vue I18n syntax issues
# Run this before committing changes to locale files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOCALES_DIR="$PROJECT_DIR/src/locales"

errors=0

echo "Validating locale files..."

for file in "$LOCALES_DIR"/*.json; do
  filename=$(basename "$file")

  # Check JSON syntax
  if ! node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null; then
    echo "ERROR: $filename has invalid JSON syntax"
    errors=$((errors + 1))
    continue
  fi

  # Check for unescaped @ symbols (Vue I18n linked message syntax)
  # Valid: {'@'} or no @ at all
  # Invalid: @ followed by word characters (looks like email or @:key reference)
  if grep -qP "@(?!\'\})[a-zA-Z]" "$file"; then
    echo "ERROR: $filename contains unescaped @ symbol"
    echo "  Vue I18n interprets @ as linked message syntax (@:key)"
    echo "  Use {'@'} to escape, e.g.: your{'@'}email.com"
    grep -nP "@(?!\'\})[a-zA-Z]" "$file" | head -5
    errors=$((errors + 1))
  fi

  # Check for unescaped pipe symbols (Vue I18n pluralization)
  # This is less common but can cause issues
  if grep -qP '(?<!\{)\|(?!\})' "$file" | grep -v "pluralization"; then
    # Only warn, as | is sometimes intentional
    if grep -P '"[^"]*(?<!\{)\|(?!\})[^"]*"' "$file" | grep -qv '{.*|.*}'; then
      echo "WARNING: $filename may contain unescaped | symbol"
      echo "  Vue I18n interprets | as pluralization syntax"
      echo "  Use {'|'} to escape if needed"
    fi
  fi
done

if [ $errors -eq 0 ]; then
  echo "All locale files are valid"
  exit 0
else
  echo ""
  echo "$errors error(s) found"
  exit 1
fi
