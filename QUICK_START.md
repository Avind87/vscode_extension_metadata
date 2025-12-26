# Quick Start Guide

## Project Location
The project has been moved to: `/Users/kjemac/GIT/metadata_frontend`

## Testing the Extension

### 1. Open in VS Code
```bash
cd /Users/kjemac/GIT/metadata_frontend
code .
```

### 2. Install Dependencies (if needed)
```bash
npm install
```

### 3. Compile TypeScript
```bash
npm run compile
```

### 4. Launch Extension
- Press `F5` in VS Code
- A new "Extension Development Host" window will open
- The extension is now active in that window

### 5. Open Metadata Editor
In the Extension Development Host window:
- Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
- Type: "Open TurboVault Metadata Editor"
- Select the command
- Choose `test_metadata.duckdb` when prompted (or any `.duckdb` file)

### 6. Test Features
1. Click "Load Metadata" to load table structure
2. Categorize columns using dropdowns/checkboxes
3. Set column order
4. Save metadata or export to CSV

## Test Database
A test database (`test_metadata.duckdb`) is included with:
- Schema: `operations`
- Table: `flight_schedule`
- 10 sample columns

## Troubleshooting

**If DuckDB module error appears:**
- Run: `npm install duckdb`
- May require build tools (Xcode on macOS)

**If extension doesn't activate:**
- Check Debug Console in VS Code
- Verify compilation: `npm run compile`
- Check `package.json` activation events

