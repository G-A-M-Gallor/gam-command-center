#!/bin/bash

# Professional Code Cleanup Scheduler
# Usage: ./cleanup-scheduler.sh [install|run|status|uninstall] [daily|weekly|monthly]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$SCRIPT_DIR/cleanup-config.json"
AUDIT_SCRIPT="$SCRIPT_DIR/cleanup-audit.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Function to get config value
get_config() {
    local key="$1"
    jq -r "$key" "$CONFIG_FILE" 2>/dev/null || echo "null"
}

# Function to run cleanup checks
run_cleanup() {
    local schedule_type="$1"
    log "🔍 Starting $schedule_type cleanup audit..."

    # Get checks for this schedule
    local checks=$(get_config ".cleanup_schedule.$schedule_type.checks[]")

    if [[ "$checks" == "null" || -z "$checks" ]]; then
        log "⚠️ No checks configured for $schedule_type schedule"
        return 0
    fi

    # Run audit script
    cd "$ROOT_DIR"

    # Create timestamped log file
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local log_file="$SCRIPT_DIR/logs/cleanup_${schedule_type}_${timestamp}.log"
    mkdir -p "$(dirname "$log_file")"

    # Run with report and potential auto-fix
    local auto_fix_enabled=$(get_config ".auto_fix.enabled")

    if [[ "$auto_fix_enabled" == "true" ]]; then
        log "🔧 Auto-fix enabled - running with --fix flag"
        "$AUDIT_SCRIPT" --fix 2>&1 | tee "$log_file"
    else
        log "📋 Running in report-only mode"
        "$AUDIT_SCRIPT" --report-only 2>&1 | tee "$log_file"
    fi

    local exit_code=${PIPESTATUS[0]}

    # Parse results
    local report_file=$(find "$SCRIPT_DIR/reports" -name "cleanup_audit_*.json" | sort | tail -1)

    if [[ -f "$report_file" ]]; then
        local failed_checks=$(jq '.summary.failed' "$report_file" 2>/dev/null || echo "0")
        local total_checks=$(jq '.summary.total_checks' "$report_file" 2>/dev/null || echo "0")

        if [[ $failed_checks -gt 0 ]]; then
            log "⚠️ $schedule_type cleanup found $failed_checks/$total_checks issues"

            # Send notification if configured
            send_notification "$schedule_type" "$failed_checks" "$total_checks" "$report_file"
        else
            log "✅ $schedule_type cleanup passed - all $total_checks checks OK"
        fi
    else
        log "❌ $schedule_type cleanup failed - no report generated"
    fi

    return $exit_code
}

# Function to send notifications
send_notification() {
    local schedule_type="$1"
    local failed="$2"
    local total="$3"
    local report_file="$4"

    local slack_webhook=$(get_config ".notifications.slack_webhook")
    local failure_only=$(get_config ".notifications.failure_only")

    if [[ "$slack_webhook" != "null" && "$slack_webhook" != "" ]]; then
        local message="🔍 vBrain.io $schedule_type cleanup: $failed/$total checks failed"

        if [[ $failed -eq 0 && "$failure_only" == "true" ]]; then
            return 0  # Skip notification for success if failure_only is true
        fi

        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"$message\"}" \
             "$slack_webhook" 2>/dev/null || true
    fi
}

# Function to install cron jobs
install_cron() {
    log "📅 Installing cron jobs for automated cleanup..."

    # Get schedule configuration
    local daily_enabled=$(get_config ".cleanup_schedule.daily.enabled")
    local daily_time=$(get_config ".cleanup_schedule.daily.time")
    local weekly_enabled=$(get_config ".cleanup_schedule.weekly.enabled")
    local weekly_day=$(get_config ".cleanup_schedule.weekly.day")
    local weekly_time=$(get_config ".cleanup_schedule.weekly.time")
    local monthly_enabled=$(get_config ".cleanup_schedule.monthly.enabled")
    local monthly_day=$(get_config ".cleanup_schedule.monthly.day")
    local monthly_time=$(get_config ".cleanup_schedule.monthly.time")

    # Create temporary cron file
    local temp_cron=$(mktemp)

    # Preserve existing cron (excluding our entries)
    crontab -l 2>/dev/null | grep -v "vBrain.io cleanup" > "$temp_cron" || true

    # Add our entries
    if [[ "$daily_enabled" == "true" ]]; then
        local hour=$(echo "$daily_time" | cut -d: -f1)
        local minute=$(echo "$daily_time" | cut -d: -f2)
        echo "$minute $hour * * * $SCRIPT_DIR/cleanup-scheduler.sh run daily # vBrain.io cleanup" >> "$temp_cron"
    fi

    if [[ "$weekly_enabled" == "true" ]]; then
        local hour=$(echo "$weekly_time" | cut -d: -f1)
        local minute=$(echo "$weekly_time" | cut -d: -f2)
        local dow=0  # Sunday
        case "$weekly_day" in
            "monday") dow=1 ;;
            "tuesday") dow=2 ;;
            "wednesday") dow=3 ;;
            "thursday") dow=4 ;;
            "friday") dow=5 ;;
            "saturday") dow=6 ;;
            "sunday") dow=0 ;;
        esac
        echo "$minute $hour * * $dow $SCRIPT_DIR/cleanup-scheduler.sh run weekly # vBrain.io cleanup" >> "$temp_cron"
    fi

    if [[ "$monthly_enabled" == "true" ]]; then
        local hour=$(echo "$monthly_time" | cut -d: -f1)
        local minute=$(echo "$monthly_time" | cut -d: -f2)
        echo "$minute $hour $monthly_day * * $SCRIPT_DIR/cleanup-scheduler.sh run monthly # vBrain.io cleanup" >> "$temp_cron"
    fi

    # Install the new crontab
    crontab "$temp_cron"
    rm "$temp_cron"

    log "✅ Cron jobs installed successfully"
    crontab -l | grep "vBrain.io cleanup"
}

# Function to show status
show_status() {
    log "📊 vBrain.io Cleanup System Status"
    echo ""

    # Check if cron jobs are installed
    if crontab -l 2>/dev/null | grep -q "vBrain.io cleanup"; then
        echo -e "${GREEN}✅ Cron jobs: ACTIVE${NC}"
        crontab -l | grep "vBrain.io cleanup"
    else
        echo -e "${YELLOW}⚠️  Cron jobs: NOT INSTALLED${NC}"
    fi
    echo ""

    # Show recent reports
    echo "📋 Recent Reports:"
    find "$SCRIPT_DIR/reports" -name "cleanup_audit_*.json" -mtime -7 2>/dev/null | sort | tail -5 | while read file; do
        local timestamp=$(basename "$file" .json | sed 's/cleanup_audit_//')
        local failed=$(jq '.summary.failed' "$file" 2>/dev/null || echo "?")
        local total=$(jq '.summary.total_checks' "$file" 2>/dev/null || echo "?")
        echo "  $(date -d "${timestamp:0:8} ${timestamp:9:2}:${timestamp:11:2}:${timestamp:13:2}" '+%Y-%m-%d %H:%M' 2>/dev/null || echo "$timestamp"): $failed/$total issues"
    done

    # Show disk usage
    local reports_size=$(du -sh "$SCRIPT_DIR/reports" 2>/dev/null | cut -f1 || echo "0")
    local logs_size=$(du -sh "$SCRIPT_DIR/logs" 2>/dev/null | cut -f1 || echo "0")
    echo ""
    echo "💾 Storage: Reports ($reports_size), Logs ($logs_size)"
}

# Function to uninstall
uninstall_cron() {
    log "🗑️  Uninstalling cleanup cron jobs..."

    local temp_cron=$(mktemp)
    crontab -l 2>/dev/null | grep -v "vBrain.io cleanup" > "$temp_cron" || true
    crontab "$temp_cron"
    rm "$temp_cron"

    log "✅ Cron jobs uninstalled"
}

# Main script logic
case "${1:-help}" in
    "install")
        if [[ ! -f "$CONFIG_FILE" ]]; then
            log "❌ Configuration file not found: $CONFIG_FILE"
            exit 1
        fi
        install_cron
        ;;
    "run")
        if [[ -z "$2" ]]; then
            log "❌ Schedule type required: daily|weekly|monthly"
            exit 1
        fi
        run_cleanup "$2"
        ;;
    "status")
        show_status
        ;;
    "uninstall")
        uninstall_cron
        ;;
    "help"|*)
        echo "Professional Code Cleanup Scheduler for vBrain.io"
        echo ""
        echo "Usage: $0 [install|run|status|uninstall] [schedule_type]"
        echo ""
        echo "Commands:"
        echo "  install     Install cron jobs for automated cleanup"
        echo "  run <type>  Run cleanup for specific schedule (daily|weekly|monthly)"
        echo "  status      Show system status and recent reports"
        echo "  uninstall   Remove cron jobs"
        echo ""
        echo "Examples:"
        echo "  $0 install"
        echo "  $0 run daily"
        echo "  $0 status"
        ;;
esac