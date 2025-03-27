/// <reference types="cypress" />
import { Table as Arrow } from "apache-arrow";

// Import types for type checking only

import { CREATE_TEST_TABLE, CSV_CONTENT, INSERT_TEST_DATA } from "../fixtures/test-data";

describe("DuckDB Integration", () => {
  beforeEach(() => {
    // Use the standard HTML file with added error handling
    cy.visit("/index.html");

    // Add error handling for any uncaught exceptions
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      // Return false to prevent the error from failing the test
      return false;
    });

    // Wait for DuckDB to initialize
    cy.waitForDuckDB();
  });

  it("should execute real DuckDB queries", () => {
    cy.window().then((win) => {
      // Ensure DuckDB is available on the window
      cy.wrap(win.duckdbInstance).should("exist");

      return win
        .runQuery(win.duckdbInstance, "SELECT 42 as answer")
        .then((result: Arrow) => {
          // Use cy.wrap() for proper Cypress assertions
          cy.wrap(result.numRows).should("equal", 1);
          const value = result.get(0)?.toArray()[0];
          cy.wrap(value).should("equal", 42);
        });
    });
  });

  it("should create and query tables using real DuckDB", () => {
    cy.window().then(async (win: Window) => {
      await win.runQuery(win.duckdbInstance, CREATE_TEST_TABLE);
      await win.runQuery(win.duckdbInstance, INSERT_TEST_DATA);
      const result = await win.runQuery(win.duckdbInstance, "SELECT * FROM test");

      cy.wrap(result.numRows).should("equal", 1);
      const row = result.get(0)?.toArray();
      cy.wrap(row?.[0]).should("equal", 1);
      cy.wrap(row?.[1]).should("equal", "test");
    });
  });

  it("should handle real CSV file imports", () => {
    cy.window().then(async (win: Window) => {
      const file = new File([CSV_CONTENT], "test.csv", { type: "text/csv" });

      await win.insertFile(win.duckdbInstance, file);
      const result = await win.runQuery(win.duckdbInstance, 'SELECT * FROM "test.csv"');

      cy.wrap(result.numRows).should("equal", 1);
      const row = result.get(0)?.toArray();
      cy.wrap(Number(row?.[0])).should("equal", 1);
      cy.wrap(row?.[1]).should("equal", "test");
    });
  });
});
