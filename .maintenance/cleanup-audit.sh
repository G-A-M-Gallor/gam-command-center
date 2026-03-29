#!/bin/bash

# Professional Code Cleanup Audit Script v1.0
# Usage: ./cleanup-audit.sh [--fix] [--report-only]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="$SCRIPT_DIR/reports"
REPORT_FILE="$REPORT_DIR/cleanup_audit_$TIMESTAMP.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
FIX_MODE=false
REPORT_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --fix)
      FIX_MODE=true
      shift
      ;;
    --report-only)
      REPORT_ONLY=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize report
cat > "$REPORT_FILE" << EOF
{
  "audit_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project_root": "$ROOT_DIR",
  "audit_type": "code_cleanup",
  "results": {
EOF

echo -e "${BLUE}🔍 Starting Professional Code Cleanup Audit...${NC}"
echo "Report will be saved to: $REPORT_FILE"

# Function to append to report
append_to_report() {
  local section="$1"
  local data="$2"
  echo "    \"$section\": $data," >> "$REPORT_FILE"
}

# Function to run command and capture output
run_audit() {
  local name="$1"
  local command="$2"
  local threshold="${3:-0}"

  echo -e "${YELLOW}Checking $name...${NC}"

  # Run command and capture both output and exit code
  local output
  local exit_code
  output=$(eval "$command" 2>&1) || exit_code=$?
  exit_code=${exit_code:-0}

  # Count lines for threshold check
  local count=$(echo "$output" | wc -l)
  local status="pass"

  if [[ $count -gt $threshold ]]; then
    status="fail"
    echo -e "${RED}❌ $name: Found $count issues (threshold: $threshold)${NC}"
  else
    echo -e "${GREEN}✅ $name: $count issues (within threshold)${NC}"
  fi

  # Add to report
  append_to_report "$name" "$(jq -n \
    --arg cmd "$command" \
    --arg output "$output" \
    --arg status "$status" \
    --argjson count "$count" \
    --argjson threshold "$threshold" \
    '{command: $cmd, status: $status, count: $count, threshold: $threshold, details: ($output | split("\n"))}')"
}

# 1. Dead Code Detection
echo -e "\n${BLUE}📦 DEAD CODE ANALYSIS${NC}"
cd "$ROOT_DIR"

# Unused exports (requires ts-prune)
if command -v npx >/dev/null 2>&1; then
  run_audit "unused_exports" "npx ts-prune --error 2>/dev/null | grep -v 'used in module'" 10
  run_audit "unused_imports" "npx unimported --show-unresolved 2>/dev/null | grep -E '^[^[].*:'" 5
else
  echo -e "${YELLOW}⚠️ NPX not available, skipping TypeScript analysis${NC}"
fi

# 2. File Analysis
echo -e "\n${BLUE}📁 FILE ANALYSIS${NC}"

# Large files
run_audit "large_files" "find src/ -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -nr | head -10 | awk '\$1 > 500 {print \$2 \" (\" \$1 \" lines)\"}'" 5

# Empty files
run_audit "empty_files" "find src/ -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' | xargs -I {} sh -c 'test ! -s \"{}\" && echo \"{}\"'" 0

# Duplicate files (by content hash)
run_audit "duplicate_files" "find src/ -name '*.ts' -o -name '*.tsx' | xargs md5sum | sort | uniq -d -w 32 | cut -c 35-" 0

# 3. Dependency Analysis
echo -e "\n${BLUE}📚 DEPENDENCY ANALYSIS${NC}"

if [[ -f "package.json" ]]; then
  # Unused dependencies
  run_audit "unused_dependencies" "npx depcheck --json 2>/dev/null | jq -r '.dependencies[]?'" 3

  # Outdated dependencies
  run_audit "outdated_dependencies" "npm outdated --json 2>/dev/null | jq -r 'keys[]?'" 10
else
  echo -e "${YELLOW}⚠️ No package.json found${NC}"
fi

# 4. Code Quality Metrics
echo -e "\n${BLUE}📊 CODE QUALITY METRICS${NC}"

# TODO/FIXME count
run_audit "tech_debt_markers" "grep -r 'TODO\\|FIXME\\|XXX\\|HACK\\|@ts-ignore' src/ --include='*.ts' --include='*.tsx' 2>/dev/null" 20

# ESLint issues
if [[ -f "eslint.config.mjs" ]]; then
  run_audit "eslint_issues" "npx eslint src/ --format=json 2>/dev/null | jq -r '.[] | select(.errorCount > 0 or .warningCount > 0) | .filePath'" 5
fi

# TypeScript errors
if [[ -f "tsconfig.json" ]]; then
  run_audit "typescript_errors" "npx tsc --noEmit --pretty false 2>&1 | grep 'error TS' || true" 0
fi

# 5. Project Structure Analysis
echo -e "\n${BLUE}🏗️ PROJECT STRUCTURE${NC}"

# Deep nesting
run_audit "deep_nesting" "find src/ -type d | awk -F/ 'NF > 8 {print \$0 \" (depth: \" NF-2 \")\"}'" 3

# Naming conventions
run_audit "naming_violations" "find src/ -name '*.ts' -o -name '*.tsx' | grep -E '(^|/)([A-Z][a-z]*){2,}\\.(ts|tsx)$|camelCase.*\\.(ts|tsx)$' || true" 5

# 6. Git Analysis
echo -e "\n${BLUE}📝 GIT ANALYSIS${NC}"

if [[ -d ".git" ]]; then
  # Large files in git history
  run_audit "git_large_files" "git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '\$1 == \"blob\" && \$3 > 1048576 {print \$4 \" (\" \$3/1048576 \"MB)\"}'" 3

  # Files with many changes
  run_audit "frequently_changed_files" "git log --name-only --pretty=format: | sort | uniq -c | sort -nr | head -10 | awk '\$1 > 100 {print \$2 \" (\" \$1 \" changes)\"}'" 3
fi

# Close report JSON
sed -i '' '$ s/,$//' "$REPORT_FILE" 2>/dev/null || sed -i '$ s/,$//' "$REPORT_FILE"  # Remove trailing comma
cat >> "$REPORT_FILE" << EOF
  },
  "summary": {
    "total_checks": $(grep -o '"status"' "$REPORT_FILE" | wc -l),
    "passed": $(grep -o '"status": "pass"' "$REPORT_FILE" | wc -l),
    "failed": $(grep -o '"status": "fail"' "$REPORT_FILE" | wc -l)
  }
}
EOF

# Summary
echo -e "\n${BLUE}📋 AUDIT SUMMARY${NC}"
TOTAL_CHECKS=$(grep -o '"status"' "$REPORT_FILE" | wc -l)
PASSED_CHECKS=$(grep -o '"status": "pass"' "$REPORT_FILE" | wc -l)
FAILED_CHECKS=$(grep -o '"status": "fail"' "$REPORT_FILE" | wc -l)

echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"

if [[ $FAILED_CHECKS -gt 0 ]]; then
  echo -e "\n${YELLOW}⚠️ Issues found. Review the report: $REPORT_FILE${NC}"
  echo -e "Run with ${BLUE}--fix${NC} flag to attempt automatic fixes"
else
  echo -e "\n${GREEN}✅ All checks passed! Codebase is clean.${NC}"
fi

# Auto-fix mode
if [[ "$FIX_MODE" == "true" && $FAILED_CHECKS -gt 0 ]]; then
  echo -e "\n${BLUE}🔧 RUNNING AUTOMATIC FIXES${NC}"

  # Fix ESLint issues
  if command -v npx >/dev/null 2>&1; then
    echo -e "${YELLOW}Fixing ESLint issues...${NC}"
    npx eslint src/ --fix || true
  fi

  # Remove empty files
  echo -e "${YELLOW}Removing empty files...${NC}"
  find src/ -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' | xargs -I {} sh -c 'test ! -s "{}" && echo "Removing empty file: {}" && rm "{}"'

  # Clean package-lock.json
  if [[ -f "package-lock.json" ]]; then
    echo -e "${YELLOW}Cleaning package-lock.json...${NC}"
    rm package-lock.json
    npm install
  fi

  echo -e "${GREEN}✅ Automatic fixes completed${NC}"
fi

echo -e "\n${BLUE}Report saved to: $REPORT_FILE${NC}"