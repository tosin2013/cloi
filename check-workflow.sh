#!/bin/bash

# GitHub Workflow Run Checker
# Usage: ./check-workflow.sh [run_id]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed. Please install it first:"
    echo "  macOS: brew install gh"
    echo "  Linux: See https://github.com/cli/cli#installation"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Set default repository if needed
print_status "Setting up GitHub CLI default repository..."
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ $REPO_URL =~ github\.com[:/]([^/]+/[^/]+)(\.git)?$ ]]; then
    REPO_NAME="${BASH_REMATCH[1]}"
    REPO_NAME="${REPO_NAME%.git}"
    print_status "Detected repository: $REPO_NAME"
    
    # Set default repo (suppress output)
    gh repo set-default "$REPO_NAME" > /dev/null 2>&1 || true
else
    print_warning "Could not detect GitHub repository from remote URL"
fi

# Check GitHub CLI authentication
print_status "Checking GitHub CLI authentication..."
if ! gh auth status > /dev/null 2>&1; then
    print_warning "GitHub CLI is not authenticated. Run 'gh auth login' to authenticate."
else
    print_success "GitHub CLI is authenticated"
fi

# Function to check specific run with better error handling
check_run() {
    local run_id=$1
    print_status "Checking workflow run: $run_id"
    
    # Try to get run details with better error handling
    local run_output=$(gh run view "$run_id" 2>&1 || echo "ERROR")
    
    if [[ "$run_output" == *"ERROR"* ]] || [[ "$run_output" == *"not found"* ]]; then
        print_error "Could not find workflow run: $run_id"
        print_status "This could mean:"
        echo "  - Run ID doesn't exist"
        echo "  - Run is from a different repository"
        echo "  - GitHub CLI needs authentication"
        return 1
    else
        print_success "Workflow run found. Details:"
        echo "$run_output"
        
        echo ""
        print_status "Attempting to get workflow logs..."
        local log_output=$(gh run view "$run_id" --log 2>&1 || echo "LOG_ERROR")
        
        if [[ "$log_output" == *"LOG_ERROR"* ]] || [[ "$log_output" == *"not found"* ]]; then
            print_warning "Could not retrieve logs (run might be in progress, completed, or access denied)"
        else
            echo ""
            print_status "Workflow logs:"
            echo "$log_output"
        fi
    fi
}

# Function to list recent runs
list_recent_runs() {
    print_status "Listing recent workflow runs:"
    local runs_output=$(gh run list --limit 10 2>&1 || echo "LIST_ERROR")
    
    if [[ "$runs_output" == *"LIST_ERROR"* ]]; then
        print_error "Could not list recent workflow runs"
        print_status "Try running: gh auth login"
        return 1
    else
        echo "$runs_output"
    fi
}

# Function to show workflow status
show_workflow_status() {
    print_status "Checking current workflow status..."
    
    # Get the latest commit
    local latest_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    print_status "Latest commit: $latest_commit"
    
    # Try to get runs for this commit
    local commit_runs=$(gh run list --commit "$latest_commit" --limit 5 2>&1 || echo "COMMIT_ERROR")
    
    if [[ "$commit_runs" != *"COMMIT_ERROR"* ]]; then
        echo ""
        print_status "Workflow runs for latest commit:"
        echo "$commit_runs"
    fi
}

# Main logic
RUN_ID=${1:-15880450900}

echo "🔍 GitHub Workflow Run Checker"
echo "================================"

# Show basic info
print_status "Repository: $REPO_NAME"
print_status "Target run ID: $RUN_ID"
echo ""

# Try to check the specific run
if check_run "$RUN_ID"; then
    print_success "Workflow run check completed"
else
    print_warning "Failed to check specific run. Getting alternative information:"
    echo ""
    
    # Show recent runs
    list_recent_runs
    echo ""
    
    # Show workflow status for current commit
    show_workflow_status
fi

echo ""
print_status "Troubleshooting commands:"
echo "  gh auth login                  # Authenticate with GitHub"
echo "  gh auth status                 # Check authentication status"
echo "  gh run list                    # List all recent runs"
echo "  gh run view <run_id>          # View specific run"
echo "  gh run rerun <run_id>         # Rerun failed workflow"
echo ""
print_status "Direct GitHub link for this run:"
echo "  https://github.com/$REPO_NAME/actions/runs/$RUN_ID" 