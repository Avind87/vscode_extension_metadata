# Developer Guide

This guide explains the architecture, technologies, and code structure of the Data Vault 2.1 Metadata Prep App. Use this guide to understand how the extension works and how to make changes.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technologies and Libraries](#technologies-and-libraries)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [How to Make Common Changes](#how-to-make-common-changes)
7. [Development Workflow](#development-workflow)

## Architecture Overview

This VS Code extension follows a **webview-based architecture**:

```
VS Code Extension (TypeScript)
    ↓
Extension Host Process
    ↓
Webview Panel (HTML + JavaScript)
    ↓
Message Passing (vscode.postMessage)
    ↓
Backend Services (DuckDB, CSV Export)
```

### Key Concepts

1. **Extension Entry Point** (`src/extension.ts`): Registers commands and activates the extension
2. **Webview Panel** (`src/webview/metadataEditorPanel.ts`): Manages the webview panel and handles communication
3. **Frontend UI** (`media/editor.html`): HTML/CSS/JavaScript interface that users interact with
4. **Backend Services**:
   - `duckdbService.ts`: Handles DuckDB database operations
   - `csvExporter.ts`: Converts metadata to CSV formats
5. **Message Passing**: Two-way communication between webview and extension using `vscode.postMessage()`

## Technologies and Libraries

### Core Technologies

- **TypeScript**: Primary language for extension code
- **Node.js**: Runtime environment (requires Node.js 20+)
- **VS Code Extension API**: `@types/vscode` - VS Code extension development SDK
- **HTML/CSS/JavaScript**: For the webview UI (no frameworks - vanilla JS)

### Key Dependencies

#### Production Dependencies

- **`duckdb` (v1.4.3)**: Native Node.js module for DuckDB database access
  - Used to read table schemas from DuckDB files
  - Provides SQL query interface to DuckDB databases

#### Development Dependencies

- **`typescript` (v5.9.3)**: TypeScript compiler
- **`@types/vscode` (v1.107.0)**: TypeScript definitions for VS Code API
- **`@types/node` (v20.19.27)**: TypeScript definitions for Node.js
- **`eslint`**: Code linting (optional, configured but not enforced)

### Why These Technologies?

- **TypeScript**: Provides type safety and better IDE support
- **Vanilla JavaScript in HTML**: No build step needed for webview, simpler deployment
- **DuckDB**: Lightweight, file-based database perfect for metadata storage
- **VS Code Extension API**: Standard way to extend VS Code functionality

## Project Structure

```
metadata_frontend/
├── src/
│   ├── extension.ts              # Extension entry point, command registration
│   ├── types/
│   │   └── duckdb.d.ts          # TypeScript definitions for DuckDB
│   └── webview/
│       ├── metadataEditorPanel.ts  # Webview panel manager
│       ├── duckdbService.ts       # DuckDB database operations
│       └── csvExporter.ts         # CSV export logic
├── media/
│   └── editor.html              # Webview UI (HTML + CSS + JavaScript)
├── out/                         # Compiled JavaScript (generated)
├── package.json                 # Extension manifest, dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # User documentation
```

### File Responsibilities

- **`src/extension.ts`**: 
  - Extension activation
  - Command registration (`metadata-frontend.openEditor`)
  - Context menu integration
  
- **`src/webview/metadataEditorPanel.ts`**:
  - Creates and manages webview panel
  - Handles messages from webview
  - Orchestrates data loading, saving, and exporting
  - Converts data between webview format and backend format

- **`src/webview/duckdbService.ts`**:
  - Opens DuckDB database connections
  - Queries `information_schema.columns` for table metadata
  - Returns structured table/column information

- **`src/webview/csvExporter.ts`**:
  - Defines TypeScript interfaces for metadata structures
  - Converts metadata to CSV formats:
    - `source_data.csv`
    - `standard_hub.csv`
    - `standard_satellite.csv`
    - `standard_link.csv`

- **`media/editor.html`**:
  - Complete UI implementation (HTML + CSS + JavaScript)
  - User interactions (buttons, forms, drag-and-drop)
  - Data collection and validation
  - Message sending to extension backend

## Core Components

### 1. Extension Entry Point (`extension.ts`)

**Purpose**: Registers the extension with VS Code and handles command execution.

**Key Code**:
```typescript
export function activate(context: vscode.ExtensionContext) {
    // Register command that opens the metadata editor
    const openEditorCommand = vscode.commands.registerCommand(
        'metadata-frontend.openEditor', 
        async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
            // Handle URI from context menu or file picker
            // Create or show the metadata editor panel
            MetadataEditorPanel.createOrShow(extensionUri, dbPath);
        }
    );
    context.subscriptions.push(openEditorCommand);
}
```

**What to Edit**:
- Command registration
- Context menu configuration (in `package.json`)
- Initial setup logic

### 2. Webview Panel Manager (`metadataEditorPanel.ts`)

**Purpose**: Manages the webview panel lifecycle and handles communication.

**Key Responsibilities**:
- Creates webview panel with HTML content
- Listens for messages from webview
- Sends messages to webview
- Orchestrates data operations (load, save, export)

**Message Handling Pattern**:
```typescript
this._panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.command) {
        case 'loadMetadata':
            await this._loadMetadata();
            break;
        case 'saveMetadata':
            await this._saveMetadata(message.data);
            break;
        case 'exportCSV':
            await this._exportCSV(message.data);
            break;
    }
});
```

**Key Methods**:
- `_loadMetadata()`: Loads table metadata from DuckDB
- `_saveMetadata(data)`: Saves metadata to JSON file
- `_exportCSV(data)`: Exports metadata to CSV files
- `_convertToTableMetadata(data)`: Converts webview data format to backend format
- `_getHtmlForWebview()`: Generates HTML with embedded database path

**What to Edit**:
- Message handling logic
- Data conversion between formats
- File save/export operations
- Error handling

### 3. DuckDB Service (`duckdbService.ts`)

**Purpose**: Provides interface to DuckDB databases.

**Key Code**:
```typescript
async getTableMetadata(): Promise<TableMetadata[]> {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT table_schema, table_name, column_name, 
                   ordinal_position, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name, ordinal_position
        `;
        this.connection.all(query, (err: any, rows: any[]) => {
            // Process rows into TableMetadata format
        });
    });
}
```

**What to Edit**:
- SQL queries for metadata extraction
- Data type mapping
- Schema filtering logic

### 4. CSV Exporter (`csvExporter.ts`)

**Purpose**: Converts metadata structures to Data Vault 2.1 CSV formats.

**Key Interfaces**:
```typescript
interface BusinessKeyGroup {
    hashkeyName: string;
    businessConcept?: string;
    columns: string[];
    order: number;
    isLink?: boolean;
    referencedHashkeys?: string[];
}

interface TableMetadata {
    schema: string;
    table: string;
    businessKeyGroups?: BusinessKeyGroup[];
    hashdiffGroups?: any[];
    columns: ColumnMetadata[];
}
```

**Key Methods**:
- `exportSourceData()`: Creates source_data.csv
- `exportStandardHub()`: Creates standard_hub.csv
- `exportStandardSatellite()`: Creates standard_satellite.csv
- `exportStandardLink()`: Creates standard_link.csv

**What to Edit**:
- CSV format definitions
- Column mapping logic
- Data transformation rules

### 5. Webview UI (`editor.html`)

**Purpose**: Provides the user interface.

**Structure**:
- **HTML**: Structure and layout
- **CSS**: Styling (uses VS Code CSS variables for theming)
- **JavaScript**: All interactive logic (inline in `<script>` tag)

**Key JavaScript Patterns**:

1. **Message Sending to Extension**:
```javascript
vscode.postMessage({ 
    command: 'loadMetadata' 
});
```

2. **Message Receiving from Extension**:
```javascript
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'metadataLoaded':
            displayMetadata(message.data);
            break;
    }
});
```

3. **Data Collection**:
```javascript
function collectMetadata() {
    const tables = [];
    // Collect data from DOM
    // Return structured object
    return { tables, timestamp: new Date().toISOString() };
}
```

**What to Edit**:
- UI layout and styling
- User interaction handlers
- Data collection logic
- Form validation
- Drag-and-drop functionality

## Data Flow

### Loading Metadata

```
User clicks "Load Metadata"
    ↓
Webview: vscode.postMessage({ command: 'loadMetadata' })
    ↓
Extension: _loadMetadata()
    ↓
DuckDBService: getTableMetadata()
    ↓
Extension: _panel.webview.postMessage({ command: 'metadataLoaded', data })
    ↓
Webview: displayMetadata(data)
    ↓
UI updates with table/column information
```

### Saving Metadata

```
User clicks "Save Metadata"
    ↓
Webview: collectMetadata() → creates data object
    ↓
Webview: vscode.postMessage({ command: 'saveMetadata', data })
    ↓
Extension: _saveMetadata(data)
    ↓
Extension: Shows save dialog
    ↓
Extension: Writes JSON file
    ↓
Extension: Shows success message
```

### Exporting CSV

```
User clicks "Export to CSV"
    ↓
Webview: collectMetadata() → creates data object
    ↓
Webview: vscode.postMessage({ command: 'exportCSV', data })
    ↓
Extension: _convertToTableMetadata(data)
    ↓
Extension: CSVExporter.exportStandardHub(tables)
    ↓
Extension: CSVExporter.exportStandardSatellite(tables)
    ↓
Extension: CSVExporter.exportStandardLink(tables)
    ↓
Extension: Writes CSV files to workspace
```

## How to Make Common Changes

### Adding a New UI Button

1. **In `editor.html`**, add the button:
```html
<button onclick="myNewFunction()">New Button</button>
```

2. **Add the JavaScript function**:
```javascript
function myNewFunction() {
    // Your logic here
    vscode.postMessage({ command: 'myNewCommand', data: myData });
}
```

3. **In `metadataEditorPanel.ts`**, handle the message:
```typescript
case 'myNewCommand':
    await this._handleMyNewCommand(message.data);
    break;
```

4. **Implement the handler method**:
```typescript
private async _handleMyNewCommand(data: any) {
    // Your backend logic here
}
```

### Changing CSV Export Format

1. **Edit `csvExporter.ts`**
2. **Modify the relevant export method** (e.g., `exportStandardHub`)
3. **Update headers array**:
```typescript
const headers = ['Column1', 'Column2', 'Column3'];
```

4. **Update row generation logic**:
```typescript
rows.push([value1, value2, value3]);
```

### Adding a New Data Field

1. **Update TypeScript interfaces** in `csvExporter.ts`:
```typescript
interface BusinessKeyGroup {
    // ... existing fields
    myNewField?: string;  // Add new field
}
```

2. **Update data collection** in `editor.html`:
```javascript
function collectMetadata() {
    // ... existing code
    businessKeyGroups.push({
        // ... existing fields
        myNewField: getMyNewFieldValue()
    });
}
```

3. **Update data conversion** in `metadataEditorPanel.ts`:
```typescript
private async _convertToTableMetadata(data: any) {
    return data.tables.map((table: any) => ({
        // ... existing fields
        myNewField: table.myNewField
    }));
}
```

4. **Update CSV export** if needed:
```typescript
rows.push([
    // ... existing values
    group.myNewField  // Add new column
]);
```

### Modifying DuckDB Queries

1. **Edit `duckdbService.ts`**
2. **Modify the SQL query** in `getTableMetadata()`:
```typescript
const query = `
    SELECT 
        table_schema,
        table_name,
        column_name,
        -- Add new columns here
        my_new_column
    FROM information_schema.columns
    WHERE -- Modify filters here
`;
```

3. **Update the interface**:
```typescript
export interface TableColumn {
    // ... existing fields
    my_new_column?: string;
}
```

4. **Update processing logic** to handle the new field

### Changing UI Styling

1. **Edit CSS in `editor.html`** (inside `<style>` tag)
2. **Use VS Code CSS variables** for theming:
```css
.my-element {
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
}
```

3. **Common VS Code CSS variables**:
   - `--vscode-foreground`: Text color
   - `--vscode-background`: Background color
   - `--vscode-editor-background`: Editor background
   - `--vscode-button-background`: Button background
   - `--vscode-button-foreground`: Button text
   - `--vscode-font-family`: Font family
   - `--vscode-panel-border`: Border color

### Adding Drag-and-Drop

1. **Add draggable attribute**:
```html
<div draggable="true" 
     ondragstart="handleDragStart(event, index)"
     ondragover="handleDragOver(event)"
     ondrop="handleDrop(event, index)">
```

2. **Implement handlers**:
```javascript
function handleDragStart(event, index) {
    event.dataTransfer.setData('text/plain', index);
    draggedIndex = index;
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDrop(event, targetIndex) {
    event.preventDefault();
    // Reorder array
    const item = array.splice(draggedIndex, 1)[0];
    array.splice(targetIndex, 0, item);
    // Re-render UI
    renderUI();
}
```

## Development Workflow

### Setting Up Development Environment

1. **Install Node.js 20+**
2. **Clone repository**
3. **Install dependencies**:
```bash
npm install
```

4. **Compile TypeScript**:
```bash
npm run compile
```

5. **Open in VS Code**:
```bash
code .
```

### Making Changes

1. **Edit source files** in `src/` directory
2. **Edit UI** in `media/editor.html`
3. **Compile TypeScript**:
```bash
npm run compile
```

4. **Test in VS Code**:
   - Press `F5` to launch extension development host
   - New VS Code window opens with extension loaded
   - Test your changes

### Debugging

1. **Extension Backend Debugging**:
   - Set breakpoints in TypeScript files
   - Use VS Code debugger (F5)
   - Check "Debug Console" for logs

2. **Webview Debugging**:
   - In extension development host, open Developer Tools:
     - `Help → Toggle Developer Tools`
   - Use browser console for JavaScript debugging
   - Set breakpoints in JavaScript code

3. **Common Debugging Techniques**:
   - `console.log()` in both TypeScript and JavaScript
   - Check VS Code Output panel (View → Output)
   - Check browser console in Developer Tools

### Testing Changes

1. **TypeScript Compilation**:
   - Always run `npm run compile` after changes
   - Fix any TypeScript errors before testing

2. **Manual Testing Checklist**:
   - [ ] Load metadata from DuckDB file
   - [ ] Create hub hashkeys
   - [ ] Create link hashkeys
   - [ ] Create satellites
   - [ ] Export to CSV
   - [ ] Save metadata to JSON
   - [ ] Verify CSV output format

### Common Issues and Solutions

1. **"JavaScript not running"**:
   - Check for syntax errors in JavaScript
   - Ensure no TypeScript annotations in HTML JavaScript
   - Check browser console for errors

2. **"Module not found"**:
   - Run `npm install`
   - Check `package.json` dependencies
   - Restart VS Code

3. **"Changes not appearing"**:
   - Recompile TypeScript: `npm run compile`
   - Reload extension: Close and reopen extension development host
   - Clear webview cache: Close and reopen webview panel

4. **"DuckDB connection failed"**:
   - Verify DuckDB file path
   - Check file permissions
   - Ensure DuckDB module is installed: `npm install duckdb`

## Key Concepts to Understand

### VS Code Extension API

- **`vscode.ExtensionContext`**: Extension lifecycle management
- **`vscode.WebviewPanel`**: Webview panel creation and management
- **`vscode.Uri`**: File path handling
- **`vscode.commands.registerCommand()`**: Command registration
- **`vscode.window.showOpenDialog()`**: File picker dialogs

### Message Passing

- **Webview → Extension**: `vscode.postMessage({ command, data })`
- **Extension → Webview**: `panel.webview.postMessage({ command, data })`
- **Always use structured messages** with `command` and optional `data` fields

### Data Structures

- **Webview Format**: JavaScript objects as collected from UI
- **Backend Format**: TypeScript interfaces (`TableMetadata`, `BusinessKeyGroup`, etc.)
- **Conversion**: `_convertToTableMetadata()` transforms webview format to backend format

### File Paths

- **Extension URI**: `vscode.Uri` for extension resources
- **File System Path**: `uri.fsPath` for actual file system paths
- **Workspace Path**: `vscode.workspace.workspaceFolders[0].uri.fsPath`

## Next Steps

1. **Read the code**: Start with `extension.ts`, then `metadataEditorPanel.ts`
2. **Understand the flow**: Trace a user action from UI to backend
3. **Make small changes**: Try modifying UI text or adding a console.log
4. **Experiment**: Create a test branch and try new features
5. **Refer to VS Code Extension API docs**: https://code.visualstudio.com/api

## Resources

- **VS Code Extension API**: https://code.visualstudio.com/api
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **DuckDB Documentation**: https://duckdb.org/docs/
- **VS Code Extension Samples**: https://github.com/microsoft/vscode-extension-samples

