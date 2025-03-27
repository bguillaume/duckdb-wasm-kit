import type { Config } from "jest";
import * as path from "path";

const config: Config = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { useESM: true }],
  },
  rootDir: "../../",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Add module mapping to handle .js extensions in import paths
    "^(.*)\\.js$": "$1",
  },
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/tests/jest/**/*.test.ts?(x)"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  coverageDirectory: path.resolve(__dirname, "../../coverage/jest"),
  setupFilesAfterEnv: ["<rootDir>/tests/jest/setupTests.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testPathIgnorePatterns: ["/node_modules/"],
};

export default config;
