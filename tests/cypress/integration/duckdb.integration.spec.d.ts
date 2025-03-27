import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { Table as Arrow } from "apache-arrow";
declare global {
    interface Window {
        duckdbInstance: AsyncDuckDB;
        runQuery: (db: AsyncDuckDB, sql: string) => Promise<Arrow>;
        tableNames: (db: AsyncDuckDB) => Promise<string[]>;
        insertFile: (db: AsyncDuckDB, file: File) => Promise<void>;
        __duckdbReady: boolean;
    }
}
interface CustomCommands {
    waitForDuckDB(): Cypress.Chainable<Window & {
        duckdbInstance: AsyncDuckDB;
        runQuery: any;
        tableNames: any;
        insertFile: any;
    }>;
}
declare global {
    interface Cypress {
        Chainable: Cypress.Chainable & CustomCommands;
    }
}
export {};
