# Data Vault 2.1 Metadata Prep App

A VS Code extension for visually preparing Data Vault 2.1 metadata. This tool helps bridge the gap between raw database schemas and Data Vault 2.1 implementation by providing an intuitive interface for defining business concepts, hashkeys, links, and satellites.

## Overview

![Main Interface](docs/screenshots/main-interface.png)
*Main interface showing table metadata, hashkey management, and satellite configuration*

This tool addresses a key challenge in Data Vault 2.1 implementation: creating and maintaining consistent metadata across multiple files while ensuring proper naming conventions and column ordering. It provides a visual interface that enforces Data Vault 2.1 standards and helps prevent common errors.

## Why This Tool Exists

### The dbt Ecosystem Gap

While dbt is excellent for data transformation, it has some limitations when working with Data Vault 2.1:

- **No Visual Interface for Multiple Files**: dbt requires creating and editing multiple YAML files manually, which can be error-prone
- **YAML Editing Challenges**: Maintaining consistency across multiple YAML files is difficult, especially for complex Data Vault structures
- **No Built-in Data Vault Support**: dbt Core doesn't have native Data Vault 2.1 modeling capabilities
- **Naming Convention Enforcement**: Ensuring consistent hashkey naming and column ordering across multiple source tables requires manual discipline

**This Tool Addresses These Gaps**:
- ✅ Visual interface for creating and managing Data Vault metadata
- ✅ Automatic enforcement of naming conventions (e.g., `hk_customer_h`, `hd_customer_table_sat`)
- ✅ Ensures correct column ordering for hashkeys (critical for consistent hashing)
- ✅ Reuses previously created hashkeys and artifacts when creating new ones
- ✅ Exports to standard CSV formats that can be used with dbt macros or other tools
- ✅ Works seamlessly within VS Code alongside your dbt projects

### Comparison with Other Tools

#### vs. Coalesce.io

**Coalesce.io Strengths**:
- Excellent tabular editing interface
- Good visual representation of Data Vault structures
- Integrated with dbt Cloud

**Coalesce.io Limitations**:
- Doesn't utilize previously created hashkeys or artifacts when creating new ones
- Requires manual re-entry of hashkey information, making it error-prone
- Limited to their platform ecosystem

**This Tool's Approach**:
- Automatically suggests and reuses existing hashkeys when creating satellites or links
- Global hashkey view ensures consistency across all tables
- Platform-agnostic - works with any Data Vault 2.1 implementation
- Exports standard formats that work with dbt, dbtvault, or custom implementations

#### vs. Manual YAML/CSV Editing

**Manual Editing Challenges**:
- Easy to make typos in hashkey names
- Difficult to maintain consistent column ordering
- Hard to see relationships across multiple files
- No validation of naming conventions

**This Tool's Benefits**:
- Automatic naming based on business concepts
- Visual drag-and-drop for column ordering
- Global view of all hashkeys for consistency checking
- Built-in validation and error prevention

## Key Features

### 1. Business Concept Management

![Business Concepts](docs/screenshots/business-concepts.png)
*Select business concepts to automatically generate hashkey names*

- **Automatic Hashkey Naming**: Select a business concept (e.g., "Customer") and hashkeys are automatically named `hk_customer_h`
- **Concept-Based Organization**: Group related tables by business concept
- **Cross-Table Consistency**: See all hashkeys for a concept across all tables
- **Add New Concepts**: Easily add new business concepts as needed

### 2. Hub Hashkey Management

![Hub Hashkeys](docs/screenshots/hub-hashkeys.png)
*Create and manage hub hashkeys with drag-and-drop column ordering*

- **Multiple Hashkeys per Table**: Support for multiple business key groups
- **Manual Column Ordering**: Drag-and-drop or use up/down buttons to ensure correct hashing order (critical for Data Vault)
- **Column Reuse**: Same column can be used in multiple hashkey groups
- **Automatic Naming**: Hashkey names follow Data Vault 2.1 conventions (`hk_{concept}_h`)

### 3. Link Hashkey Management

![Link Hashkeys](docs/screenshots/link-hashkeys.png)
*Create links between hubs using existing hashkeys*

- **Visual Link Creation**: Create links between hubs using existing hashkeys
- **Default Naming**: Link hashkeys automatically named as `<Entity>_<Entity>` (e.g., `Customer_Order`)
- **Reference Management**: Select which hashkeys to link from a dropdown of all available hashkeys
- **Automatic Column Mapping**: Columns are automatically mapped from referenced hashkeys

### 4. Satellite Configuration

![Satellites](docs/screenshots/satellites.png)
*Configure satellites with business concept selection and flexible column selection*

- **Business Concept Selection**: Select a business concept - the hashkey is automatically determined (one hashkey per concept)
- **Multiple Hashdiffs**: Create multiple hashdiffs per table
- **Flexible Selection Modes**:
  - **Select All (Exclude)**: Include all columns except specified exclusions (default)
  - **Select Explicit**: Manually choose which columns to include
- **Automatic Satellite Creation**: Satellites are automatically created based on hashdiffs
- **Automatic Naming**: Satellite names follow pattern `hd_{concept}_{table}_sat`

### 5. Global Hashkey View

![Global Hashkey View](docs/screenshots/global-hashkey-view.png)
*View and manage all hashkeys across all tables in one place*

- **Cross-Table Visibility**: See all hashkeys across all tables in one view
- **Consistency Checking**: Compare hashkeys across tables to ensure correct mapping
- **Column Management**: Edit main column names and apply to all sources
- **Alphabetical Sorting**: Sort hashkeys alphabetically for easier comparison

### 6. Export Formats

#### Standard Data Vault 2.1 Format
- `source_data.csv`: Source system and table information
- `standard_hub.csv`: Hub definitions with business keys
- `standard_satellite.csv`: Satellite table definitions (auto-created from hashdiffs)
- `standard_link.csv`: Link table definitions

These formats are compatible with:
- dbtvault macros
- Custom dbt implementations
- Other Data Vault 2.1 tools

### 7. DuckDB Integration

- **Schema Introspection**: Automatically reads table structures from DuckDB
- **Direct Database Access**: Works with any DuckDB file
- **Right-Click Integration**: Right-click any `.duckdb` file in VS Code to open the metadata editor

## Requirements

- VS Code 1.80.0 or higher
- Node.js 20 or higher
- DuckDB database files (`.duckdb`)

## Installation

1. Clone this repository
2. Run `npm install`
3. Press `F5` to open a new window with the extension loaded

## Usage

### Getting Started

1. **Open Database**: Right-click on a `.duckdb` file in VS Code explorer and select "Open Data Vault 2.1 Metadata Prep App"

2. **Load Metadata**: Click "Load Metadata" to load table structures from the database

3. **Configure Hubs**:
   - Click "+ Add Hub" in the "Hubs / Business Concepts" section
   - Select a business concept (or add a new one)
   - Hashkey name is automatically generated as `hk_{concept}_h`
   - Add columns to the hashkey group
   - Reorder columns using drag-and-drop or up/down buttons (order matters for hashing!)

4. **Configure Links** (if needed):
   - Click "+ Add Link" in the "Links / Relationships" section
   - Select hub hashkeys to link
   - Link name is automatically suggested based on selected entities

5. **Configure Satellites**:
   - Click "+ Add Satellite" in the "Satellites / Descriptive Data" section
   - Select a business concept (hashkey is auto-selected)
   - Satellite name is automatically generated as `hd_{concept}_{table}_sat`
   - Choose selection mode: "Select All (exclude)" or "Select Explicit Columns"
   - Configure which columns to include/exclude

6. **Set Technical Columns**: Select Record Source and Load Date columns from dropdowns

7. **Validate**: Use "Global Hashkey View" to verify consistency across tables

8. **Export**: 
   - Click "Export to CSV" to generate standard Data Vault 2.1 CSV files
   - Files are saved in your workspace directory

### Workflow Example

1. Open your source database (e.g., `source_data.duckdb`)
2. Load metadata to see all tables and columns
3. For each source table:
   - Create hub hashkey groups by selecting business concepts
   - Add business key columns to hashkey groups
   - Reorder columns to ensure correct hashing order
   - Create satellites and assign them to concepts
   - Set record source and load date columns
4. Use "Global Hashkey View" to verify consistency across tables
5. Export to CSV format
6. Use exported metadata to generate dbt models or load into your Data Vault tool

## Data Structure

### Hashkey Groups (Hubs)
```javascript
{
  hashkeyName: "hk_customer_h",  // Auto-generated from concept
  businessConcept: "Customer",
  columns: ["customer_id", "customer_code"],
  order: 1,
  isLink: false
}
```

### Link Hashkeys
```javascript
{
  hashkeyName: "Customer_Order",  // Auto-generated from entities
  isLink: true,
  referencedHashkeys: ["hk_customer_h", "hk_order_h"]
}
```

### Hashdiff Groups (Satellites)
```javascript
{
  name: "hd_customer_customer_data_sat",  // Auto-generated: hd_{concept}_{table}_sat
  concept: "Customer",  // Business concept (required)
  hashkey: "hk_customer_h",  // Auto-selected based on concept
  mode: "select_all",  // or "select_explicit"
  excludedColumns: ["record_source", "load_date"],
  includedColumns: []  // Used when mode is "select_explicit"
}
```

## Known Issues and Limitations

### Current Issues

1. **Satellite Export**: Satellites may not export correctly if the hashkey isn't properly set. Ensure you select a business concept for each satellite - the hashkey will be auto-selected.

2. **Save Metadata**: The "Save Metadata" button may fail silently if there's an error. Check the VS Code Developer Console (Help → Toggle Developer Tools) for error messages.

3. **Hashkey Auto-Selection**: When creating a satellite, the hashkey is automatically selected based on the business concept. If no hashkey exists for that concept, the satellite won't export. Ensure you create the hub hashkey first.

### Workarounds

- Always create hub hashkeys before creating satellites
- Use the "Global Hashkey View" to verify all hashkeys are properly configured
- Check the browser console (F12) if buttons don't respond
- Ensure business concepts are spelled consistently across tables

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

## Contributing

Contributions are welcome! Please see `DEVELOPMENT_ISSUES.md` for information about common development issues and how to avoid them.

## License

MIT

## Screenshots

*Note: Screenshots should be placed in `docs/screenshots/` directory. The following are placeholder descriptions:*

- `main-interface.png`: Main interface showing table list, hashkey management, and satellite configuration
- `business-concepts.png`: Business concept selector with auto-generated hashkey names
- `hub-hashkeys.png`: Hub hashkey management with drag-and-drop column ordering
- `link-hashkeys.png`: Link hashkey creation interface
- `satellites.png`: Satellite configuration with business concept selection
- `global-hashkey-view.png`: Global view of all hashkeys across tables

To add screenshots:
1. Take screenshots of the application in use
2. Save them in `docs/screenshots/` directory
3. Update the image paths in this README if needed
