#!/bin/bash

# Setup script for creating and pushing to remote repository
# Usage: ./setup_remote.sh YOUR_GITHUB_USERNAME

set -e

GITHUB_USERNAME=$1
REPO_NAME="vscode_metadata_tool"

if [ -z "$GITHUB_USERNAME" ]; then
    echo "Usage: ./setup_remote.sh YOUR_GITHUB_USERNAME"
    echo "Example: ./setup_remote.sh Avind87"
    exit 1
fi

echo "Setting up remote repository for $REPO_NAME..."
echo "GitHub username: $GITHUB_USERNAME"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "Staging all files..."
    git add .
    
    echo "Creating initial commit..."
    git commit -m "Initial commit: TurboVault Metadata Editor VS Code Extension"
else
    echo "No changes to commit (repository already has commits)"
fi

# Check if remote already exists
if git remote | grep -q "^origin$"; then
    echo "Remote 'origin' already exists. Checking current URL..."
    CURRENT_URL=$(git remote get-url origin)
    echo "Current remote URL: $CURRENT_URL"
    
    read -p "Do you want to update the remote URL? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
        echo "Remote URL updated"
    fi
else
    echo "Adding remote origin..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

# Check current branch name
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

if [ -z "$CURRENT_BRANCH" ]; then
    CURRENT_BRANCH="main"
fi

echo "Current branch: $CURRENT_BRANCH"

# Rename branch to main if needed
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Renaming branch to 'main'..."
    git branch -M main
    CURRENT_BRANCH="main"
fi

echo ""
echo "========================================="
echo "Repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Create the repository on GitHub:"
echo "   https://github.com/new"
echo "   Repository name: $REPO_NAME"
echo "   (Do NOT initialize with README, .gitignore, or license)"
echo ""
echo "2. Then run:"
echo "   git push -u origin $CURRENT_BRANCH"
echo ""
echo "Or if you have GitHub CLI (gh) installed:"
echo "   gh repo create $REPO_NAME --public --source=. --remote=origin --push"
echo "========================================="

