#!/bin/bash

# Professional Git Hooks Installer for Code Cleanup
# Usage: ./.maintenance/install-hooks.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
HOOKS_DIR="$ROOT_DIR/.git/hooks"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔗 Installing Professional Git Hooks for Code Cleanup...${NC}"

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Pre-commit hook - runs quick checks before commit
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
# Professional pre-commit hook for vBrain.io

SCRIPT_DIR="$(git rev-parse --show-toplevel)/.maintenance"
export NODE_NO_WARNINGS=1

echo "🔍 Running pre-commit cleanup checks..."

# Quick TypeScript check
if ! npx tsc --noEmit > /dev/null 2>&1; then
    echo "❌ TypeScript errors found. Commit blocked."
    npx tsc --noEmit
    exit 1
fi

# Quick ESLint check on staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | tr '\n' ' ')
if [[ -n "$STAGED_FILES" ]]; then
    if ! npx eslint $STAGED_FILES --max-warnings 5; then
        echo "❌ ESLint issues found. Fix before committing."
        exit 1
    fi
fi

# Check for TODO markers in staged files
TODO_COUNT=$(git diff --cached | grep -c "TODO\|FIXME\|XXX\|HACK" || true)
if [[ $TODO_COUNT -gt 5 ]]; then
    echo "⚠️  Adding $TODO_COUNT new TODO markers. Consider addressing some first."
    echo "Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Pre-commit checks passed"
EOF

# Pre-push hook - runs broader checks before push
cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash
# Professional pre-push hook for vBrain.io

SCRIPT_DIR="$(git rev-parse --show-toplevel)/.maintenance"

echo "🚀 Running pre-push cleanup audit..."

# Run lightweight audit
if [[ -f "$SCRIPT_DIR/cleanup-audit.sh" ]]; then
    # Run key checks only
    cd "$(git rev-parse --show-toplevel)"

    # TypeScript errors
    if ! npx tsc --noEmit; then
        echo "❌ TypeScript errors found. Push blocked."
        exit 1
    fi

    # ESLint issues
    ESLINT_ISSUES=$(npx eslint src/ --format=json 2>/dev/null | jq '[.[] | select(.errorCount > 0 or .warningCount > 10)] | length')
    if [[ $ESLINT_ISSUES -gt 3 ]]; then
        echo "❌ Too many ESLint issues ($ESLINT_ISSUES files). Fix critical issues first."
        exit 1
    fi

    echo "✅ Pre-push checks passed"
else
    echo "⚠️  Cleanup audit script not found"
fi
EOF

# Post-merge hook - runs cleanup after merge
cat > "$HOOKS_DIR/post-merge" << 'EOF'
#!/bin/bash
# Professional post-merge hook for vBrain.io

echo "🔄 Running post-merge cleanup..."

# Check if package.json changed
if git diff-tree -r --name-only HEAD@{1} HEAD | grep -q "package.json"; then
    echo "📦 Package.json changed - running npm install"
    npm install
fi

# Check if migrations changed
if git diff-tree -r --name-only HEAD@{1} HEAD | grep -q "supabase/migrations"; then
    echo "🗄️ Migrations changed - consider running: supabase db reset"
fi

echo "✅ Post-merge cleanup completed"
EOF

# Make hooks executable
chmod +x "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-push"
chmod +x "$HOOKS_DIR/post-merge"

echo -e "${GREEN}✅ Git hooks installed successfully!${NC}"
echo ""
echo -e "${YELLOW}Installed hooks:${NC}"
echo "  - pre-commit: TypeScript, ESLint, TODO check"
echo "  - pre-push: Full audit check"
echo "  - post-merge: Dependencies and migration check"
echo ""
echo "To uninstall: rm $HOOKS_DIR/pre-commit $HOOKS_DIR/pre-push $HOOKS_DIR/post-merge"