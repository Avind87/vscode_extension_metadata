import * as vscode from 'vscode';
import { MetadataEditorPanel } from './webview/metadataEditorPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Data Vault 2.1 Metadata Prep App extension is now active');

    // Register command to open the metadata editor
    const openEditorCommand = vscode.commands.registerCommand('metadata-frontend.openEditor', async () => {
        // Get the active file or ask user to select a DuckDB file
        const activeEditor = vscode.window.activeTextEditor;
        let dbPath: string | undefined;

        if (activeEditor && activeEditor.document.fileName.endsWith('.duckdb')) {
            dbPath = activeEditor.document.fileName;
        } else {
            // Ask user to select a DuckDB file
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

