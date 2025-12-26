import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DuckDBService } from './duckdbService';
import { CSVExporter, TableMetadata, ColumnMetadata } from './csvExporter';

export class MetadataEditorPanel {
    public static currentPanel: MetadataEditorPanel | undefined;
    public static readonly viewType = 'metadataEditor';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _dbPath: string;
    private _duckDBService: DuckDBService;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, dbPath: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (MetadataEditorPanel.currentPanel) {
            MetadataEditorPanel.currentPanel._panel.reveal(column);
            MetadataEditorPanel.currentPanel._dbPath = dbPath;
            MetadataEditorPanel.currentPanel._loadMetadata();
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            MetadataEditorPanel.viewType,
            'TurboVault Metadata Editor',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ],
                retainContextWhenHidden: true
            }
        );

        MetadataEditorPanel.currentPanel = new MetadataEditorPanel(panel, extensionUri, dbPath);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, dbPath: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._dbPath = dbPath;
        this._duckDBService = new DuckDBService(dbPath);

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'ready':
                        // Send initial DB path to webview
                        this._panel.webview.postMessage({
                            command: 'dbPath',
                            path: this._dbPath
                        });
                        break;
                    case 'loadMetadata':
                        await this._loadMetadata();
                        break;
                    case 'saveMetadata':
                        await this._saveMetadata(message.data);
                        break;
                    case 'exportCSV':
                        await this._exportCSV(message.data);
                        break;
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async _loadMetadata() {
        try {
            const metadata = await this._duckDBService.getTableMetadata();
            this._panel.webview.postMessage({
                command: 'metadataLoaded',
                data: metadata
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error loading metadata: ${error.message}`);
            this._panel.webview.postMessage({
                command: 'error',
                error: error.message
            });
        }
    }

    private async _saveMetadata(data: any) {
        try {
            // Save metadata to a JSON file in the workspace
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const savePath = path.join(workspaceFolders[0].uri.fsPath, 'metadata.json');
            fs.writeFileSync(savePath, JSON.stringify(data, null, 2));

            vscode.window.showInformationMessage('Metadata saved successfully');
            this._panel.webview.postMessage({
                command: 'saveSuccess'
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error saving metadata: ${error.message}`);
        }
    }

    private async _exportCSV(data: any) {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            // Show save dialog to select output directory
            const outputDir = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Output Directory'
            });

            if (!outputDir || outputDir.length === 0) {
                return;
            }

            // Convert data to TableMetadata format
            const tables: TableMetadata[] = this._convertToTableMetadata(data);

            // Export each entity type to CSV using CSVExporter
            const exports = [
                { name: 'source_data', content: CSVExporter.exportSourceData(tables) },
                { name: 'standard_hub', content: CSVExporter.exportStandardHub(tables) },
                { name: 'standard_satellite', content: CSVExporter.exportStandardSatellite(tables) },
                { name: 'standard_link', content: CSVExporter.exportStandardLink(tables) }
            ];

            let exportedCount = 0;
            for (const exportItem of exports) {
                if (exportItem.content && exportItem.content.trim().length > 0) {
                    const filePath = path.join(outputDir[0].fsPath, `${exportItem.name}.csv`);
                    fs.writeFileSync(filePath, exportItem.content);
                    exportedCount++;
                }
            }

            vscode.window.showInformationMessage(`Successfully exported ${exportedCount} CSV files`);
            this._panel.webview.postMessage({
                command: 'exportSuccess'
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error exporting CSV: ${error.message}`);
            console.error('Export error:', error);
        }
    }

    private _convertToTableMetadata(data: any): TableMetadata[] {
        // Convert the data structure from webview to TableMetadata format
        if (!data.tables || !Array.isArray(data.tables)) {
            return [];
        }

        return data.tables.map((table: any) => {
            const columns: ColumnMetadata[] = table.columns.map((col: any) => ({
                schema: col.schema || table.schema,
                table: col.table || table.table,
                column: col.column,
                type: '', // Column type is now determined by where it's used
                order: col.order || 0,
                isBusinessKey: !!col.businessKeyGroup,
                businessKeyGroup: col.businessKeyGroup || undefined,
                isHashdiff: false, // Hashdiff is determined by default logic
                isPayload: !col.businessKeyGroup && !col.isRecordSource && !col.isLoadDate,
                isRecordSource: col.isRecordSource || false,
                isLoadDate: col.isLoadDate || false
            }));

            return {
                schema: table.schema,
                table: table.table,
                businessConcept: table.businessConcept || undefined,
                businessKeyGroups: table.businessKeyGroups || undefined,
                columns: columns
            };
        });
    }

    public dispose() {
        MetadataEditorPanel.currentPanel = undefined;
        this._duckDBService.dispose();

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // For VS Code webviews, it's simpler to inline the HTML
        // Read the HTML file from the extension directory
        const htmlPath = path.join(this._extensionUri.fsPath, 'media', 'editor.html');
        
        try {
            // Read the HTML file
            const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
            // Replace placeholders
            const htmlWithPaths = htmlContent
                .replace(/{{DB_PATH}}/g, this._dbPath)
                .replace(/{{CSRF_TOKEN}}/g, webview.cspSource);
            
            return htmlWithPaths;
        } catch (error) {
            // Fallback to inline HTML if file not found
            console.error('Error loading HTML file:', error);
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TurboVault Metadata Editor</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .header {
            margin-bottom: 20px;
        }
        .controls {
            margin-bottom: 20px;
        }
        button {
            padding: 8px 16px;
            margin-right: 10px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid var(--vscode-panel-border);
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: var(--vscode-editor-selectionBackground);
            font-weight: bold;
        }
        select, input {
            padding: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }
        .loading {
            text-align: center;
            padding: 40px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>TurboVault Metadata Editor</h1>
        <p>Database: ${this._dbPath}</p>
    </div>
    
    <div class="controls">
        <button onclick="loadMetadata()">Load Metadata</button>
        <button onclick="saveMetadata()">Save Metadata</button>
        <button onclick="exportCSV()">Export to CSV</button>
    </div>

    <div id="content">
        <div class="loading">Click "Load Metadata" to start</div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function loadMetadata() {
            vscode.postMessage({ command: 'loadMetadata' });
        }

        function saveMetadata() {
            const metadata = collectMetadata();
            vscode.postMessage({ command: 'saveMetadata', data: metadata });
        }

        function exportCSV() {
            const metadata = collectMetadata();
            vscode.postMessage({ command: 'exportCSV', data: metadata });
        }

        function collectMetadata() {
            // Collect metadata from the UI
            // This will be implemented based on the UI structure
            return {};
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'metadataLoaded':
                    displayMetadata(message.data);
                    break;
                case 'saveSuccess':
                    alert('Metadata saved successfully!');
                    break;
                case 'exportSuccess':
                    alert('CSV files exported successfully!');
                    break;
                case 'error':
                    alert('Error: ' + message.error);
                    break;
            }
        });

        function displayMetadata(data) {
            // Display metadata in the UI
            // This will be implemented based on the UI structure
            document.getElementById('content').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        }
    </script>
</body>
</html>`;
        }
    }
}

