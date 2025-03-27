// Pure ES module version of Cypress configuration
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "cypress";
import codeCoverageTask from "@cypress/code-coverage/task.js";
import fs from "fs";

// Get the directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../../");

// Set NODE_ENV for tests
process.env.NODE_ENV = "test";

export default defineConfig({
  e2e: {
    specPattern: resolve(
      __dirname,
      "../../tests/cypress/integration/**/*.spec.{js,jsx,ts,tsx}",
    ),
    supportFile: resolve(__dirname, "../../tests/cypress/support/e2e.ts"),
    // Fix port to match the server (5022)
    baseUrl: "http://localhost:5022",
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    // Updated paths for screenshots and downloads to use the .temp directory
    screenshotsFolder: resolve(rootDir, ".temp/cypress/screenshots"),
    downloadsFolder: resolve(rootDir, ".temp/cypress/downloads"),
    setupNodeEvents(on, config) {
      // Configure code coverage task with correct paths
      config.env.codeCoverageTasksRegistered = true;

      // Set the correct output paths for coverage
      // process.env.NYC_OUTPUT = resolve(rootDir, ".nyc_output");
      // process.env.NYC_REPORT_DIR = resolve(rootDir, "coverage/cypress");

      // Register code coverage task with updated configuration
      codeCoverageTask(on, config);

      // Add custom tasks for coverage collection
      on("task", {
        "coverage:save": (coverage) => {
          if (!coverage) return null;

          try {
            const nycOutputDir = resolve(rootDir, ".nyc_output");
            const coverageFile = resolve(nycOutputDir, "out.json");
            const testNycOutputDir = resolve(rootDir, "config/test/.nyc_output");
            const testCoverageFile = resolve(testNycOutputDir, "out.json");

            // Make sure directory exists
            // if (!fs.existsSync(nycOutputDir)) {
            //   fs.mkdirSync(nycOutputDir, { recursive: true });
            // }
            if (!fs.existsSync(testNycOutputDir)) {
              fs.mkdirSync(testNycOutputDir, { recursive: true });
            }

            // Check if file exists and read existing coverage
            let existingCoverage = {};
            if (fs.existsSync(coverageFile)) {
              try {
                const content = fs.readFileSync(coverageFile, "utf8");
                if (content && content !== "{}") {
                  existingCoverage = JSON.parse(content);
                }
              } catch (err) {
                console.warn("Error reading existing coverage:", err);
              }
            }

            // Merge with new coverage
            const mergedCoverage = { ...existingCoverage, ...coverage };

            // Write the coverage data
            // fs.writeFileSync(coverageFile, JSON.stringify(mergedCoverage), "utf8");
            // console.log(`[Coverage] Saved coverage data to ${coverageFile}`);

            // Also save to config/test/.nyc_output as the primary location
            fs.writeFileSync(testCoverageFile, JSON.stringify(mergedCoverage), "utf8");
            console.log(`[Coverage] Also saved coverage data to ${testCoverageFile}`);

            return {
              saved: true,
              fileCount: Object.keys(coverage).length,
              totalFileCount: Object.keys(mergedCoverage).length,
              primaryPath: testCoverageFile,
              secondaryPath: coverageFile,
            };
          } catch (err) {
            console.error("Error saving coverage data:", err);
            return { saved: false, error: err.message };
          }
        },
      });

      // Expose environment variables to tests
      config.env = {
        ...config.env,
        codeCoverageEnabled: true,
        nycOutputDir: resolve(rootDir, ".nyc_output"),
        testNycOutputDir: resolve(rootDir, "config/test/.nyc_output"),
      };

      return config;
    },
  },
});
