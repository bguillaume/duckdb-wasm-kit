// Cypress E2E Test Support File
//
// Import commands.js using ES2015 syntax:
import "./commands";
import "@cypress/code-coverage/support";
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import type { Table } from "apache-arrow";

Cypress.on("window:before:load", () => {
  console.log("[Support] Cypress support file loaded");
});

// Type definitions for the window object
declare global {
  interface Window {
    duckdbInstance: AsyncDuckDB;
    duckdbWasm: any; // For direct access to the DuckDB wasm module
    apacheArrow: any; // For direct access to the Arrow library
    runQuery: (db: AsyncDuckDB, sql: string) => Promise<Table<any>>;
    tableNames: (db: AsyncDuckDB) => Promise<string[]>;
    insertFile: (db: AsyncDuckDB, file: File) => Promise<void>;
    __duckdbReady: boolean;
    __duckdbInitFailed?: boolean;
    __duckdbInitError?: string;
    __coverage__: any; // For coverage tracking
    sendCoverageData?: () => Promise<void>;
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to wait for DuckDB initialization
       */
      waitForDuckDB(options?: { timeout?: number; interval?: number }): Chainable<void>;
    }
  }
}

// Wait for DuckDB to initialize before running tests - optimized for the working index.html
Cypress.Commands.add("waitForDuckDB", (options = {}) => {
  const timeout = options.timeout || 10000;

  cy.log("Waiting for DuckDB to initialize...");

  // Use cy.window with proper retry semantics
  cy.window({ timeout }).should((win) => {
    // Check if DuckDB is ready
    if (!win.__duckdbReady) {
      throw new Error("DuckDB not yet initialized");
    }

    // Verify the required DuckDB methods are available
    if (!win.duckdbInstance) {
      throw new Error("DuckDB instance not available");
    }

    if (typeof win.runQuery !== "function") {
      throw new Error("runQuery function not available");
    }

    if (typeof win.tableNames !== "function") {
      throw new Error("tableNames function not available");
    }

    if (typeof win.insertFile !== "function") {
      throw new Error("insertFile function not available");
    }

    // All checks passed
    return true;
  });

  cy.log("DuckDB initialized successfully");
});

// Force coverage collection at the end of each test
afterEach(() => {
  cy.window().then((win) => {
    if (win.sendCoverageData) {
      cy.log("Sending coverage data after test...");
      return win.sendCoverageData();
    }
  });
});

export {};
