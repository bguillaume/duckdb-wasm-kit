// NYC (Istanbul) configuration for coverage reporting
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../../");

export default {
  // Define output directories with absolute paths to avoid path resolution issues
  "report-dir": resolve(rootDir, ".reports/coverage/cypress"),

  // Temporary output directory
  "temp-dir": resolve(rootDir, ".config/test/.nyc_output"),

  // Reporter types
  reporter: ["html", "lcov", "text-summary", "clover"],

  // Include all files in the src directory
  include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/**/*.jsx"],

  // Exclude test files, configuration files, and build artifacts
  exclude: [
    "node_modules/**",
    "tests/**",
    "coverage/**",
    "dist/**",
    "dist-coverage/**",
    "**/*.spec.*",
    "**/*.test.*",
    "**/__tests__/**",
    "**/__mocks__/**",
    "config/**",
  ],

  // Type of instrumentation for Istanbul
  "check-coverage": false,
  all: true,

  // Thresholds if check-coverage is enabled
  branches: 70,
  functions: 70,
  lines: 70,
  statements: 70,

  // TypeScript and JS extensions to include
  extension: [".js", ".ts", ".tsx", ".jsx"],

  // Enable source map support
  "enable-source-map": true,

  // Use babel for instrumentation
  "instrument-babel": true,

  // Skip empty sources
  "skip-empty": true,

  // Use embedded source maps when available
  "preserve-comments": false,

  // Produce cacheable source-maps
  "produce-source-map": true,
};
