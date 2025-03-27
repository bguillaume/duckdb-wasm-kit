// Vite config for coverage instrumentation (ESM)
import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import fs from "fs";

// Get the directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");

console.log("Building instrumented code for coverage...");
console.log("Root directory:", rootDir);

// Find all TypeScript files in the src directory
const srcDir = path.resolve(rootDir, "src");
const srcFiles = [];
function findTsFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findTsFiles(filePath);
    } else if (
      (file.endsWith(".ts") || file.endsWith(".tsx")) &&
      !file.endsWith(".d.ts") &&
      !file.includes(".test.") &&
      !file.includes(".spec.")
    ) {
      srcFiles.push(path.relative(rootDir, filePath).replace(/\\/g, "/"));
    }
  }
}
findTsFiles(srcDir);
console.log(`Found ${srcFiles.length} TypeScript files to instrument`);

// Create .temp directory if it doesn't exist
const tempDir = path.resolve(rootDir, ".temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create a physical entry file that imports all source files
const entryFilePath = path.resolve(tempDir, "coverage-entry.ts"); // Store in .temp directory
const importStatements = srcFiles.map((file) => `import "../${file}";`).join("\n");

const entryContent = `
// Generated entry file for code coverage - imports all source files
import * as mainExports from "../src/index";

// Import all source files to ensure they're included in the bundle
${importStatements}

// Re-export everything from the main entry point
export * from "../src/index";
export default mainExports;
`;

// Write the entry file
fs.writeFileSync(entryFilePath, entryContent);
console.log(`Created entry file at ${entryFilePath}`);

// Create a custom plugin for istanbul instrumentation
function createIstanbulPlugin() {
  return {
    name: "istanbul-instrument",
    enforce: "pre",
    async transform(code, id) {
      if (!id.includes("/src/") || id.includes("node_modules") || id.includes(".d.ts")) {
        return null;
      }

      console.log(`Instrumenting: ${path.relative(rootDir, id)}`);

      // Import Babel directly for more control
      const babel = await import("@babel/core");
      const result = await babel.transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        presets: [
          ["@babel/preset-env", { targets: { node: "current" }, modules: false }],
          "@babel/preset-typescript",
          "@babel/preset-react",
        ],
        plugins: [
          [
            "istanbul",
            {
              extension: [".js", ".ts", ".jsx", ".tsx"],
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
      });

      return result;
    },
  };
}

export default defineConfig({
  root: rootDir,
  configFile: false, // Don't look for other config files
  plugins: [createIstanbulPlugin(), react()],
  build: {
    outDir: ".temp/dist-coverage", // Moved to .temp directory
    sourcemap: true,
    lib: {
      entry: entryFilePath, // Use the entry file in .temp directory
      name: "duckdbWasmKit",
      formats: ["umd"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      output: {
        name: "duckdbWasmKit",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "apache-arrow": "apacheArrow",
          "@duckdb/duckdb-wasm": "duckdb",
        },
        format: "umd",
        exports: "named",
        inlineDynamicImports: true,
      },
      external: ["react", "react-dom", "apache-arrow", "@duckdb/duckdb-wasm"],
      treeshake: false, // Critical: don't eliminate code coverage instrumentation
    },
    minify: false,
    emptyOutDir: true,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("test"),
    global: "window",
  },
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    alias: {
      "@": path.resolve(rootDir, "src"),
      src: path.resolve(rootDir, "src"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Explicitly define TS options instead of using a config file
      tsconfig: false,
      tsconfigRaw: {
        compilerOptions: {
          target: "esnext",
          module: "esnext",
          moduleResolution: "node",
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          jsx: "react-jsx",
        },
      },
    },
  },
});
