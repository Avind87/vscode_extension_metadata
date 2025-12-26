# Data Vault 2.1 Metadata Prep App

A VS Code extension for visually preparing Data Vault 2.1 metadata. Instead of manually editing Excel files, you can now categorize columns, set business keys, hashkeys, hashdiffs, and export directly to CSV files from within VS Code.

## Features

- 📊 Read table metadata from DuckDB databases
- 🎯 Categorize columns using business concepts
- 🔑 Define business key groups with automatic hashkey naming (`hk_{concept}_h`)
- 🔗 Create link hashkeys for relationships between hubs
- 📝 Configure hashdiffs with flexible selection modes (select all with exclusions or explicit selection)
- 💾 Save metadata to JSON
- 📤 Export to Data Vault 2.1 CSV format (standard_hub, standard_link, standard_satellite, source_data)
- 🌐 Global hashkey view to see all hashkeys across tables
- ⌨️ Keyboard-friendly interface

## Requirements

- VS Code 1.80.0 or higher
- Node.js 20 or higher

## Installation

1. Clone this repository
2. Run `npm install`
3. Press F5 to open a new window with the extension loaded

## Usage

1. Open a DuckDB database file (`.duckdb`) or right-click on it in the explorer
2. Click "Open Data Vault 2.1 Metadata Prep App" or use the command palette
3. Click "Load Metadata" to load table information from the database
4. Configure your metadata:
   - Select or add business concepts
   - Create hashkey groups by selecting business concepts (names auto-generated as `hk_{concept}_h`)
   - Add columns to hashkey groups
   - Configure hashdiffs (select all with exclusions or explicit selection)
   - Set record source and load date columns
   - Optionally enable satellite creation
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
