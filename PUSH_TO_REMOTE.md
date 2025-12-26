# Push to Remote Repository

## Quick Setup

### Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `vscode_metadata_tool`
3. Choose **public** or **private**
4. **Important:** Do NOT initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

### Step 2: Run Setup Script

```bash
cd /Users/kjemac/GIT/metadata_frontend
chmod +x setup_remote.sh
./setup_remote.sh YOUR_GITHUB_USERNAME
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username (e.g., `Avind87`).

### Step 3: Push to Remote

After the script completes, push to GitHub:

```bash
git push -u origin main
```

## Alternative: Manual Setup

If you prefer to do it manually:

```bash
cd /Users/kjemac/GIT/metadata_frontend

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: TurboVault Metadata Editor VS Code Extension"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/vscode_metadata_tool.git

# Set branch to main
git branch -M main

# Push
git push -u origin main
```

## Using GitHub CLI (if installed)

If you have GitHub CLI installed, you can create and push in one command:

```bash
cd /Users/kjemac/GIT/metadata_frontend
gh repo create vscode_metadata_tool --public --source=. --remote=origin --push
```

## Verify

After pushing, verify the remote is set up correctly:

```bash
git remote -v
git log --oneline -5
```

## Troubleshooting

**If you get authentication errors:**
- GitHub requires Personal Access Tokens for HTTPS
- Or use SSH: `git remote set-url origin git@github.com:YOUR_USERNAME/vscode_metadata_tool.git`

**If remote already exists:**
- Update URL: `git remote set-url origin https://github.com/YOUR_USERNAME/vscode_metadata_tool.git`

**If branch name is different:**
- Rename: `git branch -M main`
- Or push specific branch: `git push -u origin your-branch-name`

