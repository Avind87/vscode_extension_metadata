# Data Vault 2.1 Metadata Prep App

A VS Code extension for visually preparing Data Vault 2.1 metadata. This tool bridges the gap between raw database schemas and Data Vault 2.1 implementation by providing an intuitive interface for defining business concepts, hashkeys, links, and satellites.

## Why This Tool Exists

### The Problem with Current Solutions

**Commercial Tools (Coalesce, dbtvault, etc.)**:
- Require manual Excel/CSV editing for metadata preparation
- Lack visual interfaces for complex Data Vault relationships
- Make it difficult to see and manage hashkeys across multiple tables
- Don't provide easy ways to compare and validate hashkey consistency

**dbt Ecosystem Gaps**:
- dbt Core doesn't have built-in Data Vault 2.1 modeling support
- dbtvault requires extensive YAML configuration that's error-prone
- No visual way to map source tables to Data Vault structures
- Difficult to manage business concepts and their relationships across projects

**This Tool Bridges These Gaps**:
- ✅ Visual interface for metadata preparation (no Excel needed)
- ✅ Automatic hashkey naming based on business concepts
- ✅ Global hashkey view to ensure consistency across tables
- ✅ Direct export to Data Vault 2.1 CSV formats
- ✅ Integration with DuckDB for schema introspection
- ✅ Works seamlessly within VS Code alongside your dbt projects

## Key Features

### 1. Business Concept Management
- **Automatic Hashkey Naming**: Select a business concept (e.g., "Customer") and hashkeys are automatically named `hk_customer_h`
- **Concept-Based Organization**: Group related tables by business concept
- **Cross-Table Consistency**: See all hashkeys for a concept across all tables

### 2. Hub Hashkey Management
- **Multiple Hashkeys per Table**: Support for multiple business key groups
- **Manual Column Ordering**: Drag-and-drop or use up/down buttons to ensure correct hashing order
- **Column Reuse**: Same column can be used in multiple hashkey groups
- **Automatic Naming**: Hashkey names follow Data Vault 2.1 conventions

### 3. Link Hashkey Management
- **Visual Link Creation**: Create links between hubs using existing hashkeys
- **Default Naming**: Link hashkeys automatically named as `<Entity>_<Entity>` (e.g., `Customer_Order`)
- **Reference Management**: Select which hashkeys to link from a dropdown of all available hashkeys

### 4. Hashdiff Configuration
- **Multiple Hashdiffs**: Create multiple hashdiffs per table
- **Flexible Selection Modes**:
  - **Select All (Exclude)**: Include all columns except specified exclusions
  - **Select Explicit**: Manually choose which columns to include
- **Concept/Hashkey Assignment**: Each hashdiff can be assigned to a specific business concept and hashkey
- **Automatic Satellite Creation**: Satellites are automatically created based on hashdiffs (no checkbox needed)

### 5. Global Hashkey View
- **Cross-Table Visibility**: See all hashkeys across all tables in one view
- **Consistency Checking**: Compare hashkeys across tables to ensure correct mapping
- **Column Management**: Edit main column names and apply to all sources
- **Alphabetical Sorting**: Sort hashkeys alphabetically for easier comparison

### 6. Export Formats

#### Legacy Format (Standard TurboVault)
- `source_data.csv`: Source system and table information
- `standard_hub.csv`: Hub definitions with business keys
- `standard_satellite.csv`: Satellite table definitions (auto-created from hashdiffs)
- `standard_link.csv`: Link table definitions

#### New Format (information_schema style)
- Single CSV file following `information_schema.columns` structure
- Includes all metadata as additional columns (array style)
- Suitable for generating raw vault directly
- Can be browsed in DuckDB for validation

### 7. DuckDB Integration
- **Schema Introspection**: Automatically reads table structures from DuckDB
- **Metadata Browsing**: Export metadata to DuckDB format for validation
- **Direct Database Access**: Works with any DuckDB file

## Comparison to Commercial Products

### vs. Coalesce.io
- **Coalesce**: Requires manual configuration in their UI, limited to their platform
- **This Tool**: Works with any Data Vault 2.1 implementation, exports standard formats
- **Advantage**: Platform-agnostic, works with dbt, dbtvault, or any Data Vault tool

### vs. dbtvault
- **dbtvault**: Requires extensive YAML configuration, no visual interface
- **This Tool**: Visual interface for metadata preparation, then export to your preferred format
- **Advantage**: Easier to understand relationships, less error-prone configuration

### vs. Manual Excel/CSV Editing
- **Excel**: Error-prone, no validation, difficult to maintain
- **This Tool**: Visual interface, automatic naming, consistency checks
- **Advantage**: Faster, more accurate, easier to maintain

## How It Bridges dbt Gaps

### 1. Visual Data Vault Modeling
dbt Core has no built-in Data Vault support. This tool provides:
- Visual interface for defining Data Vault structures
- Export to formats compatible with dbtvault or custom macros
- Integration with dbt projects (works in same workspace)

### 2. Business Concept Management
dbt doesn't have a concept of "business concepts" for Data Vault:
- This tool manages business concepts and automatically generates hashkey names
- Ensures consistency across related tables
- Makes it easy to see which tables belong to which business entities

### 3. Hashkey Consistency
Managing hashkeys across multiple source tables is error-prone in dbt:
- Global hashkey view shows all hashkeys across all tables
- Compare and validate hashkey column mappings
- Apply consistent column names to all sources

### 4. Link Management
Creating links between hubs requires careful coordination:
- Visual interface for creating links
- Dropdown selection of existing hashkeys
- Automatic naming conventions

### 5. Satellite Configuration
Satellites require careful column selection and hashdiff configuration:
- Multiple hashdiffs per table
- Flexible column selection (select all with exclusions or explicit)
- Automatic satellite creation based on hashdiffs
- Concept/hashkey assignment for proper hub relationships

## Requirements

- VS Code 1.80.0 or higher
- Node.js 20 or higher
- DuckDB database files (`.duckdb`)

## Installation

1. Clone this repository
2. Run `npm install`
3. Press F5 to open a new window with the extension loaded

## Usage

1. **Open Database**: Right-click on a `.duckdb` file in VS Code explorer and select "Open Data Vault 2.1 Metadata Prep App"
2. **Load Metadata**: Click "Load Metadata" to load table structures from the database
3. **Configure Hashkeys**:
   - Click "+ Add Hashkey" or "+ Add Link Hashkey"
   - Select a business concept (or add a new one)
   - Hashkey name is automatically generated as `hk_{concept}_h`
   - Add columns to the hashkey group
   - Reorder columns using drag-and-drop or up/down buttons
4. **Configure Hashdiffs**:
   - Click "+ Add Hashdiff"
   - Select a business concept and hashkey (from the hashkeys you created)
   - Choose selection mode: "Select All (exclude)" or "Select Explicit Columns"
   - Configure which columns to include/exclude
5. **Set Technical Columns**: Select Record Source and Load Date columns
6. **Export**: 
   - "Export to CSV (Legacy)" for standard TurboVault format
   - "Export to CSV (New Format)" for information_schema style format
   - "Browse in DuckDB" to view metadata in DuckDB format

## Workflow Example

1. Open your source database (e.g., `source_data.duckdb`)
2. Load metadata to see all tables and columns
3. For each source table:
   - Create hashkey groups by selecting business concepts
   - Add business key columns to hashkey groups
   - Create hashdiffs and assign them to concepts/hashkeys
   - Set record source and load date columns
4. Use "Global Hashkey View" to verify consistency across tables
5. Export to CSV format compatible with your Data Vault implementation
6. Use exported metadata to generate dbt models or load into your Data Vault tool

## Data Structure

### Hashkey Groups
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

### Hashdiff Groups
```javascript
{
  name: "hd_operations_flight_schedule_sat",
  concept: "Flight",
  hashkey: "hk_flight_h",
  mode: "select_all",  // or "select_explicit"
  excludedColumns: ["record_source", "load_date"],
  includedColumns: []  // Used when mode is "select_explicit"
}
```

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

## License

MIT
