/**
 * Tests for runQuery.ts
 */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import "../mocks/duckdb";
import "../mocks/arrow";
import {
  mockAsyncDuckDB,
  mockDuckDBConnection,
  mockConnect,
  mockQuery,
} from "../mocks/duckdb";
import { mockArrowTable } from "../mocks/arrow";

// Mock the logElapsedTime function
jest.mock("../../../src/util/perf", () => ({
  logElapsedTime: jest.fn(),
}));

// Create a mock module with typed DEBUG property
const mockInitDuckDbModule = {
  DEBUG: false,
};

// Mock the DEBUG variable
jest.mock("../../../src/init/initializeDuckDb", () => mockInitDuckDbModule);

// Import the module under test
import { runQuery } from "../../../src/util/runQuery";
import { logElapsedTime } from "../../../src/util/perf";

describe("runQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mockQuery to return an arrow table with proper typing
    mockQuery.mockImplementation(() => Promise.resolve(mockArrowTable));
  });

  it("should execute a query and return the arrow result", async () => {
    const sql = "SELECT * FROM test";

    const result = await runQuery(mockAsyncDuckDB, sql);

    expect(mockConnect).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith(sql);
    expect(mockDuckDBConnection.close).toHaveBeenCalled();
    expect(result).toBe(mockArrowTable);
  });

  it("should not log elapsed time when DEBUG is false", async () => {
    const sql = "SELECT * FROM test";

    await runQuery(mockAsyncDuckDB, sql);

    expect(logElapsedTime).not.toHaveBeenCalled();
  });

  it("should log elapsed time when DEBUG is true", async () => {
    // Temporarily mock DEBUG as true
    mockInitDuckDbModule.DEBUG = true;

    const sql = "SELECT * FROM test";

    await runQuery(mockAsyncDuckDB, sql);

    expect(logElapsedTime).toHaveBeenCalledWith(`Run query: ${sql}`, expect.any(Number));

    // Reset DEBUG to false for subsequent tests
    mockInitDuckDbModule.DEBUG = false;
  });

  it("should handle query errors", async () => {
    const sql = "SELECT * FROM nonexistent";
    const error = new Error("Query failed");

    // Make the query throw an error
    mockQuery.mockImplementationOnce(() => Promise.reject(error));

    await expect(runQuery(mockAsyncDuckDB, sql)).rejects.toThrow(error);

    expect(mockConnect).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith(sql);
  });
});
