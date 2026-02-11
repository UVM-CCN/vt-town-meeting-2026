#!/bin/bash

# Vermont Town Meeting Results - GitHub Pages Deploy Script
# This script builds and deploys the website to GitHub Pages

set -e  # Exit on error

echo "🚀 Starting deployment to GitHub Pages..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="${REPO_URL:=$(git config --get remote.origin.url)}"
BRANCH_NAME="gh-pages"
TEMP_DIR=$(mktemp -d)

echo -e "${BLUE}Repository: ${REPO_URL}${NC}"
echo -e "${BLUE}Target Branch: ${BRANCH_NAME}${NC}"

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}⚠️  Git repository not found. Initializing...${NC}"
    git init
fi

# Check if gh-pages remote exists, if not add it
if ! git remote | grep -q origin; then
    echo -e "${YELLOW}⚠️  Remote 'origin' not found. Adding...${NC}"
    git remote add origin "$REPO_URL"
fi

# Fetch the latest changes
echo -e "${BLUE}📥 Fetching latest changes...${NC}"
git fetch origin || true

# Create or checkout gh-pages branch
if git rev-parse --verify origin/"$BRANCH_NAME" >/dev/null 2>&1; then
    echo -e "${BLUE}📦 Checking out existing ${BRANCH_NAME} branch...${NC}"
    git checkout -b "$BRANCH_NAME" "origin/$BRANCH_NAME" || git checkout "$BRANCH_NAME"
else
    echo -e "${BLUE}📦 Creating new ${BRANCH_NAME} branch...${NC}"
    git checkout --orphan "$BRANCH_NAME"
    git rm -rf . || true
fi

# Copy files to temp directory
echo -e "${BLUE}📋 Preparing files...${NC}"
cp index.html "$TEMP_DIR/"
cp styles.css "$TEMP_DIR/"
cp script.js "$TEMP_DIR/"
cp vermont-towns.geojson "$TEMP_DIR/"
cp README.md "$TEMP_DIR/" || true
cp LICENSE "$TEMP_DIR/" || true

# Clear current branch content
git rm -rf . || true

# Copy prepared files to repo
cp "$TEMP_DIR"/* .

# Create .nojekyll to bypass Jekyll processing
echo -e "${BLUE}🔧 Creating .nojekyll...${NC}"
touch .nojekyll

# Add all files
echo -e "${BLUE}➕ Adding files to git...${NC}"
git add .

# Commit
COMMIT_MESSAGE="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${BLUE}📝 Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE" || true

# Push to GitHub
echo -e "${BLUE}📤 Pushing to ${BRANCH_NAME} branch...${NC}"
git push origin "$BRANCH_NAME" --force

# Return to main branch
echo -e "${BLUE}🔄 Returning to main branch...${NC}"
git checkout main || git checkout master || true

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}Your site is now available at:${NC}"
echo "https://$(git config --get remote.origin.url | sed 's/.*:\(.*\)\/\(.*\)\.git$/\1.github.io\/\2/')"
echo ""
echo -e "${YELLOW}Note: It may take a few minutes for changes to appear.${NC}"
