# Setting Up Remote Repository

## Steps to Create and Push to Remote Repository

### Option 1: Using GitHub CLI (if installed)

```bash
cd /Users/kjemac/GIT/metadata_frontend

# Initialize git if not already done
git init

# Add all files
git add .

# Commit (if not already committed)
git commit -m "Initial commit: TurboVault Metadata Editor VS Code Extension"

# Create repository on GitHub and push
gh repo create vscode_metadata_tool --public --source=. --remote=origin --push
```

### Option 2: Manual Setup (Recommended)

#### 1. Create Repository on GitHub
- Go to https://github.com/new
- Repository name: `vscode_metadata_tool`
- Choose public or private
- **Do NOT** initialize with README, .gitignore, or license (we already have these)
- Click "Create repository"

#### 2. Initialize and Push from Local

```bash
cd /Users/kjemac/GIT/metadata_frontend

# Initialize git if not already done
git init

# Add all files
git add .

# Commit (if not already committed)
git commit -m "Initial commit: TurboVault Metadata Editor VS Code Extension"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/vscode_metadata_tool.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/vscode_metadata_tool.git

# Push to remote
git branch -M main
git push -u origin main
```

### Option 3: If Repository Already Exists

If you already created the repository on GitHub, just add the remote and push:

```bash
cd /Users/kjemac/GIT/metadata_frontend

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/vscode_metadata_tool.git

# Check current branch name
git branch

# Push to remote (adjust branch name if needed)
git push -u origin main
```

## Verify

After pushing, verify with:
```bash
git remote -v
git log --oneline
```

## Notes

- Make sure you have Git configured with your username and email:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```

- If you need authentication, GitHub now requires Personal Access Tokens for HTTPS or SSH keys for SSH.

