#!/usr/bin/env node
// Run Cypress tests with enhanced code coverage collection
import { spawn, execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get the directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../");

// Set environment variables for coverage output paths - let @cypress/code-coverage create .nyc_output
process.env.NYC_REPORT_DIR = resolve(rootDir, ".reports/coverage/cypress");
process.env.COVERAGE_DEBUG = "true";
process.env.NODE_ENV = "test";
process.env.BABEL_ENV = "test";

console.log("Starting Cypress tests with enhanced code coverage collection");
console.log("Root directory:", rootDir);

// Ensure the coverage directory exists in the new location
const tempDir = resolve(rootDir, ".temp");
const distCoveragePath = resolve(tempDir, "dist-coverage");
const cypressCoverageDir = resolve(rootDir, ".reports/coverage/cypress");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`Created temp directory: ${tempDir}`);
}

if (!fs.existsSync(distCoveragePath)) {
  fs.mkdirSync(distCoveragePath, { recursive: true });
  console.log(`Created dist-coverage directory: ${distCoveragePath}`);
}

if (!fs.existsSync(cypressCoverageDir)) {
  fs.mkdirSync(cypressCoverageDir, { recursive: true });
  console.log(`Created Cypress coverage directory: ${cypressCoverageDir}`);
}

// Build instrumented code first to ensure it's ready for coverage
console.log("Building instrumented code for coverage...");
try {
  execSync("pnpm run build:coverage", {
    stdio: "inherit",
    cwd: rootDir,
    env: { ...process.env },
  });
  console.log("✅ Successfully built instrumented code");
} catch (error) {
  console.error("❌ Failed to build instrumented code:", error.message);
  process.exit(1);
}

// Start test server in background
console.log("Starting test server with coverage instrumentation...");
const serverProcess = spawn(
  "node",
  [resolve(rootDir, "scripts/cypress-test-server.mjs")],
  {
    stdio: "inherit",
    env: { ...process.env },
  },
);

// Give the server some time to start
console.log("Waiting 1 seconds for the test server to start...");
await new Promise((resolve) => setTimeout(resolve, 1000));

// Run the Cypress tests
const specFile = process.argv[2] || "tests/cypress/integration/**/*.spec.ts";
const configFile = process.argv[3] || ".config/test/cypress.config.js";

console.log(`Running Cypress tests with spec: ${specFile}`);
console.log(`Using config file: ${configFile}`);

try {
  // Run Cypress with specific configuration
  execSync(`npx cypress run --config-file ${configFile} --spec "${specFile}"`, {
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log("Cypress tests completed successfully!");
} catch (error) {
  console.error("Cypress tests failed:", error.message);
  process.exitCode = 1;
} finally {
  // Ensure we kill the server process
  console.log("Shutting down test server...");
  serverProcess.kill();

  // Generate coverage report using NYC
  console.log("Generating coverage report...");
  try {
    // Use NYC to generate reports directly to the correct location
    // Let NYC find the .nyc_output directory automatically
    execSync(
      `npx nyc report --nycrc-path .config/coverage/nyc.config.js --report-dir .reports/coverage/cypress`,
      {
        stdio: "inherit",
        cwd: rootDir,
      },
    );

    console.log("✅ Coverage report generated successfully!");
    console.log(
      `Coverage reports can be found in: ${resolve(rootDir, ".reports/coverage/cypress")}`,
    );
  } catch (error) {
    console.error("❌ Error generating coverage report:", error.message);
  }
}
