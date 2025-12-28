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
    hashdiffGroups?: any[]; // Hashdiff groups (satellites)
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
            console.log(`Table ${table.schema}.${table.table} has ${hashdiffGroups.length} hashdiff groups`);
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
            hashdiffGroups.forEach((hashdiff: any, diffIndex: number) => {
                console.log(`Hashdiff ${diffIndex}:`, JSON.stringify(hashdiff, null, 2));
                if (!hashdiff.concept) {
                    console.log(`Skipping hashdiff ${diffIndex} - missing concept (${hashdiff.concept})`);
                    return; // Skip hashdiffs without concept
                }
                
                // If hashkey is not set, try to find it from the concept
                if (!hashdiff.hashkey) {
                    // Find the hashkey for this concept
                    if (table.businessKeyGroups) {
                        table.businessKeyGroups.forEach(group => {
                            if (!group.isLink && group.businessConcept === hashdiff.concept && group.hashkeyName) {
                                hashdiff.hashkey = group.hashkeyName;
                                console.log(`Auto-selected hashkey ${hashdiff.hashkey} for concept ${hashdiff.concept}`);
                            }
                        });
                    }
                    
                    if (!hashdiff.hashkey) {
                        console.log(`Skipping hashdiff ${diffIndex} - no hashkey found for concept (${hashdiff.concept})`);
                        return; // Skip if still no hashkey
                    }
                }

                // Get columns for this hashdiff
                const hashdiffColumns = new Set<string>();
                const mode = hashdiff.mode || 'select_all';
                const excludedColumns = hashdiff.excludedColumns || [];
                const includedColumns = hashdiff.includedColumns || [];
                
                console.log(`Hashdiff mode: ${mode}, excluded: ${excludedColumns.length}, included: ${includedColumns.length}`);
                
                if (mode === 'select_all') {
                    // Include all columns except excluded ones, business keys, record source, load date
                    table.columns.forEach(col => {
                        if (!excludedColumns.includes(col.column) &&
                            !businessKeyColumns.has(col.column) &&
                            col.column !== recordSourceCol &&
                            col.column !== loadDateCol) {
                            hashdiffColumns.add(col.column);
                        }
                    });
                } else {
                    // Include only explicitly selected columns
                    includedColumns.forEach((col: string) => hashdiffColumns.add(col));
                }

                console.log(`Hashdiff ${diffIndex} has ${hashdiffColumns.size} columns`);
                if (hashdiffColumns.size === 0) {
                    console.log(`Skipping hashdiff ${diffIndex} - no columns`);
                    return; // Skip empty hashdiffs
                }

                // Find the hub name from the hashkey
                const hubName = hashdiff.hashkey.replace(/^hk_/, '').replace(/_h$/, '');
                const satelliteName = hashdiff.name.replace(/^hd_/, '').replace(/_sat$/, '');
                console.log(`Creating satellite: ${satelliteName} for hub: ${hubName} with ${hashdiffColumns.size} columns`);
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
                        // Find which table this hashkey belongs to and get its columns
                        let hubIdentifier = '';
                        let hubName = '';
                        let hashkeyColumns: string[] = [];
                        
                        tables.forEach(t => {
                            if (t.businessKeyGroups) {
                                const matchingGroup = t.businessKeyGroups.find(g => 
                                    !g.isLink && g.hashkeyName === refHashkey
                                );
                                if (matchingGroup) {
                                    hubName = this.generateHubName(t.table, t.businessConcept);
                                    hubIdentifier = `H_${hubName}`;
                                    // Get columns from the referenced hashkey
                                    hashkeyColumns = matchingGroup.columns || [];
                                }
                            }
                        });
                        
                        // Create a row for each column in the referenced hashkey
                        if (hubIdentifier && hashkeyColumns.length > 0) {
                            hashkeyColumns.forEach((col, colIndex) => {
                                rows.push([
                                    linkIdentifier,
                                    linkName,
                                    sourceIdentifier,
                                    col, // Source column from referenced hashkey
                                    hubIdentifier,
                                    refHashkey,
                                    col, // Target column from referenced hashkey
                                    linkGroup.hashkeyName || linkName,
                                    this.extractGroupName(table.schema)
                                ]);
                            });
                        } else if (hubIdentifier) {
                            // Fallback if no columns found
                            rows.push([
                                linkIdentifier,
                                linkName,
                                sourceIdentifier,
                                '', // Source column
                                hubIdentifier,
                                refHashkey,
                                '', // Target column
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

