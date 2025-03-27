import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");

/**
 * @type {import('webpack').Configuration}
 */
const config = {
  mode: "development",
  entry: path.resolve(rootDir, "src/index.ts"),
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-typescript"],
            plugins: [
              // Use babel-plugin-istanbul for code coverage instrumentation
              [
                "istanbul",
                {
                  exclude: [
                    "**/*.spec.ts",
                    "**/*.spec.tsx",
                    "**/node_modules/**",
                    "**/tests/**",
                    "**/dist*/**",
                  ],
                },
              ],
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    // Add extensionAlias to handle .js imports in TypeScript files
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    },
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "../../.temp/dist-coverage"),
    library: {
      name: "duckdbWasmKit",
      type: "umd",
      // export all module exports to window.duckdbWasmKit
    },
    globalObject: "this",
  },
};

export default config;
