# TurboVault Metadata Editor - Features Documentation

## Overview

The TurboVault Metadata Editor is a VS Code extension that provides a visual interface for editing TurboVault metadata. It allows you to categorize columns, define business keys, hashkeys, hashdiffs, and export directly to CSV files from within VS Code.

## Key Features

### 1. Business Concept Categorization

Each table can be categorized with a business concept to help organize and identify the purpose of the table.

- **Business Concept Selector**: Located at the top of each table section
- **Predefined Concepts**: Includes common concepts like Customer, Order, Product, Supplier, Employee, Location
- **Add New Concepts**: Click the "+ Add New" button to create custom business concepts
- **Usage**: Select a concept from the dropdown to categorize your table
- **Impact**: Business concepts are used when generating hub names in CSV exports

### 2. Business Key Groups and Hashkeys

The editor supports a flexible business key management system that allows you to define multiple business key groups, each with its own hashkey name.

#### Business Key Groups

- **Multiple Groups**: You can create multiple business key groups for a single table
- **Named Hashkeys**: Each group has a named hashkey (e.g., `hk_customer`, `hk_order`)
- **Column Management**: 
  - Add columns to a group using the dropdown selector
  - Remove columns by clicking the × button on column tags
  - Columns can be shared across multiple groups
- **Manual Ordering**: The order of columns within a group is preserved and used for hash generation
- **Add/Remove Groups**: Use the "+ Add Group" button to create new business key groups

#### Hashkey Naming

- **Custom Names**: Each hashkey can be given a custom name
- **Default Pattern**: If not specified, hashkeys follow the pattern `hk_{table}_{index}`
- **Naming Convention**: Follow TurboVault conventions (e.g., `hk_customer`, `hk_order_line`)

### 3. Hashdiff Management

Hashdiffs are automatically configured with sensible defaults, but can be customized as needed.

#### Default Behavior

- **Auto-Inclusion**: By default, all columns are included in hashdiff except:
  - Record source columns
  - Load date columns
  - Business key columns
- **Default Naming**: Hashdiffs are automatically named using the pattern: `hd_{schema}_{table}_sat`
  - Example: For schema `operations` and table `flight_schedule`, the default name is `hd_operations_flight_schedule_sat`

#### Customization

- **Custom Names**: You can override the default hashdiff name for any column
- **Selective Inclusion**: Change the column type to control which columns are included in hashdiff calculations
- **Multiple Hashdiffs**: Different columns can have different hashdiff names if needed

### 4. Column Types

The editor supports the following column types:

- **Business Key**: Columns that uniquely identify business entities
- **Hashkey**: Named hash keys for business key groups
- **Hashdiff**: Columns used for change detection in satellites
- **Payload**: Regular data columns
- **Record Source**: Source system identifier column
- **Load Date**: Timestamp for when data was loaded

### 5. Keyboard Navigation

The interface is designed to be keyboard-friendly for efficient data entry.

#### Navigation Shortcuts

- **Tab / Shift+Tab**: Navigate between form fields in normal order
- **Arrow Up / Arrow Down**: Move between table rows quickly
- **Enter**: Activate/select the focused element

#### Visual Feedback

- **Focus Indicators**: Active fields are highlighted with a focus border
- **Row Highlighting**: The current row is visually highlighted when navigating

### 6. Metadata Management

#### Loading Metadata

- Click "Load Metadata" to fetch table structure from the DuckDB database
- The editor automatically detects all tables and columns
- Metadata is displayed in an organized, table-by-table view

#### Saving Metadata

- Click "Save Metadata" to save your work to a `metadata.json` file
- All configurations are preserved:
  - Business concepts
  - Business key groups
  - Hashkey names
  - Hashdiff names
  - Column types and ordering

#### Exporting to CSV

- Click "Export to CSV" to generate TurboVault CSV files
- The exporter creates four CSV files:
  - `source_data.csv`: Source system and table information
  - `standard_hub.csv`: Hub definitions with business keys
  - `standard_satellite.csv`: Satellite table definitions
  - `standard_link.csv`: Link table definitions (when applicable)
- Select an output directory when exporting

## Workflow Example

1. **Open Database**: Right-click on a `.duckdb` file and select "Open TurboVault Metadata Editor"
2. **Load Metadata**: Click "Load Metadata" to load table structures
3. **Categorize Table**: Select a business concept from the dropdown (e.g., "Customer")
4. **Define Business Keys**: 
   - Click "+ Add Business Key Group"
   - Name the hashkey (e.g., `hk_customer`)
   - Add columns to the group using the dropdown
   - Reorder columns as needed
5. **Configure Hashdiffs**: 
   - Review default hashdiff names
   - Customize if needed
   - Ensure correct columns are included
6. **Set Column Types**: Use the dropdown to set types for record source, load date, etc.
7. **Save or Export**: Save your work or export directly to CSV files

## Data Structure

### Business Key Groups

```typescript
{
  hashkeyName: "hk_customer",
  columns: ["customer_id", "customer_code"],
  order: 1
}
```

### Column Metadata

```typescript
{
  schema: "operations",
  table: "flight_schedule",
  column: "flight_id",
  type: "business_key",
  order: 1,
  hashkeyName: "hk_customer",
  businessKeyGroup: "hk_customer",
  hashdiffName: "hd_operations_flight_schedule_sat"
}
```

## Tips and Best Practices

1. **Business Concepts**: Use consistent naming for business concepts across related tables
2. **Hashkey Naming**: Follow TurboVault naming conventions (lowercase, underscores)
3. **Column Ordering**: Ensure business key columns are in the correct order for proper hashing
4. **Hashdiff Defaults**: Review auto-included columns to ensure they're appropriate for your use case
5. **Keyboard Navigation**: Use arrow keys for faster navigation when working with many columns
6. **Save Frequently**: Save your metadata regularly to avoid losing work

## Troubleshooting

- **Missing Columns**: If a column doesn't appear in the business key group dropdown, check that it's not already assigned to another group
- **Hashdiff Not Showing**: Ensure the column type is set to "hashdiff" for the hashdiff name input to appear
- **Export Errors**: Verify that business key groups are properly configured before exporting

