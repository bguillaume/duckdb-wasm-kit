#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { spawnSync } from "child_process";
// import { createRequire } from "module";

// const require = createRequire(import.meta.url);

// Get the current directory in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Define important paths
// const nycOutputDir = path.resolve(rootDir, ".nyc_output");
// const coverageFile = path.resolve(nycOutputDir, "out.json");
const reportsDir = path.resolve(rootDir, ".reports");
const coverageReportDir = path.resolve(reportsDir, "coverage");
const configDir = path.resolve(rootDir, ".config");
const nycConfigPath = path.resolve(configDir, "coverage/nyc.config.js");

// Ensure directories exist
// if (!fs.existsSync(nycOutputDir)) {
//   fs.mkdirSync(nycOutputDir, { recursive: true });
// }

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// // Check if we have Cypress coverage data and merge it
// const cypressCoverageFile = path.resolve(rootDir, ".nyc_output/out.json");
// if (fs.existsSync(cypressCoverageFile)) {
//   console.log("Merging Cypress coverage data...");

//   try {
//     // Import NYC programmatically to merge coverage data
//     const NYC = require("nyc");
//     const nyc = new NYC({
//       tempDir: nycOutputDir,
//       reportDir: coverageReportDir,
//       cwd: rootDir,
//       nycrcPath: nycConfigPath,
//     });

//     // Merge coverage data
//     nyc.mergeCoverage();
//     console.log("Coverage data merged successfully");
//   } catch (error) {
//     console.error("Error merging coverage data:", error);
//   }
// }

// Generate the coverage report
console.log("Generating coverage report...");
try {
  const nycBin = path.resolve(rootDir, "node_modules/.bin/nyc");
  const args = [
    "report",
    "--reporter=lcov",
    "--reporter=text-summary",
    "--report-dir=" + coverageReportDir,
  ];

  if (fs.existsSync(nycConfigPath)) {
    args.push("--nycrc-path=" + nycConfigPath);
  }

  const result = spawnSync(nycBin, args, {
    cwd: rootDir,
    stdio: "inherit",
    env: { ...process.env, NYC_CONFIG_PATH: nycConfigPath },
  });

  if (result.status === 0) {
    console.log(`Coverage report generated successfully in ${coverageReportDir}`);

    // Output the location of the HTML report
    const htmlReportPath = path.resolve(coverageReportDir, "index.html");
    if (fs.existsSync(htmlReportPath)) {
      console.log(`HTML report: file://${htmlReportPath}`);
    }
  } else {
    console.error(
      "Failed to generate coverage report:",
      result.stderr?.toString() || "Unknown error",
    );
  }
} catch (error) {
  console.error("Error generating coverage report:", error);
}
