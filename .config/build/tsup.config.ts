import { defineConfig } from "tsup";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get the directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../../");

export default defineConfig({
  entry: [resolve(rootDir, "src/index.ts")],
  outDir: resolve(rootDir, "dist"),
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  clean: true,
  target: "es2020",
  shims: true,
});
