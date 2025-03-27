/// <reference types="cypress" />
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import type { Table } from "apache-arrow";

// Type definitions - use module augmentation pattern
declare global {
  interface Window {
    duckdbInstance: AsyncDuckDB;
    runQuery: (db: AsyncDuckDB, sql: string) => Promise<Table<any>>;
    tableNames: (db: AsyncDuckDB) => Promise<string[]>;
    insertFile: (db: AsyncDuckDB, file: File) => Promise<void>;
    __duckdbReady: boolean;
    __duckdbInitFailed?: boolean;
    __duckdbInitError?: string;
  }
}

// Our waitForDuckDB command is now defined in e2e.ts

export {};
