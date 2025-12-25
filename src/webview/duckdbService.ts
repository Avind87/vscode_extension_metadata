// Dynamically import duckdb to handle cases where native module isn't available
let duckdb: any;
try {
    duckdb = require('duckdb');
} catch (error) {
    console.warn('DuckDB module not available:', error);
}
import * as path from 'path';

export interface TableColumn {
    table_catalog: string;
    table_schema: string;
    table_name: string;
    column_name: string;
    ordinal_position: number;
    data_type: string;
    is_nullable: string;
}

export interface TableMetadata {
    schema: string;
    table: string;
    columns: TableColumn[];
}

export class DuckDBService {
    private db: any;
    private connection: any;

    constructor(dbPath: string) {
        if (!duckdb) {
            throw new Error('DuckDB module is not available. Please install dependencies with: npm install');
        }
        this.db = new duckdb.Database(dbPath);
        this.connection = this.db.connect();
    }

    async getTableMetadata(): Promise<TableMetadata[]> {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    table_catalog,
                    table_schema,
                    table_name,
                    column_name,
                    ordinal_position,
                    data_type,
                    is_nullable
                FROM information_schema.columns
                WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
                ORDER BY table_schema, table_name, ordinal_position
            `;

            this.connection.all(query, (err: Error | null, rows: TableColumn[]) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Group by schema and table
                const metadataMap = new Map<string, TableMetadata>();
                
                for (const row of rows) {
                    const key = `${row.table_schema}.${row.table_name}`;
                    
                    if (!metadataMap.has(key)) {
                        metadataMap.set(key, {
                            schema: row.table_schema,
                            table: row.table_name,
                            columns: []
                        });
                    }
                    
                    metadataMap.get(key)!.columns.push(row);
                }

                resolve(Array.from(metadataMap.values()));
            });
        });
    }

    async getTables(schema?: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT DISTINCT table_name
                FROM information_schema.tables
                WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            `;
            
            if (schema) {
                query += ` AND table_schema = '${schema}'`;
            }
            
            query += ` ORDER BY table_name`;

            this.connection.all(query, (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows.map(row => row.table_name));
            });
        });
    }

    async getSchemas(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT DISTINCT table_schema
                FROM information_schema.tables
                WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
                ORDER BY table_schema
            `;

            this.connection.all(query, (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows.map(row => row.table_schema));
            });
        });
    }

    dispose() {
        if (this.connection) {
            this.connection.close();
        }
        if (this.db) {
            this.db.close();
        }
    }
}

