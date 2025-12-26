# Launch Extension in Cursor

## Quick Launch Steps

1. **Make sure the project is open in Cursor**
   - The folder `/Users/kjemac/GIT/metadata_frontend` should be open in Cursor

2. **Compile the extension** (if not already compiled):
   - Open Terminal in Cursor (`Ctrl+`` or View → Terminal)
   - Run: `npm run compile`

3. **Launch the Extension Development Host:**
   - Press `F5` (or go to Run → Start Debugging)
   - Or click the "Run and Debug" icon in the sidebar, then click "Run Extension"
   - This will open a new Cursor/VS Code window labeled "[Extension Development Host]"

4. **Open the Metadata Editor in the Extension Development Host:**
   - In the new window, press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type: "Open TurboVault Metadata Editor"
   - Select the command
   - When prompted, select `test_metadata.duckdb` file

## Using the Debug Panel

1. Click the "Run and Debug" icon in the left sidebar (or press `Cmd+Shift+D`)
2. Select "Run Extension" from the dropdown at the top
3. Click the green play button (or press `F5`)

## Troubleshooting

**If F5 doesn't work:**
- Check if you're in the correct folder
- Verify `package.json` and `.vscode/launch.json` exist
- Try: Run → Start Debugging from the menu

**If the extension doesn't activate:**
- Check the Debug Console (View → Output → Debug Console)
- Look for error messages
- Verify compilation: `npm run compile`

**If you see "DuckDB module not available":**
- Install: `npm install duckdb`
- May require build tools

