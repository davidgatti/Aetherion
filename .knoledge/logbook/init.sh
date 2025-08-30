#!/bin/bash
# Generate timestamped logbook entry template
# MUST be run from within the logbook directory

# Check if we're in the correct directory
if [[ ! "$(basename "$(pwd)")" == "logbook" ]]; then
    echo "ERROR: This script must be run from within the logbook directory"
    echo "Current directory: $(pwd)"
    echo "Please navigate to the logbook folder and run again"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: ./init.sh 'short-description'"
    echo "Example: ./init.sh 'grafana-dashboard-updates'"
    echo "Note: Must be run from within the logbook directory"
    exit 1
fi

# Generate UTC timestamps
TIMESTAMP=$(TZ=UTC date '+%Y-%m-%d_%H:%M')
DESCRIPTION="$1"
FILENAME="${TIMESTAMP}_${DESCRIPTION}.md"

# Create the template
cat > "$FILENAME" << EOF
# ${DESCRIPTION//-/ }

**Date**: $(TZ=UTC date '+%Y-%m-%d %H:%M UTC')
**Type**: [Major Infrastructure | Service Update | Security | Maintenance | Troubleshooting]
**Impact**: [High | Medium | Low] - Brief impact description
**Status**: [🔧 In Progress | ✅ Completed | ❌ Failed | 🔄 Partial]

## Executive Summary

[2-3 sentence overview of what was done]

## Verification Steps Completed

1. ✅ Step 1 verification
2. ✅ Step 2 verification
3. ✅ Step 3 verification

## Next Steps for Future AI Agents

1. **Action 1**: Description of recommended follow-up
2. **Action 2**: Monitoring or maintenance tasks
3. **Action 3**: Future optimization opportunities

## Additional Notes

[Any additional context, lessons learned, or special considerations]

EOF

echo "Created logbook entry: $FILENAME"
echo "Timestamp generated in UTC: $(TZ=UTC date '+%Y-%m-%d %H:%M UTC')"
echo "Edit the file to complete the documentation."
