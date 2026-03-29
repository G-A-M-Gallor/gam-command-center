#!/bin/bash
# Automations (אוטומציות) - Design Tools עצמאיים
# שימוש: ./automations-design-tools.sh [command] [parameters]

BASE_TEMPLATE="automations-system-template.pen"
FEATURES_DIR="automations-designs/features"
IMPROVEMENTS_DIR="automations-designs/improvements"
EXPORTS_DIR="automations-designs/exports"

# צבעי Automations עצמאיים
AUTOMATIONS_PRIMARY="#FF6B1A"
AUTOMATIONS_SECONDARY="#FF8A3D"
AUTOMATIONS_DARK="#1A1A1A"
AUTOMATIONS_SURFACE="#2A2A2A"

# יצירת feature חדש לאוטומציות
new_automations_feature() {
    local name=$1
    local description=$2
    echo "🤖 יוצר feature חדש לאוטומציות: $name"
    pencil --in $BASE_TEMPLATE --out "$FEATURES_DIR/$name.pen" \
        --prompt "Create $name screen for Automations (אוטומציות) platform using independent design system. Use orange accent colors ($AUTOMATIONS_PRIMARY primary, $AUTOMATIONS_SECONDARY secondary). Dark theme with clean, automation-focused UI. Hebrew RTL support. This is automation management platform: $description" \
        --export "$EXPORTS_DIR/$name.png"
    echo "✅ נוצר: $FEATURES_DIR/$name.pen + $EXPORTS_DIR/$name.png"
}

# שיפור feature קיים באוטומציות
improve_automations_feature() {
    local name=$1
    local improvements=$2
    echo "🔧 משפר feature באוטומציות: $name"
    pencil --in "$FEATURES_DIR/$name.pen" --out "$IMPROVEMENTS_DIR/$name-improved.pen" \
        --prompt "Improve the $name screen for Automations (אוטומציות) platform. Keep independent orange accent design system ($AUTOMATIONS_PRIMARY). Focus on automation efficiency: $improvements" \
        --export "$EXPORTS_DIR/$name-improved.png"
    echo "✅ נוצר: $IMPROVEMENTS_DIR/$name-improved.pen"
}

# יצירת וריאנטים לאוטומציות
create_automations_variant() {
    local base=$1
    local variant_name=$2
    local changes=$3
    echo "🎭 יוצר וריאנט לאוטומציות: $variant_name"
    pencil --in "$base" --out "$FEATURES_DIR/$variant_name.pen" \
        --prompt "Create Automations (אוטומציות) platform variant: $changes. Maintain orange accent design system ($AUTOMATIONS_PRIMARY). Keep automation focus and Hebrew RTL." \
        --export "$EXPORTS_DIR/$variant_name.png"
    echo "✅ נוצר: $FEATURES_DIR/$variant_name.pen"
}

# תצוגת עזרה
show_automations_help() {
    echo "🤖 Automations (אוטומציות) - Design Tools עצמאיים"
    echo ""
    echo "🆕 יצירת feature חדש לאוטומציות:"
    echo "   ./automations-design-tools.sh new [name] \"[description]\""
    echo "   דוגמה: ./automations-design-tools.sh new automation-templates \"templates library for common automation patterns\""
    echo ""
    echo "🔧 שיפור feature קיים:"
    echo "   ./automations-design-tools.sh improve [name] \"[improvements]\""
    echo "   דוגמה: ./automations-design-tools.sh improve workflow-builder \"add keyboard shortcuts and better node grouping\""
    echo ""
    echo "🎭 יצירת וריאנט:"
    echo "   ./automations-design-tools.sh variant [base-file] [new-name] \"[changes]\""
    echo "   דוגמה: ./automations-design-tools.sh variant workflow-list.pen workflow-list-mobile \"mobile version with touch controls\""
    echo ""
    echo "📁 רשימת קבצים:"
    echo "   ./automations-design-tools.sh list"
    echo ""
    echo "🎨 עיצוב אוטומציות עצמאי:"
    echo "   - Primary: $AUTOMATIONS_PRIMARY (כתום)"
    echo "   - Secondary: $AUTOMATIONS_SECONDARY (כתום בהיר)"
    echo "   - Dark: $AUTOMATIONS_DARK (רקע כהה)"
    echo "   - Surface: $AUTOMATIONS_SURFACE (משטחים)"
}

# רשימת קבצים
list_automations_files() {
    echo "🤖 קבצי עיצוב אוטומציות:"
    echo ""
    echo "🎨 Template:"
    ls automations-system-template.pen 2>/dev/null | sed 's/.*\//  /'
    echo ""
    echo "🎯 Features:"
    ls automations-designs/features/*.pen 2>/dev/null | sed 's/.*\//  /'
    echo ""
    echo "🔧 Improvements:"
    ls automations-designs/improvements/*.pen 2>/dev/null | sed 's/.*\//  /'
    echo ""
    echo "🖼️ Exports:"
    ls automations-designs/exports/*.png 2>/dev/null | sed 's/.*\//  /'
}

# יצירת תיקיות בסיסיות
setup_automations_dirs() {
    mkdir -p automations-designs/features
    mkdir -p automations-designs/improvements
    mkdir -p automations-designs/exports
    echo "📁 נוצרו תיקיות אוטומציות"
}

# Main command handling
case $1 in
    "new")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "❌ שימוש: ./automations-design-tools.sh new [name] \"[description]\""
            exit 1
        fi
        setup_automations_dirs
        new_automations_feature "$2" "$3"
        ;;
    "improve")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "❌ שימוש: ./automations-design-tools.sh improve [name] \"[improvements]\""
            exit 1
        fi
        improve_automations_feature "$2" "$3"
        ;;
    "variant")
        if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
            echo "❌ שימוש: ./automations-design-tools.sh variant [base-file] [new-name] \"[changes]\""
            exit 1
        fi
        create_automations_variant "$2" "$3" "$4"
        ;;
    "list")
        list_automations_files
        ;;
    "setup")
        setup_automations_dirs
        ;;
    *)
        show_automations_help
        ;;
esac