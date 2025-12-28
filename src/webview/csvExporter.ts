/**
 * CSV Exporter for Data Vault 2.1 metadata
 * Converts metadata editor data to Data Vault 2.1 CSV format
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
    createSatellite?: boolean; // Whether to create a satellite for this table
    columns: ColumnMetadata[];
}

export class CSVExporter {
    /**
     * Convert table metadata to Data Vault 2.1 source_data.csv format
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
     * Convert table metadata to Data Vault 2.1 standard_hub.csv format
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
                // IMPORTANT: Only regular hashkeys (isLink = false or undefined) go to hubs
                // Link hashkeys (isLink = true) go to standard_link.csv
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
     * Convert table metadata to Data Vault 2.1 standard_satellite.csv format
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
            // Create satellites based on hashdiffs
            const hashdiffGroups = (table as any).hashdiffGroups || [];
            if (hashdiffGroups.length === 0) {
                return; // Skip tables without hashdiffs
            }

            // Get business key columns to exclude from payload
            const businessKeyColumns = new Set<string>();
            if (table.businessKeyGroups) {
                table.businessKeyGroups.forEach(group => {
                    group.columns.forEach(col => businessKeyColumns.add(col));
                });
            }

            // Get record source and load date columns
            const recordSourceCol = table.columns.find(c => c.isRecordSource)?.column || '';
            const loadDateCol = table.columns.find(c => c.isLoadDate)?.column || '';

            // Process each hashdiff group
            hashdiffGroups.forEach((hashdiff: any) => {
                if (!hashdiff.concept || !hashdiff.hashkey) {
                    return; // Skip hashdiffs without concept/hashkey
                }

                // Get columns for this hashdiff
                const hashdiffColumns = new Set<string>();
                if (hashdiff.mode === 'select_all') {
                    // Include all columns except excluded ones, business keys, record source, load date
                    table.columns.forEach(col => {
                        if (!hashdiff.excludedColumns.includes(col.column) &&
                            !businessKeyColumns.has(col.column) &&
                            col.column !== recordSourceCol &&
                            col.column !== loadDateCol) {
                            hashdiffColumns.add(col.column);
                        }
                    });
                } else {
                    // Include only explicitly selected columns
                    hashdiff.includedColumns.forEach((col: string) => hashdiffColumns.add(col));
                }

                if (hashdiffColumns.size === 0) {
                    return; // Skip empty hashdiffs
                }

                // Find the hub name from the hashkey
                const hubName = hashdiff.hashkey.replace(/^hk_/, '').replace(/_h$/, '');
                const satelliteName = hashdiff.name.replace(/^hd_/, '').replace(/_sat$/, '');
                const satelliteIdentifier = `S_${satelliteName}`;
                const parentIdentifier = `H_${hubName}`;
                const parentHashkey = hashdiff.hashkey;
                
                const sourceIdentifier = `${this.extractSourceSystem(table.schema, table.table)}_${this.extractSourceObject(table.schema, table.table)}_${table.table}`;

                Array.from(hashdiffColumns).forEach((colName, index) => {
                    const col = table.columns.find(c => c.column === colName);
                    if (col) {
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
                    }
                });
            });
        });

        return this.arrayToCSV([headers, ...rows]);
    }

    /**
     * Convert table metadata to Data Vault 2.1 standard_link.csv format
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
            // IMPORTANT: Only link hashkeys (isLink = true) go to links
            // Regular hashkeys (isLink = false or undefined) go to standard_hub.csv
            if (table.businessKeyGroups) {
                const linkGroups = table.businessKeyGroups.filter(g => g.isLink === true);
                
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
     * Export metadata in information_schema format with metadata columns as additional fields
     * This format follows information_schema.columns structure with metadata as JSON arrays
     */
    static exportInformationSchemaFormat(tables: TableMetadata[]): string {
        const headers = [
            'table_catalog',
            'table_schema',
            'table_name',
            'column_name',
            'ordinal_position',
            'data_type',
            'is_nullable',
            'business_concept',
            'hub_hashkey',
            'link_hashkey',
            'hashdiff_names',
            'is_record_source',
            'is_load_date',
            'create_satellite'
        ];

        const rows: string[][] = [];

        tables.forEach(table => {
            // Get all hashkeys for this table
            const hubHashkeys: string[] = [];
            const linkHashkeys: string[] = [];
            const hashdiffNames = new Set<string>();
            
            if (table.businessKeyGroups) {
                table.businessKeyGroups.forEach(group => {
                    if (group.isLink) {
                        if (group.hashkeyName) linkHashkeys.push(group.hashkeyName);
                    } else {
                        if (group.hashkeyName) hubHashkeys.push(group.hashkeyName);
                    }
                });
            }

            // Get hashdiff names
            if ((table as any).hashdiffGroups) {
                (table as any).hashdiffGroups.forEach((diff: any) => {
                    hashdiffNames.add(diff.name);
                });
            }

            table.columns.forEach(col => {
                // Find which hashkey this column belongs to
                let hubHashkey = '';
                let linkHashkey = '';
                
                if (table.businessKeyGroups) {
                    table.businessKeyGroups.forEach(group => {
                        if (group.columns.includes(col.column)) {
                            if (group.isLink) {
                                linkHashkey = group.hashkeyName || '';
                            } else {
                                hubHashkey = group.hashkeyName || '';
                            }
                        }
                    });
                }

                // Get hashdiff names for this column
                const columnHashdiffs: string[] = [];
                if ((table as any).hashdiffGroups) {
                    (table as any).hashdiffGroups.forEach((diff: any) => {
                        if (diff.mode === 'select_all') {
                            if (!diff.excludedColumns.includes(col.column)) {
                                columnHashdiffs.push(diff.name);
                            }
                        } else {
                            if (diff.includedColumns.includes(col.column)) {
                                columnHashdiffs.push(diff.name);
                            }
                        }
                    });
                }

                rows.push([
                    'default', // table_catalog
                    table.schema,
                    table.table,
                    col.column,
                    String(col.order),
                    (col as any).data_type || '',
                    (col as any).is_nullable || 'YES',
                    table.businessConcept || '',
                    hubHashkey || '',
                    linkHashkey || '',
                    columnHashdiffs.length > 0 ? JSON.stringify(columnHashdiffs) : '',
                    col.isRecordSource ? 'true' : 'false',
                    col.isLoadDate ? 'true' : 'false',
                    (table as any).createSatellite ? 'true' : 'false'
                ]);
            });
        });

        return this.arrayToCSV([headers, ...rows]);
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

