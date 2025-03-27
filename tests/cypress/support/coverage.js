// Helper file to manage code coverage collection in Cypress tests
import "@cypress/code-coverage/support";

// Configure coverage to only use the project root
if (window.Cypress) {
  // Ensure window.__coverage__ exists
  window.__coverage__ = window.__coverage__ || {};

  console.log("[Coverage Support] Initialized code coverage tracking");

  // Add a before hook to run once before all tests
  before(() => {
    // Ensure the coverage object exists in the window
    cy.window().then((win) => {
      win.__coverage__ = win.__coverage__ || {};
    });
  });

  // Add a beforeEach hook to ensure coverage object exists at the start of each test
  beforeEach(() => {
    cy.window().then((win) => {
      win.__coverage__ = win.__coverage__ || {};
      console.log("[Coverage] Coverage object initialized for test");
    });
  });

  // Define a helper function to send coverage data
  const sendCoverageData = (coverageData) => {
    if (!coverageData || Object.keys(coverageData).length === 0) {
      console.warn("[Coverage] No coverage data to send");
      return;
    }

    console.log(
      `[Coverage] Sending coverage data with ${Object.keys(coverageData).length} entries`,
    );

    // Use the built-in cypress-istanbul method to save coverage directly to root
    cy.task("coverage:save", coverageData, { log: false });
  };

  // Add an afterEach hook to save coverage data after each test
  afterEach(() => {
    cy.window().then((win) => {
      if (win.__coverage__) {
        console.log(
          "[Coverage] Saving coverage data after test:",
          Object.keys(win.__coverage__).length,
          "coverage objects",
        );

        sendCoverageData(win.__coverage__);
      } else {
        console.warn("[Coverage] No coverage data found after test");
      }
    });
  });

  // Make sure coverage is also saved at the end of all tests
  after(() => {
    cy.window().then((win) => {
      if (win.__coverage__) {
        console.log("[Coverage] Saving final coverage data");
        sendCoverageData(win.__coverage__);
      }
    });
  });

  // Add event handlers to intercept and save coverage on page loads and redirects
  Cypress.on("window:before:load", (win) => {
    win.__coverage__ = win.__coverage__ || {};
  });

  // Add a command to manually trigger coverage collection
  Cypress.Commands.add("saveCoverage", () => {
    cy.window().then((win) => {
      if (win.__coverage__) {
        sendCoverageData(win.__coverage__);
      } else {
        console.warn("No coverage data available to save");
      }
    });
  });
}

// Export an empty object to make this a proper ESM module
export {};
