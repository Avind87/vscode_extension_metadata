// Type declarations for duckdb module
declare module 'duckdb' {
    export class Database {
        constructor(path: string, callback?: (err: Error | null, db: Database) => void);
        connect(callback?: (err: Error | null, conn: Connection) => void): Connection;
        close(callback?: (err: Error | null) => void): void;
    }

    export class Connection {
        all(sql: string, callback: (err: Error | null, rows: any[]) => void): void;
        run(sql: string, callback?: (err: Error | null, result: any) => void): void;
        close(callback?: (err: Error | null) => void): void;
    }
}

