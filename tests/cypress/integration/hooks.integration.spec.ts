/// <reference types="cypress" />
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { Table as Arrow } from "apache-arrow";

declare global {
  interface Window {
    duckdbInstance: AsyncDuckDB;
    runQuery: (db: AsyncDuckDB, sql: string) => Promise<Arrow>;
    __duckdbReady: boolean;
  }
}

describe("React Hooks Integration", () => {
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

  it("should handle concurrent queries with real DuckDB", () => {
    cy.window().then(async (win: Window) => {
      // Run multiple queries simultaneously
      const queries = [
        win.runQuery(win.duckdbInstance, "SELECT 1 AS num"),
        win.runQuery(win.duckdbInstance, "SELECT 2 AS num"),
        win.runQuery(win.duckdbInstance, "SELECT 3 AS num"),
      ];

      const results = await Promise.all(queries);

      // Verify all results
      expect(results.length).to.equal(3);

      // Convert Arrow tables to regular objects for easier assertions
      const result1 = results[0].toArray();
      const result2 = results[1].toArray();
      const result3 = results[2].toArray();

      expect(result1[0].num).to.equal(1);
      expect(result2[0].num).to.equal(2);
      expect(result3[0].num).to.equal(3);
    });
  });

  it("should maintain state between queries", () => {
    cy.window().then(async (win: Window) => {
      // Create a table
      await win.runQuery(
        win.duckdbInstance,
        "CREATE TABLE temp_table (id INTEGER, value VARCHAR)",
      );

      // Insert data
      await win.runQuery(
        win.duckdbInstance,
        "INSERT INTO temp_table VALUES (1, 'test1'), (2, 'test2')",
      );

      // Query again to check state persistence
      const result = await win.runQuery(
        win.duckdbInstance,
        "SELECT * FROM temp_table ORDER BY id",
      );

      // Convert Arrow table to regular array of objects
      const rows = result.toArray();

      // Verify persistence
      expect(rows.length).to.equal(2);
      expect(rows[0].id).to.equal(1);
      expect(rows[0].value).to.equal("test1");
      expect(rows[1].id).to.equal(2);
      expect(rows[1].value).to.equal("test2");
    });
  });

  afterEach(() => {
    // Nothing needed here
  });
});
