/**
 * CSV Exporter for TurboVault metadata
 * Converts metadata editor data to TurboVault CSV format
 */

export interface BusinessKeyGroup {
    hashkeyName: string;
    businessConcept?: string; // Business concept for this hashkey
    columns: string[]; // Column names in order
    order: number; // Order within the table
    isLink?: boolean; // Whether this is a link hashkey (references other hashkeys)
    referencedHashkeys?: string[]; // For link hashkeys: array of hashkey names from other tables
}

export interface ColumnMetadata {
    schema: string;
    table: string;
    column: string;
    type: string;
    order: number;
    isBusinessKey?: boolean;
    businessKeyGroup?: string; // Hashkey name this column belongs to
    hashkeyName?: string; // Named hashkey (if this column is a hashkey)
    isHashkey?: boolean; // Whether this column is a hashkey
    isHashdiff?: boolean;
    hashdiffName?: string; // Named hashdiff
    isPayload?: boolean;
    isRecordSource?: boolean;
    isLoadDate?: boolean;
}

export interface TableMetadata {
    schema: string;
    table: string;
    businessConcept?: string; // Business concept (Customer, Order, etc.)
    businessKeyGroups?: BusinessKeyGroup[]; // Groups of business keys with hashkey names
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
            const recordSourceCol = table.columns.find(c => c.isRecordSource)?.column || '';
            const loadDateCol = table.columns.find(c => c.isLoadDate)?.column || '';
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
            // Use business key groups if available, otherwise fall back to individual business keys
            if (table.businessKeyGroups && table.businessKeyGroups.length > 0) {
                // Filter out link hashkeys (they go to standard_link.csv)
                const nonLinkGroups = table.businessKeyGroups.filter(g => !g.isLink);
                
                nonLinkGroups.forEach((group, groupIndex) => {
                    const hubName = this.generateHubName(table.table, table.businessConcept);
                    const hubIdentifier = `H_${hubName}`;
                    const hashkey = group.hashkeyName || `hk_${hubName}`;
                    const sourceIdentifier = `${this.extractSourceSystem(table.schema, table.table)}_${this.extractSourceObject(table.schema, table.table)}_${table.table}`;
                    
                    // Each column in the business key group gets a row
                    group.columns.forEach((columnName, colIndex) => {
                        const column = table.columns.find(c => c.column === columnName);
                        rows.push([
                            hubIdentifier,
                            hubName,
                            sourceIdentifier,
                            columnName,
                            columnName,
                            String(colIndex + 1), // Order within the group
                            hashkey,
                            '',
                            groupIndex === 0 && colIndex === 0 ? '1' : '0', // First group, first column is primary
                            this.extractGroupName(table.schema)
                        ]);
                    });
                });
            } else {
                // Fallback to old behavior for backward compatibility
                const businessKeys = table.columns.filter(c => c.isBusinessKey);
                
                if (businessKeys.length === 0) {
                    return; // Skip tables without business keys
                }

                const hubName = this.generateHubName(table.table, table.businessConcept);
                const hubIdentifier = `H_${hubName}`;
                const hashkey = businessKeys[0].hashkeyName || `hk_${hubName}`;
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
                        index === 0 ? '1' : '0',
                        this.extractGroupName(table.schema)
                    ]);
                });
            }
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
            // Get business key columns to exclude from payload
            const businessKeyColumns = new Set<string>();
            if (table.businessKeyGroups) {
                table.businessKeyGroups.forEach(group => {
                    group.columns.forEach(col => businessKeyColumns.add(col));
                });
            } else {
                table.columns.filter(c => c.isBusinessKey).forEach(c => businessKeyColumns.add(c.column));
            }

            const payloadColumns = table.columns.filter(c => {
                // Include if explicitly marked as payload
                if (c.isPayload) return true;
                // Exclude if it's a business key, hashkey, hashdiff, record source, or load date
                if (c.isHashkey || c.isHashdiff || c.isRecordSource || c.isLoadDate) return false;
                if (businessKeyColumns.has(c.column)) return false;
                // Include everything else as payload
                return true;
            });

            if (payloadColumns.length === 0) {
                return; // Skip tables without payload columns
            }

            const hubName = this.generateHubName(table.table, table.businessConcept);
            const satelliteName = `${hubName}_sat`;
            const satelliteIdentifier = `S_${hubName}`;
            const parentIdentifier = `H_${hubName}`;
            
            // Get the hashkey from the first business key group, or default
            let parentHashkey = `hk_${hubName}`;
            if (table.businessKeyGroups && table.businessKeyGroups.length > 0) {
                parentHashkey = table.businessKeyGroups[0].hashkeyName || parentHashkey;
            }
            
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

        const rows: string[][] = [];

        tables.forEach(table => {
            // Find link hashkey groups
            if (table.businessKeyGroups) {
                const linkGroups = table.businessKeyGroups.filter(g => g.isLink);
                
                linkGroups.forEach((linkGroup, linkIndex) => {
                    const linkName = linkGroup.hashkeyName || `lk_${table.table}_${linkIndex + 1}`;
                    const linkIdentifier = `L_${linkName}`;
                    const sourceIdentifier = `${this.extractSourceSystem(table.schema, table.table)}_${this.extractSourceObject(table.schema, table.table)}_${table.table}`;
                    
                    // Each referenced hashkey becomes a row in the link
                    (linkGroup.referencedHashkeys || []).forEach((refHashkey, refIndex) => {
                        // Find which table this hashkey belongs to
                        let hubIdentifier = '';
                        let hubName = '';
                        
                        tables.forEach(t => {
                            if (t.businessKeyGroups) {
                                const matchingGroup = t.businessKeyGroups.find(g => 
                                    !g.isLink && g.hashkeyName === refHashkey
                                );
                                if (matchingGroup) {
                                    hubName = this.generateHubName(t.table, t.businessConcept);
                                    hubIdentifier = `H_${hubName}`;
                                }
                            }
                        });
                        
                        if (hubIdentifier) {
                            rows.push([
                                linkIdentifier,
                                linkName,
                                sourceIdentifier,
                                '', // Source column - not applicable for link hashkeys
                                hubIdentifier,
                                refHashkey,
                                '', // Target column - not applicable
                                linkGroup.hashkeyName || linkName,
                                this.extractGroupName(table.schema)
                            ]);
                        }
                    });
                });
            }
        });

        return this.arrayToCSV([headers, ...rows]);
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
     * Helper: Generate hub name from table name and business concept
     */
    private static generateHubName(tableName: string, businessConcept?: string): string {
        if (businessConcept) {
            // Use business concept for hub name (e.g., 'Customer' -> 'customer_h')
            return `${businessConcept.toLowerCase()}_h`;
        }
        // Remove prefixes like 'stg_', 'rv_', etc.
        const cleaned = tableName.replace(/^(stg_|rv_|hub_)/i, '');
        // Convert to hub naming convention (e.g., 'product_master' -> 'product_h')
        const parts = cleaned.split('_');
        const base = parts[0] || cleaned;
        return `${base}_h`;
    }
}

