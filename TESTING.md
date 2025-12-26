# Testing the TurboVault Metadata Editor Extension

## Prerequisites

1. **Install DuckDB module** (optional but recommended):
   ```bash
   npm install duckdb
   ```
   
   Note: If the native module fails to build, the extension will show an error when trying to load metadata, but the UI will still open.

2. **Compile the extension**:
   ```bash
   npm run compile
   ```

## Test Database

A test database (`test_metadata.duckdb`) has been created in the project root with a sample table:
- Schema: `operations`
- Table: `flight_schedule`
- Columns: flight_id, carrier_code, flight_number, departure_airport, arrival_airport, departure_time, arrival_time, aircraft_type, load_date, record_source

## Testing Steps

1. **Open the extension in VS Code**:
   - Open the `metadata_frontend` folder in VS Code
   - Press `F5` or go to Run > Start Debugging
   - This will open a new "Extension Development Host" window

2. **Open the metadata editor**:
   - In the Extension Development Host window, open the command palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
   - Type "Open TurboVault Metadata Editor"
   - Select the command
   - OR right-click on a `.duckdb` file in the explorer and select "Open TurboVault Metadata Editor"

3. **Load metadata**:
   - When the editor opens, click "Load Metadata"
   - If DuckDB module is installed, it should load the table structure
   - If not installed, you'll see an error message

4. **Test the UI**:
   - Verify tables and columns are displayed
   - Test categorizing columns (select from dropdown or use checkboxes)
   - Test setting column order
   - Test saving metadata (creates `metadata.json` in workspace root)
   - Test exporting to CSV (selects output directory and creates CSV files)

## Testing with the Test Database

1. In the Extension Development Host window, open the command palette
2. Run "Open TurboVault Metadata Editor"
3. When prompted to select a database, navigate to `test_metadata.duckdb` in the project root
4. Click "Load Metadata"
5. You should see the `operations.flight_schedule` table with all its columns

## Expected Behavior

### If DuckDB is installed:
- Metadata loads successfully
- Tables and columns display correctly
- Can categorize columns
- Can save and export

### If DuckDB is NOT installed:
- Error message appears: "DuckDB module is not available"
- UI still opens but metadata loading fails
- Need to run `npm install duckdb` (may require build tools)

## Troubleshooting

1. **Extension doesn't activate**:
   - Check the Debug Console in VS Code for errors
   - Verify `package.json` has correct activation events
   - Make sure extension is compiled (`npm run compile`)

2. **Webview doesn't open**:
   - Check the Debug Console for errors
   - Verify HTML file exists at `media/editor.html`

3. **DuckDB errors**:
   - Check if `duckdb` module is installed: `npm list duckdb`
   - If missing, install with: `npm install duckdb`
   - May need Xcode Command Line Tools on macOS

4. **Database file not found**:
   - Verify the database file path is correct
   - Make sure the file has `.duckdb` extension
   - Check file permissions

