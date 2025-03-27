import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
interface DuckDBWindow extends Window {
    duckdbInstance: AsyncDuckDB;
    runQuery: (db: AsyncDuckDB, sql: string) => Promise<any>;
    tableNames: (db: AsyncDuckDB) => Promise<string[]>;
    insertFile: (db: AsyncDuckDB, file: File) => Promise<void>;
    __duckdbReady: boolean;
}
declare global {
    interface CypressCustom {
        waitForDuckDB: () => Cypress.Chainable<DuckDBWindow>;
    }
    interface Cypress {
        Chainable: Cypress.Chainable & CypressCustom;
    }
}
export {};
