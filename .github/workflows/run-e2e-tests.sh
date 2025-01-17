#!/bin/bash
source .github/workflows/ci-comment-lib.sh

# Exit on all errors
set -e

# When you re-run an action on GitHub, the pull request number is not available
# So instead, we parse it out of $GITHUB_REF with this one-liner
export PR_NUMBER=$(echo $GITHUB_REF | awk 'BEGIN { FS = "/" } ; { print $3 }')

# Create the intial comment to inform the user
echo "GITHUB_REF: $GITHUB_REF"
echo "PR_NUMBER: $PR_NUMBER"
createComment

