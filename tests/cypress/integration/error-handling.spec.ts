/// <reference types="cypress" />

describe("Error Handling", () => {
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

  it("should handle invalid SQL gracefully", () => {
    cy.window().then((win: Window) => {
      // Use Cypress-friendly error handling pattern
      const queryPromise = win.runQuery(win.duckdbInstance, "INVALID SQL");

      // Explicitly return false to prevent the test from failing due to the expected error
      cy.on("fail", (err) => {
        expect(err.message).to.include("syntax error");
        return false;
      });

      // Execute the query that we expect to fail
      cy.wrap(queryPromise, { timeout: 10000 })
        .then(() => {
          // This should not be reached
          throw new Error("Query should have failed but did not");
        })
        .as("failedQuery");

      // Handle error in a separate step
      cy.get("@failedQuery").then({ timeout: 10000 }, () => {
        // The promise should have rejected, so we shouldn't get here
        throw new Error("Query should have failed but did not");
      });

      // Use cy.on to handle the error correctly
      cy.on("fail", (err) => {
        expect(err.message).to.include("syntax error");
        cy.log("✅ SQL error correctly handled");
        return false; // Prevent the test from failing
      });
    });
  });

  it("should handle invalid file imports", () => {
    cy.window().then((win: Window) => {
      const invalidFile = new File(["invalid"], "test.invalid", { type: "invalid/type" });

      // Use Cypress-friendly error handling pattern
      const importPromise = win.insertFile(win.duckdbInstance, invalidFile);

      // Execute the import that we expect to fail
      cy.wrap(importPromise, { timeout: 10000 })
        .then(() => {
          // This should not be reached
          throw new Error("File import should have failed but did not");
        })
        .as("failedImport");

      // Handle error in a separate step
      cy.get("@failedImport").then({ timeout: 10000 }, () => {
        // The promise should have rejected, so we shouldn't get here
        throw new Error("File import should have failed but did not");
      });

      // Use cy.on to handle the error correctly
      cy.on("fail", (err) => {
        expect(err.message).to.include("Sorry, we couldn't import that file");
        cy.log("✅ File import error correctly handled");
        return false; // Prevent the test from failing
      });
    });
  });

  afterEach(() => {
    // Nothing needed here
  });
});
