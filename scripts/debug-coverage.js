#!/usr/bin/env node

// Debug script to analyze code coverage issues
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get current directory in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define paths
const rootDir = path.resolve(__dirname, "../");

const configDir = path.resolve(rootDir, ".config");
const reportsDir = path.resolve(rootDir, ".reports");
const tempDir = path.resolve(rootDir, ".temp");

const coverageReportDir = path.resolve(reportsDir, "coverage");
const distCoveragePath = path.resolve(tempDir, "dist-coverage");

console.log("========================================");
console.log("Code Coverage Debug Tool");
console.log("========================================");

// Check .temp directory structure
console.log(`\nChecking .temp directory structure`);
if (fs.existsSync(tempDir)) {
  console.log(`✅ .temp directory exists: ${tempDir}`);
} else {
  console.log(`❌ .temp directory does not exist`);
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`Created .temp directory`);
}

// Check dist-coverage directory
console.log(`\nChecking instrumented code directory: ${distCoveragePath}`);
if (fs.existsSync(distCoveragePath)) {
  console.log(`✅ instrumented code directory exists`);

  // Check if index.js exists in dist-coverage
  const indexJsPath = path.resolve(distCoveragePath, "index.js");
  if (fs.existsSync(indexJsPath)) {
    const stats = fs.statSync(indexJsPath);
    console.log(`✅ index.js exists (${stats.size} bytes)`);

    // Check if file has istanbul coverage instrumentation
    try {
      const content = fs.readFileSync(indexJsPath, "utf8").slice(0, 1000); // Check first 1000 chars
      const hasInstrumentation =
        content.includes("cov_") || content.includes("__coverage__");
      console.log(
        `${hasInstrumentation ? "✅" : "❌"} File contains coverage instrumentation: ${hasInstrumentation}`,
      );
    } catch (e) {
      console.log(`❌ Error checking file for instrumentation: ${e.message}`);
    }
  } else {
    console.log(`❌ index.js not found in instrumented code directory`);
  }
} else {
  console.log(`❌ instrumented code directory does not exist`);
}

// Check reports directory
console.log(`\nChecking reports directory structure`);
if (fs.existsSync(reportsDir)) {
  console.log(`✅ .reports directory exists`);

  if (fs.existsSync(coverageReportDir)) {
    console.log(`✅ coverage report directory exists`);
    // Check if there are HTML reports
    try {
      const indexHtml = path.resolve(coverageReportDir, "index.html");
      if (fs.existsSync(indexHtml)) {
        console.log(`✅ coverage HTML report exists`);
      } else {
        console.log(`❌ coverage HTML report not found`);
      }
    } catch (e) {
      console.log(`❌ Error checking coverage reports: ${e.message}`);
    }
  } else {
    console.log(`❌ coverage report directory does not exist`);
  }
} else {
  console.log(`❌ .reports directory does not exist`);
}

// Check configuration files
console.log("\nChecking configuration files...");
const configFiles = [
  { path: path.resolve(configDir, "coverage/babel.config.cjs"), name: "Babel config" },
  {
    path: path.resolve(configDir, "coverage/vite.config.coverage.js"),
    name: "Vite coverage config",
  },
  { path: path.resolve(configDir, "coverage/nyc.config.js"), name: "NYC config" },
];

configFiles.forEach(({ path: filePath, name }) => {
  console.log(`\nChecking ${name}: ${filePath}`);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${name} exists`);

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");

      // Check for key patterns in each config
      if (name === "Babel config") {
        const hasIstanbul = fileContent.includes("istanbul");
        console.log(
          `${hasIstanbul ? "✅" : "❌"} Istanbul plugin in babel config: ${hasIstanbul}`,
        );
      } else if (name === "Vite coverage config") {
        const usesCorrectPath = fileContent.includes('".temp/dist-coverage"');
        console.log(
          `${usesCorrectPath ? "✅" : "❌"} Vite config uses .temp/dist-coverage: ${usesCorrectPath}`,
        );
      } else if (name === "NYC config") {
        const hasReportDir = fileContent.includes(".reports/coverage");
        console.log(
          `${hasReportDir ? "✅" : "❌"} NYC config uses .reports/coverage: ${hasReportDir}`,
        );
      }
    } catch (e) {
      console.log(`❌ Error checking ${name}: ${e.message}`);
    }
  } else {
    console.log(`❌ ${name} does not exist`);
  }
});

// Check test HTML file
console.log("\nChecking test HTML file...");
const testHtmlPath = path.resolve(rootDir, "tests/cypress/integration/index.html");
if (fs.existsSync(testHtmlPath)) {
  console.log("✅ test HTML file exists");

  // Check if it's using the correct script path
  try {
    const htmlContent = fs.readFileSync(testHtmlPath, "utf8");
    const scriptSrcMatch = htmlContent.match(/script\.src\s*=\s*['"]([^'"]+)['"]/);
    if (scriptSrcMatch) {
      const scriptSrc = scriptSrcMatch[1];
      console.log(`Found script.src = "${scriptSrc}" in test HTML`);
      const usesCorrectPath = scriptSrc.includes("/.temp/dist-coverage/");
      console.log(
        `${usesCorrectPath ? "✅" : "❌"} Test HTML uses .temp/dist-coverage path: ${usesCorrectPath}`,
      );
    } else {
      console.log("❌ Could not find script.src in test HTML");
    }
  } catch (e) {
    console.log(`❌ Error checking test HTML: ${e.message}`);
  }
} else {
  console.log("❌ test HTML file does not exist");
}

// Check package.json for coverage scripts
console.log("\nChecking package.json for coverage scripts...");
const packageJsonPath = path.resolve(rootDir, "package.json");
if (fs.existsSync(packageJsonPath)) {
  try {
    // Read and parse package.json manually rather than using require()
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    const scripts = packageJson.scripts || {};
    const coverageScripts = Object.keys(scripts).filter(
      (name) =>
        name.includes("coverage") ||
        (name.includes("test") && scripts[name].includes("coverage")),
    );

    if (coverageScripts.length > 0) {
      console.log("✅ Found coverage-related scripts:");
      coverageScripts.forEach((script) => {
        console.log(`- ${script}: ${scripts[script]}`);
      });
    } else {
      console.log("❌ No coverage-related scripts found");
    }

    // Check for coverage dependencies
    console.log("\nChecking for coverage dependencies...");
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const coverageDeps = [
      "@cypress/code-coverage",
      "nyc",
      "istanbul",
      "babel-plugin-istanbul",
      "istanbul-lib-coverage",
      "istanbul-lib-instrument",
    ];

    const foundDeps = coverageDeps.filter((dep) => allDeps[dep]);

    if (foundDeps.length > 0) {
      console.log("✅ Found coverage dependencies:");
      foundDeps.forEach((dep) => {
        console.log(`- ${dep}: ${allDeps[dep]}`);
      });
    } else {
      console.log("❌ No coverage dependencies found");
    }
  } catch (e) {
    console.log(`❌ Error loading package.json: ${e.message}`);
  }
} else {
  console.log("❌ package.json does not exist");
}

console.log("\n========================================");
console.log("Coverage Debug Summary");
console.log("========================================");

// Check environment variables
console.log("\nEnvironment variables:");
console.log(`NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
console.log(`BABEL_ENV: ${process.env.BABEL_ENV || "not set"}`);
console.log(`NYC_CONFIG: ${process.env.NYC_CONFIG || "not set"}`);
console.log(`NYC_OUTPUT: ${process.env.NYC_OUTPUT || "not set"}`);

console.log("\nTo run tests with coverage debugging enabled:");
console.log("COVERAGE_DEBUG=true pnpm test:cypress:coverage");

console.log("\nTo fix common coverage issues:");
console.log("1. Ensure the test HTML file points to /.temp/dist-coverage/index.js");
console.log(
  "2. Make sure instrumented code is built correctly (pnpm run build:coverage)",
);
console.log("3. Ensure .temp/dist-coverage directory exists and contains index.js");
console.log(
  "4. Verify that .config/coverage/ contains all necessary configuration files",
);
console.log("\n========================================");
