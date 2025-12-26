# How to Start the Extension

## Quick Start

1. **Open the project in VS Code:**
   - Open VS Code
   - File → Open Folder
   - Navigate to: `/Users/kjemac/GIT/metadata_frontend`
   - Click "Open"

2. **Launch the Extension:**
   - Press `F5` (or Run → Start Debugging)
   - A new "Extension Development Host" window will open
   - The extension is now active in that new window

3. **Open the Metadata Editor:**
   - In the Extension Development Host window:
     - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
     - Type: "Open TurboVault Metadata Editor"
     - Select the command
     - Choose `test_metadata.duckdb` (or any `.duckdb` file)

## Alternative: From Command Line

If you have VS Code CLI installed:

```bash
cd /Users/kjemac/GIT/metadata_frontend
code .
```

Then press `F5` in VS Code.

## Using Terminal to Open VS Code

On macOS, you can add VS Code to PATH:

1. Open VS Code
2. Press `Cmd+Shift+P`
3. Type: "Shell Command: Install 'code' command in PATH"
4. Then run: `code /Users/kjemac/GIT/metadata_frontend`

## Troubleshooting

**Extension doesn't launch:**
- Check the Debug Console (View → Output → Debug Console)
- Verify compilation: `npm run compile`
- Check for errors in the terminal

**DuckDB module not found:**
- Install: `npm install duckdb`
- May require build tools (Xcode on macOS)

**Webview doesn't open:**
- Check Debug Console for errors
- Verify `media/editor.html` exists

