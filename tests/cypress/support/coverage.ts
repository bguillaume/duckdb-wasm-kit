// This file specifically configures code coverage support
import "@cypress/code-coverage/support";

// Coverage support file - defines the __coverage__ type consistently

// Define the __coverage__ property on Window to prevent duplicate definition errors
declare global {
  interface Window {
    __coverage__?: Record<string, any>;
  }

  // Use the standard Cypress namespace pattern (with eslint-disable)
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to save coverage data manually
       * @example cy.saveCoverage()
       */
      saveCoverage(): Chainable<void>;

      /**
       * Initialize coverage tracking
       * @example cy.initCoverage()
       */
      initCoverage(): Chainable<void>;
    }
  }
}

// Export an empty object to make this a proper ESM module
export {};
