/**
 * Common test setup for file operations tests
 */
import { jest } from "@jest/globals";
import "../mocks/duckdb";
import "../mocks/arrow";
import {
  mockAsyncDuckDB,
  mockDuckDBConnection,
  mockConnect,
  mockInsertArrowTable,
  mockRegisterFileHandle,
  mockRegisterFileText,
  mockDropFile,
} from "../mocks/duckdb";
import { mockArrowTable } from "../mocks/arrow";

// Define CSVInsertOptions interface locally
export interface CSVInsertOptions {
  name: string;
  schema?: string;
  detect?: boolean;
  header?: boolean;
  delimiter?: string;
}

// Create a proper mock File object with required methods
export class MockFile implements File {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  webkitRelativePath: string;

  constructor(name: string, type: string = "") {
    this.name = name;
    this.type = type;
    this.size = 0;
    this.lastModified = Date.now();
    this.webkitRelativePath = "";
  }

  text() {
    // Default implementation that will be overridden in tests
    return Promise.resolve("");
  }

  arrayBuffer() {
    // Default implementation that will be overridden in tests
    return Promise.resolve(new ArrayBuffer(0));
  }

  slice(_start?: number, _end?: number, _contentType?: string): Blob {
    return new Blob([], { type: this.type });
  }

  stream() {
    return new ReadableStream();
  }

  get [Symbol.toStringTag]() {
    return "File";
  }

  // Make sure bytes is a method not a getter
  bytes() {
    return Promise.resolve(new Uint8Array());
  }
}

// Setup utility function mocks
export const setupUtilityMocks = () => {
  // Mock the utility functions
  jest.mock("../../../src/util/tempfile", () => ({
    getTempFilename: jest.fn().mockReturnValue("temp-file-123"),
  }));

  jest.mock("../../../src/util/perf", () => ({
    logElapsedTime: jest.fn(),
  }));

  jest.mock("../../../src/util/runQuery", () => ({
    runQuery: jest.fn().mockImplementation(() => Promise.resolve({})),
  }));

  jest.mock("../../../src/util/inferTypes", () => ({
    inferTypes: jest.fn().mockImplementation(() => Promise.resolve({})),
  }));

  // Mock the isArrowFile and isParquetFile functions
  jest.mock("../../../src/files/arrow", () => ({
    isArrowFile: jest.fn().mockImplementation(() => Promise.resolve(false)),
    arrayBufferToArrow: jest.fn().mockReturnValue(mockArrowTable),
    isArrow: jest.fn().mockReturnValue(true),
  }));

  jest.mock("../../../src/files/parquet", () => ({
    isParquetFile: jest.fn().mockImplementation(() => Promise.resolve(false)),
  }));
};

// Setup common test environment
export const setupTestEnvironment = () => {
  jest.clearAllMocks();

  // Mock console.error to prevent error logs during tests
  jest.spyOn(console, "error").mockImplementation(() => {});

  // Ensure mockAsyncDuckDB.registerFileText is properly set up
  mockAsyncDuckDB.registerFileText = mockRegisterFileText as unknown as (
    name: string,
    text: string,
  ) => Promise<void>;

  // Mock the DuckDB connection methods
  mockConnect.mockImplementation(() => Promise.resolve(mockDuckDBConnection));

  // Reset mockRegisterFileText to return a resolved promise
  (mockRegisterFileText as jest.Mock).mockClear();
  (mockRegisterFileText as jest.Mock).mockImplementation(() => Promise.resolve());

  // Fix: Use a type assertion to fix the TypeScript error
  mockDuckDBConnection.insertCSVFromPath = jest
    .fn()
    .mockImplementation(() => Promise.resolve()) as jest.MockedFunction<
    (path: string, options: CSVInsertOptions) => Promise<void>
  >;
};

export {
  mockAsyncDuckDB,
  mockDuckDBConnection,
  mockConnect,
  mockInsertArrowTable,
  mockRegisterFileHandle,
  mockRegisterFileText,
  mockDropFile,
  mockArrowTable,
};
