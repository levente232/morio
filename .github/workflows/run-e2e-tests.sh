#!/bin/bash
source .github/workflows/ci-comment-lib.sh

# Exit on all errors
set -e

# Create the intial comment to inform the user
echo "folder:"
pwd
ls -l
createComment

