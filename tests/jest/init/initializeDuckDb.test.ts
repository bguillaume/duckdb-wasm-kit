/**
 * Tests for initializeDuckDb.ts
 */
import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
// import * as duckdb from "@duckdb/duckdb-wasm";
// import { DuckDBBundles } from "@duckdb/duckdb-wasm/dist/types/src/platform";
import "../mocks/duckdb";
import { mockAsyncDuckDB } from "../mocks/duckdb";

// Define types for the bundle structure to help TypeScript
type BundleType = {
  mainWorker: string;
  mainModule: string;
};

// Mock the entire duckdb module
jest.mock("@duckdb/duckdb-wasm", () => {
  const bundles = {
    mvp: {
      mainWorker: "worker.js",
      mainModule: "module.wasm",
    },
    eh: {
      mainWorker: "worker-eh.js",
      mainModule: "module-eh.wasm",
    },
  };

  return {
    getJsDelivrBundles: jest.fn().mockReturnValue(bundles),
    selectBundle: jest.fn().mockImplementation(() =>
      Promise.resolve({
        mainWorker: "worker.js",
        mainModule: "module.wasm",
      } as BundleType),
    ),
    DuckDBDataProtocol: {
      BROWSER_FILEREADER: "browser_filereader",
      BROWSER_FSA: "browser_fsa",
      HTTP: "http",
      HTTPS: "https",
      NODE_FS: "node_fs",
      NODE_BUFFER: "node_buffer",
    },
    LogLevel: {
      TRACE: 0,
      DEBUG: 1,
      INFO: 2,
      WARN: 3,
      ERROR: 4,
    },
    ConsoleLogger: jest.fn(),
    AsyncDuckDB: jest.fn().mockImplementation(() => mockAsyncDuckDB),
  };
});

// Reset modules before each test to ensure clean state
jest.mock("../../../src/util/perf", () => ({
  logElapsedTime: jest.fn(),
}));

// Need to use dynamic import to properly mock the module
const importModule = () => import("../../../src/init/initializeDuckDb");

describe("initializeDuckDb", () => {
  // Save original console.log
  const originalConsoleLog = console.log;
  const consoleSpy = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    // Mock console.log
    console.log = consoleSpy;

    // Mock URL functions with proper type casting
    global.URL.createObjectURL = jest.fn().mockImplementation(function (_blob: unknown) {
      return "blob-url";
    }) as unknown as typeof URL.createObjectURL;

    global.URL.revokeObjectURL = jest.fn() as unknown as typeof URL.revokeObjectURL;

    // Mock Worker
    global.Worker = jest.fn() as unknown as typeof Worker;

    // Mock fetch for config file with more explicit type handling
    global.fetch = jest.fn().mockImplementation(() => {
      const mockArrayBuffer = () => Promise.resolve(new ArrayBuffer(10));
      return Promise.resolve({
        ok: true,
        arrayBuffer: mockArrayBuffer,
      } as unknown as Response);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;
    jest.clearAllMocks();
  });

  it("should initialize DuckDB instance", async () => {
    const { default: initializeDuckDb } = await importModule();

    const db = await initializeDuckDb();

    expect(db).toBe(mockAsyncDuckDB);
    expect(consoleSpy).toHaveBeenCalledWith("Initializing DuckDB...");
    expect(consoleSpy).toHaveBeenCalledWith("DuckDB initialized successfully.");
  });

  it("should reuse existing DuckDB instance", async () => {
    const { default: initializeDuckDb } = await importModule();

    // Initialize first time
    await initializeDuckDb();
    consoleSpy.mockClear();

    // Initialize second time
    const db = await initializeDuckDb();

    expect(db).toBe(mockAsyncDuckDB);
    expect(consoleSpy).toHaveBeenCalledWith("Initializing DuckDB...");
    expect(consoleSpy).toHaveBeenCalledWith("Using existing DuckDB instance.");
  });

  it("should initialize with debug option", async () => {
    const { default: initializeDuckDb } = await importModule();

    const db = await initializeDuckDb({ debug: true });

    expect(db).toBe(mockAsyncDuckDB);
    // Since we're mocking the entire module, we need to import it to check if it's called
    const duckdb = await import("@duckdb/duckdb-wasm");
    expect(duckdb.ConsoleLogger).toHaveBeenCalled();
  });

  it("should initialize with config option", async () => {
    const { default: initializeDuckDb } = await importModule();

    const config = { path: "test.db" };
    const db = await initializeDuckDb({ config });

    expect(db).toBe(mockAsyncDuckDB);
    expect(global.fetch).toHaveBeenCalledWith("test.db");
    expect(mockAsyncDuckDB.registerFileBuffer).toHaveBeenCalled();
    expect(mockAsyncDuckDB.open).toHaveBeenCalledWith({ path: "test.db" });
  });

  it("should export getDuckDB function", async () => {
    const { getDuckDB } = await importModule();

    const db = await getDuckDB();

    expect(db).toBe(mockAsyncDuckDB);
  });
});
