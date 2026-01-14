#!/bin/bash
# SES Warm-Up Cron Script
# Runs the warm-up script and logs output

PROJECT_DIR="/home/ouhman/projects/zerowaste-frankfurt"
LOG_FILE="$PROJECT_DIR/logs/ses-warmup.log"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Add timestamp to log
echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "Run: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Run the warm-up script
cd "$PROJECT_DIR"
npx tsx scripts/ses-warmup.ts 4 >> "$LOG_FILE" 2>&1

# Keep log file from growing too large (keep last 1000 lines)
tail -n 1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
