import * as vscode from 'vscode';
import { MetadataEditorPanel } from './webview/metadataEditorPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Data Vault 2.1 Metadata Prep App extension is now active');

    // Register command to open the metadata editor
    // VS Code passes the selected resource URI as the first argument when called from context menu
    const openEditorCommand = vscode.commands.registerCommand('metadata-frontend.openEditor', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
        let dbPath: string | undefined;

        // First, check if a URI was passed (from context menu)
        // VS Code passes the URI as the first argument when called from context menu
        // If multiple files are selected, uris array is also provided
        const resourceUri = uri || (uris && uris.length > 0 ? uris[0] : undefined);
        
        if (resourceUri) {
            console.log('Command called with URI:', resourceUri.toString());
            const fsPath = resourceUri.fsPath;
            console.log('URI fsPath:', fsPath);
            
            if (fsPath.endsWith('.duckdb')) {
                dbPath = fsPath;
                console.log('Using URI fsPath as dbPath:', dbPath);
            } else {
                console.log('URI does not end with .duckdb, ignoring');
            }
        } else {
            console.log('No URI passed to command');
        }

        // If we still don't have a path, check the active editor
        if (!dbPath) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.fileName.endsWith('.duckdb')) {
                dbPath = activeEditor.document.fileName;
            }
        }

        // If we still don't have a path, ask user to select a DuckDB file
        if (!dbPath) {
            const selectedFiles = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'DuckDB Files': ['duckdb']
                },
                openLabel: 'Select DuckDB Database'
            });

            if (selectedFiles && selectedFiles.length > 0) {
                dbPath = selectedFiles[0].fsPath;
            } else {
                vscode.window.showErrorMessage('Please select a DuckDB database file');
                return;
            }
        }

        if (dbPath) {
            MetadataEditorPanel.createOrShow(context.extensionUri, dbPath);
        }
    });

    context.subscriptions.push(openEditorCommand);
}

export function deactivate() {}

