import { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import { Table as Arrow } from 'apache-arrow';
declare global {
    interface Window {
        duckdbInstance: AsyncDuckDB;
        runQuery: (db: AsyncDuckDB, sql: string) => Promise<Arrow>;
        insertFile: (db: AsyncDuckDB, file: File) => Promise<void>;
        __duckdbReady: boolean;
    }
}
