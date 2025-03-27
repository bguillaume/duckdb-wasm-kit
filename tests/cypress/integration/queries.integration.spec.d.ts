import { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import { Table as Arrow } from 'apache-arrow';
declare global {
    interface Window {
        duckdbInstance: AsyncDuckDB;
        runQuery: (db: AsyncDuckDB, sql: string) => Promise<Arrow>;
        tableNames: (db: AsyncDuckDB) => Promise<string[]>;
        __duckdbReady: boolean;
    }
}
