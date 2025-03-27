/**
 * Tests for useDuckDbQuery.ts
 */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import "../mocks/react-hooks";
import "../mocks/arrow";
import { mockArrowTable } from "../mocks/arrow";
import { mockAsyncDuckDB } from "../mocks/duckdb";

// Mock the runQuery function
const mockRunQuery = jest.fn();
jest.mock("../../../src/util/runQuery", () => ({
  runQuery: jest.fn((...args) => mockRunQuery(...args)),
}));

// Mock the useDuckDb hook
const mockUseDuckDbResult = {
  db: undefined,
  loading: false,
  error: undefined,
};
jest.mock("../../../src/hooks/useDuckDb", () => ({
  useDuckDb: jest.fn().mockReturnValue(mockUseDuckDbResult),
}));

// Mock the useAsync hook
const mockUseAsyncResult = {
  data: undefined,
  loading: false,
  error: undefined,
};
jest.mock("../../../src/hooks/useAsync", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(mockUseAsyncResult),
}));

// Import the module under test
import { useDuckDbQuery } from "../../../src/hooks/useDuckDbQuery";
import useAsync from "../../../src/hooks/useAsync";
import { useDuckDb } from "../../../src/hooks/useDuckDb";
import { runQuery } from "../../../src/util/runQuery";
import { Table } from "apache-arrow";

describe("useDuckDbQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call useDuckDb to get the database instance", () => {
    useDuckDbQuery("SELECT * FROM test");

    expect(useDuckDb).toHaveBeenCalled();
  });

  it("should call useAsync with the correct arguments", () => {
    const sql = "SELECT * FROM test";
    useDuckDbQuery(sql);

    expect(useAsync).toHaveBeenCalledWith(expect.any(Function), [undefined, sql]);
  });

  it("should return the expected structure", () => {
    // Set up the mock useAsync to return arrow data
    // Use type assertion to fix TypeScript error
    (mockUseAsyncResult as any).data = mockArrowTable;
    mockUseAsyncResult.loading = false;
    mockUseAsyncResult.error = undefined;

    const result = useDuckDbQuery("SELECT * FROM test");

    expect(result).toEqual({
      arrow: mockArrowTable,
      loading: false,
      error: undefined,
    });
  });

  it("should return undefined arrow when SQL is undefined", async () => {
    // Set up the mock useDuckDb to return a DB instance
    // Use type assertion to fix TypeScript error
    (mockUseDuckDbResult as any).db = mockAsyncDuckDB;

    // Call the hook with undefined SQL
    useDuckDbQuery(undefined);

    // Get the async function passed to useAsync
    const asyncFn = (useAsync as jest.Mock).mock.calls[0][0];

    // Execute the function with proper typing
    const result = await (asyncFn as () => Promise<Table | undefined>)();

    expect(result).toBeUndefined();
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it("should return undefined arrow when DB is not available", async () => {
    // Set up the mock useDuckDb to return no DB instance
    mockUseDuckDbResult.db = undefined;

    // Call the hook with a SQL query
    useDuckDbQuery("SELECT * FROM test");

    // Get the async function passed to useAsync
    const asyncFn = (useAsync as jest.Mock).mock.calls[0][0];

    // Execute the function with proper typing
    const result = await (asyncFn as () => Promise<Table | undefined>)();

    expect(result).toBeUndefined();
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it("should call runQuery when DB and SQL are available", async () => {
    const sql = "SELECT * FROM test";

    // Set up the mock useDuckDb to return a DB instance
    // Use type assertion to fix TypeScript error
    (mockUseDuckDbResult as any).db = mockAsyncDuckDB;

    // Set up mockRunQuery to return an arrow table
    mockRunQuery.mockImplementation(() => Promise.resolve(mockArrowTable));

    // Call the hook
    useDuckDbQuery(sql);

    // Get the async function passed to useAsync
    const asyncFn = (useAsync as jest.Mock).mock.calls[0][0];

    // Execute the function with proper typing
    const result = await (asyncFn as () => Promise<Table | undefined>)();

    expect(runQuery).toHaveBeenCalledWith(mockAsyncDuckDB, sql);
    expect(result).toBe(mockArrowTable);
  });

  it("should return error state when query fails", () => {
    const mockError = new Error("Query failed");

    // Set up the mock useAsync to return error state
    mockUseAsyncResult.loading = false;
    mockUseAsyncResult.data = undefined;
    // Use type assertion to fix TypeScript error
    (mockUseAsyncResult as any).error = mockError;

    const result = useDuckDbQuery("SELECT * FROM test");

    expect(result).toEqual({
      arrow: undefined,
      loading: false,
      error: mockError,
    });
  });
});
