/**
 * CSV Exporter for TurboVault metadata
 * Converts metadata editor data to TurboVault CSV format
 */

export interface ColumnMetadata {
    schema: string;
    table: string;
    column: string;
    type: string;
    order: number;
    isBusinessKey?: boolean;
    isHashkey?: boolean;
    isHashdiff?: boolean;
    isPayload?: boolean;
    isRecordSource?: boolean;
    isLoadDate?: boolean;
}

export interface TableMetadata {
    schema: string;
    table: string;
    columns: ColumnMetadata[];
}

export class CSVExporter {
    /**
     * Convert table metadata to TurboVault source_data.csv format
     */
    static exportSourceData(tables: TableMetadata[]): string {
        const headers = [
            'Source_System',
            'Source_Object',
            'Source_Schema_Physical_Name',
            'Source_Table_Physical_Name',
            'Source_Table_Identifier',
            'Record_Source_Column',
            'Load_Date_Column',
            'Group_Name',
            'Static_Part_of_Record_Source_Column'
        ];

        const rows = tables.map(table => {
            const recordSourceCol = table.columns.find(c => c.isRecordSource)?.column || 'rsrc';
            const loadDateCol = table.columns.find(c => c.isLoadDate)?.column || 'load_date';
            const sourceSystem = this.extractSourceSystem(table.schema, table.table);
            const sourceObject = this.extractSourceObject(table.schema, table.table);
            
            return [
                sourceSystem,
                sourceObject,
                table.schema,
                table.table,
                `${sourceSystem}_${sourceObject}_${table.table}`,
                recordSourceCol,
                loadDateCol,
                this.extractGroupName(table.schema),
                sourceSystem.toUpperCase()
            ];
        });

        return this.arrayToCSV([headers, ...rows]);
    }

    /**
     * Convert table metadata to TurboVault standard_hub.csv format
     */
    static exportStandardHub(tables: TableMetadata[]): string {
        const headers = [
            'Hub_Identifier',
            'Target_Hub_table_physical_name',
            'Source_Table_Identifier',
            'Source_Column_Physical_Name',
            'Business_Key_Physical_Name',
            'Target_Column_Sort_Order',
            'Target_Primary_Key_Physical_Name',
            'Record_Tracking_Satellite',
            'Is_Primary_Source',
            'Group_Name'
        ];

        const rows: string[][] = [];

        tables.forEach(table => {
            const businessKeys = table.columns.filter(c => c.isBusinessKey);
            
            if (businessKeys.length === 0) {
                return; // Skip tables without business keys
            }

            const hubName = this.generateHubName(table.table);
            const hubIdentifier = `H_${hubName}`;
            const hashkey = `hk_${hubName}`;
            const sourceIdentifier = `${this.extractSourceSystem(table.schema, table.table)}_${this.extractSourceObject(table.schema, table.table)}_${table.table}`;
            
            businessKeys.forEach((bk, index) => {
                rows.push([
                    hubIdentifier,
                    hubName,
                    sourceIdentifier,
                    bk.column,
                    bk.column,
                    String(bk.order || index + 1),
                    hashkey,
                    '',
                    index === 0 ? '1' : '0', // First business key is primary source
                    this.extractGroupName(table.schema)
                ]);
            });
        });

        return this.arrayToCSV([headers, ...rows]);
    }

    /**
     * Convert table metadata to TurboVault standard_satellite.csv format
     */
    static exportStandardSatellite(tables: TableMetadata[]): string {
        const headers = [
            'Satellite_Identifier',
            'Target_Satellite_Table_Physical_Name',
            'Source_Table_Identifier',
            'Source_Column_Physical_Name',
            'Parent_Identifier',
            'Parent_Primary_Key_Physical_Name',
            'Target_Column_Physical_Name',
            'Target_Column_Sort_Order',
            'Group_Name'
        ];

        const rows: string[][] = [];

        tables.forEach(table => {
            const payloadColumns = table.columns.filter(c => 
                c.isPayload || (!c.isBusinessKey && !c.isHashkey && !c.isHashdiff && !c.isRecordSource && !c.isLoadDate)
            );

            if (payloadColumns.length === 0) {
                return; // Skip tables without payload columns
            }

            const hubName = this.generateHubName(table.table);
            const satelliteName = `${hubName}_sat`;
            const satelliteIdentifier = `S_${hubName}`;
            const parentIdentifier = `H_${hubName}`;
            const parentHashkey = `hk_${hubName}`;
            const sourceIdentifier = `${this.extractSourceSystem(table.schema, table.table)}_${this.extractSourceObject(table.schema, table.table)}_${table.table}`;

            payloadColumns.forEach((col, index) => {
                rows.push([
                    satelliteIdentifier,
                    satelliteName,
                    sourceIdentifier,
                    col.column,
                    parentIdentifier,
                    parentHashkey,
                    col.column,
                    String(col.order || index + 1),
                    this.extractGroupName(table.schema)
                ]);
            });
        });

        return this.arrayToCSV([headers, ...rows]);
    }

    /**
     * Convert table metadata to TurboVault standard_link.csv format
     */
    static exportStandardLink(tables: TableMetadata[]): string {
        // Links are relationships between hubs, which requires understanding foreign keys
        // For now, return empty CSV - this would need more complex logic
        const headers = [
            'Link_Identifier',
            'Target_link_table_physical_name',
            'Source_Table_Identifier',
            'Source_Column_Physical_Name',
            'Hub_Identifier',
            'Hub_primary_key_physical_name',
            'Target_column_physical_name',
            'Target_Primary_Key_Physical_Name',
            'Group_Name'
        ];

        // TODO: Implement link generation logic
        // This would require understanding foreign key relationships
        
        return this.arrayToCSV([headers]);
    }

    /**
     * Helper: Convert 2D array to CSV string
     */
    private static arrayToCSV(data: string[][]): string {
        return data.map(row => 
            row.map(cell => {
                if (cell === null || cell === undefined) {
                    return '';
                }
                const stringCell = String(cell);
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
                    return `"${stringCell.replace(/"/g, '""')}"`;
                }
                return stringCell;
            }).join(',')
        ).join('\n');
    }

    /**
     * Helper: Extract source system from schema/table name
     */
    private static extractSourceSystem(schema: string, table: string): string {
        // Default logic - can be enhanced
        return schema.toUpperCase() || 'DEFAULT';
    }

    /**
     * Helper: Extract source object from schema/table name
     */
    private static extractSourceObject(schema: string, table: string): string {
        // Default logic - can be enhanced
        return table.split('_')[0]?.toUpperCase() || 'DEFAULT';
    }

    /**
     * Helper: Extract group name from schema
     */
    private static extractGroupName(schema: string): string {
        // Default logic - can be enhanced
        return schema.toUpperCase() || 'DEFAULT';
    }

    /**
     * Helper: Generate hub name from table name
     */
    private static generateHubName(tableName: string): string {
        // Remove prefixes like 'stg_', 'rv_', etc.
        const cleaned = tableName.replace(/^(stg_|rv_|hub_)/i, '');
        // Convert to hub naming convention (e.g., 'product_master' -> 'product_h')
        const parts = cleaned.split('_');
        const base = parts[0] || cleaned;
        return `${base}_h`;
    }
}

