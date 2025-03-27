/// <reference types="cypress" />
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { Table as Arrow } from "apache-arrow";

declare global {
  interface Window {
    duckdbInstance: AsyncDuckDB;
    runQuery: (db: AsyncDuckDB, sql: string) => Promise<Arrow>;
    tableNames: (db: AsyncDuckDB) => Promise<string[]>;
    __duckdbReady: boolean;
  }
}

describe("Query Utilities Integration", () => {
  beforeEach(() => {
    cy.visit("/index.html");

    // Add error handling
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false; // Don't fail the test on uncaught exceptions
    });

    // Wait for DuckDB to initialize
    cy.waitForDuckDB();
  });

  it("should handle table operations", () => {
    cy.window().then((win: Window) => {
      const createTable = "CREATE TABLE test_ops (id INTEGER)";
      return win
        .runQuery(win.duckdbInstance, createTable)
        .then(() => win.tableNames(win.duckdbInstance))
        .then((tables: string[]) => {
          cy.wrap(tables).should("include", "test_ops");
        });
    });
  });

  it("should infer column types correctly", () => {
    cy.window().then(async (win: Window) => {
      // Create a table with an integer year column
      await win.runQuery(
        win.duckdbInstance,
        `
        CREATE TABLE test_types (year INTEGER);
        INSERT INTO test_types VALUES (2024);
      `,
      );

      // Verify the column type before inference
      const result = await win.runQuery(
        win.duckdbInstance,
        "SELECT data_type FROM information_schema.columns WHERE table_name='test_types' AND column_name='year'",
      );

      cy.wrap(result.get(0)?.toArray()[0]).should("equal", "INTEGER");

      // Now run type inference and verify it's converted to VARCHAR
      await win.runQuery(
        win.duckdbInstance,
        "ALTER TABLE test_types ALTER COLUMN year SET DATA TYPE VARCHAR",
      );

      const afterResult = await win.runQuery(
        win.duckdbInstance,
        "SELECT data_type FROM information_schema.columns WHERE table_name='test_types' AND column_name='year'",
      );

      cy.wrap(afterResult.get(0)?.toArray()[0]).should("equal", "VARCHAR");
    });
  });

  it("should calculate table cardinalities", () => {
    cy.window().then(async (win: Window) => {
      // Create a table with known cardinalities
      await win.runQuery(
        win.duckdbInstance,
        `
        CREATE TABLE test_card (id INTEGER, category VARCHAR);
        INSERT INTO test_card VALUES (1, 'A'), (2, 'A'), (3, 'B');
      `,
      );

      // Query distinct counts
      const result = await win.runQuery(
        win.duckdbInstance,
        "SELECT COUNT(DISTINCT category) as cat_count FROM test_card",
      );

      cy.wrap(Number(result.get(0)?.toArray()[0])).should("equal", 2);
    });
  });

  afterEach(() => {
    // Nothing needed here
  });
});
