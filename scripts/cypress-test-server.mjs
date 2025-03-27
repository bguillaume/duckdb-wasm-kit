#!/usr/bin/env node
// Cypress test server with improved file serving
import { createServer } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import react from "@vitejs/plugin-react";
import fs from "fs";

// Get the directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../");

// Set environment variables for test and coverage
process.env.NODE_ENV = "test";
process.env.BABEL_ENV = "test";

// Define paths
const configDir = resolve(rootDir, ".config");
const tempDir = resolve(rootDir, ".temp");

const babelConfigPath = resolve(configDir, "coverage/babel.config.cjs");
const distPath = resolve(rootDir, "dist");
const distCoveragePath = resolve(tempDir, "dist-coverage");

const testHtmlPath = resolve(rootDir, "tests/cypress/integration/index.html");

// Ensure necessary directories exist
[tempDir, distCoveragePath, dirname(testHtmlPath)].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Validate configuration files
if (fs.existsSync(babelConfigPath)) {
  console.log(`✅ Using Babel config: ${babelConfigPath}`);
} else {
  console.error(`❌ Babel config not found: ${babelConfigPath}`);
}

// Log script source path from HTML
function checkTestHTML() {
  if (fs.existsSync(testHtmlPath)) {
    try {
      const content = fs.readFileSync(testHtmlPath, "utf8");
      const scriptSrcMatch = content.match(/script\.src\s*=\s*['"]([^'"]+)['"]/);
      if (scriptSrcMatch) {
        console.log(`Found script.src = "${scriptSrcMatch[1]}" in test HTML`);
      }
    } catch (err) {
      console.error(`Error checking test HTML: ${err}`);
    }
  } else {
    console.error(`Test HTML file not found at ${testHtmlPath}`);
  }
}

checkTestHTML();

async function startServer() {
  console.log("Starting Cypress test server with code coverage...");

  // Create Vite server
  const server = await createServer({
    root: rootDir,
    server: {
      port: 5022,
      host: true,
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify("test"),
      global: "window",
    },
    plugins: [
      react({
        babel: {
          configFile: babelConfigPath,
          plugins: [
            [
              "istanbul",
              {
                include: ["src/**/*.ts", "src/**/*.tsx"],
                exclude: [
                  "**/*.d.ts",
                  "**/*.spec.ts",
                  "**/*.test.ts",
                  "**/tests/**",
                  "**/node_modules/**",
                ],
              },
            ],
          ],
        },
      }),
      // Custom plugin to handle root URL requests
      {
        name: "serve-test-html",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Serve the test HTML file at the root URL
            if (req.url === "/" || req.url === "/index.html") {
              try {
                if (fs.existsSync(testHtmlPath)) {
                  const content = fs.readFileSync(testHtmlPath, "utf-8");
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "text/html");
                  res.end(content);
                  console.log(`Served test page from ${testHtmlPath}`);
                  return;
                } else {
                  console.error(`Test HTML file not found at ${testHtmlPath}`);
                }
              } catch (error) {
                console.error(`Error serving test HTML: ${error.message}`);
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
      alias: {
        "@": resolve(rootDir, "src"),
        src: resolve(rootDir, "src"),
      },
    },
    build: {
      sourcemap: true,
    },
    css: {
      devSourcemap: true,
    },
    optimizeDeps: {
      exclude: ["src", "@duckdb/duckdb-wasm"],
    },
  });

  await server.listen();
  server.printUrls();

  console.log("Code coverage instrumentation is enabled");

  // Validate key files exist
  const validateFiles = [
    { path: testHtmlPath, name: "Test HTML file" },
    { path: resolve(distPath, "index.js"), name: "Distribution file" },
    { path: resolve(distCoveragePath, "index.js"), name: "Instrumented file" },
  ];

  validateFiles.forEach((file) => {
    if (fs.existsSync(file.path)) {
      console.log(`✅ ${file.name} found: ${file.path}`);
      if (file.name === "Instrumented file") {
        const stats = fs.statSync(file.path);
        console.log(`   File size: ${stats.size} bytes`);
      }
    } else {
      console.error(`❌ ${file.name} not found: ${file.path}`);
    }
  });

  // Handle process termination
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}

// Start the server
startServer().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
