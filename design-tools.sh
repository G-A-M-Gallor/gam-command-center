#!/bin/bash
# vBrain.io Design Tools - כלי עיצוב מהיר
# שימוש: ./design-tools.sh [command] [parameters]

BASE_TEMPLATE="vbrain-designs/templates/vbrain-base-template.pen"
FEATURES_DIR="vbrain-designs/features"
IMPROVEMENTS_DIR="vbrain-designs/improvements"
EXPORTS_DIR="vbrain-designs/exports"

# יצירת feature חדש
new_feature() {
    local name=$1
    local description=$2
    echo "🎨 יוצר feature חדש: $name"
    pencil --in $BASE_TEMPLATE --out "$FEATURES_DIR/$name.pen" --prompt "Create $name screen using base template: $description" --export "$EXPORTS_DIR/$name.png"
    echo "✅ נוצר: $FEATURES_DIR/$name.pen + $EXPORTS_DIR/$name.png"
}

# שיפור feature קיים
improve_feature() {
    local name=$1
    local improvements=$2
    echo "🔧 משפר feature: $name"
    pencil --in "$FEATURES_DIR/$name.pen" --out "$IMPROVEMENTS_DIR/$name-improved.pen" --prompt "Improve the $name design: $improvements" --export "$EXPORTS_DIR/$name-improved.png"
    echo "✅ נוצר: $IMPROVEMENTS_DIR/$name-improved.pen"
}

# יצירת וריאנטים
create_variant() {
    local base=$1
    local variant_name=$2
    local changes=$3
    echo "🎭 יוצר וריאנט: $variant_name"
    pencil --in "$base" --out "$FEATURES_DIR/$variant_name.pen" --prompt "Create variant: $changes" --export "$EXPORTS_DIR/$variant_name.png"
    echo "✅ נוצר: $FEATURES_DIR/$variant_name.pen"
}

# תצוגת עזרה
show_help() {
    echo "📚 vBrain.io Design Tools - מדריך שימוש"
    echo ""
    echo "🆕 יצירת feature חדש:"
    echo "   ./design-tools.sh new [name] \"[description]\""
    echo "   דוגמה: ./design-tools.sh new notifications \"notification center with real-time updates\""
    echo ""
    echo "🔧 שיפור feature קיים:"
    echo "   ./design-tools.sh improve [name] \"[improvements]\""
    echo "   דוגמה: ./design-tools.sh improve team-management \"add bulk actions and advanced filters\""
    echo ""
    echo "🎭 יצירת וריאנט:"
    echo "   ./design-tools.sh variant [base-file] [new-name] \"[changes]\""
    echo "   דוגמה: ./design-tools.sh variant team-management.pen team-mobile \"mobile version with bottom navigation\""
    echo ""
    echo "📁 רשימת קבצים:"
    echo "   ./design-tools.sh list"
    echo ""
}

# רשימת קבצים
list_files() {
    echo "📁 קבצי עיצוב vBrain.io:"
    echo ""
    echo "🎨 Templates:"
    ls vbrain-designs/templates/*.pen 2>/dev/null | sed 's/.*\//  /'
    echo ""
    echo "🎯 Features:"
    ls vbrain-designs/features/*.pen 2>/dev/null | sed 's/.*\//  /'
    echo ""
    echo "🔧 Improvements:"
    ls vbrain-designs/improvements/*.pen 2>/dev/null | sed 's/.*\//  /'
    echo ""
    echo "🖼️ Exports:"
    ls vbrain-designs/exports/*.png 2>/dev/null | sed 's/.*\//  /'
}

# Main command handling
case $1 in
    "new")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "❌ שימוש: ./design-tools.sh new [name] \"[description]\""
            exit 1
        fi
        new_feature "$2" "$3"
        ;;
    "improve")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "❌ שימוש: ./design-tools.sh improve [name] \"[improvements]\""
            exit 1
        fi
        improve_feature "$2" "$3"
        ;;
    "variant")
        if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
            echo "❌ שימוש: ./design-tools.sh variant [base-file] [new-name] \"[changes]\""
            exit 1
        fi
        create_variant "$2" "$3" "$4"
        ;;
    "list")
        list_files
        ;;
    *)
        show_help
        ;;
esac