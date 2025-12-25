# TurboVault Metadata Editor

A VS Code extension for visually editing TurboVault metadata. Instead of manually editing Excel files, you can now categorize columns, set business keys, hashkeys, hashdiffs, and export directly to CSV files from within VS Code.

## Features

- 📊 Read table metadata from DuckDB databases
- 🎯 Categorize columns (business keys, hashkeys, hashdiffs)
- 📝 Set column ordering
- 💾 Save metadata to JSON
- 📤 Export to TurboVault CSV format (standard_hub, standard_link, standard_satellite, source_data)

## Requirements

- VS Code 1.80.0 or higher
- Node.js 20 or higher

## Installation

1. Clone this repository
2. Run `npm install`
3. Press F5 to open a new window with the extension loaded

## Usage

1. Open a DuckDB database file (`.duckdb`) or right-click on it in the explorer
2. Click "Open TurboVault Metadata Editor" or use the command palette
3. Click "Load Metadata" to load table information from the database
4. Categorize your columns:
   - Set business keys
   - Set hashkeys
   - Set hashdiffs
   - Set column ordering
5. Save your work or export directly to CSV files

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Run tests
npm test
```

## License

MIT

