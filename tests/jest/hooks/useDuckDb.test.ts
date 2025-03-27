/**
 * Tests for useDuckDb.ts
 */
// Import Jest globals first
import { jest, describe, expect, it, beforeEach } from "@jest/globals";

// Create mocks before importing modules
jest.mock("../../../src/init/initializeDuckDb", () => ({
  __esModule: true,
  getDuckDB: jest.fn(),
}));

jest.mock("../../../src/hooks/useAsync", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Import mock dependencies after mocking
import "../mocks/duckdb";
import "../mocks/react-hooks";
import { mockAsyncDuckDB } from "../mocks/duckdb";

// Import the module under test
import { useDuckDb } from "../../../src/hooks/useDuckDb";
import useAsync from "../../../src/hooks/useAsync";
import { getDuckDB } from "../../../src/init/initializeDuckDb";

// Set up mock response for useAsync
const mockUseAsyncResult = {
  data: undefined,
  loading: false,
  error: undefined,
};

describe("useDuckDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up the mocks for each test
    (useAsync as jest.Mock).mockReturnValue(mockUseAsyncResult);
    (getDuckDB as jest.Mock).mockImplementation(() => Promise.resolve(mockAsyncDuckDB));
  });

  it("should call useAsync with getDuckDB function", () => {
    useDuckDb();
    expect(useAsync).toHaveBeenCalledWith(expect.any(Function), []);
  });

  it("should return the expected structure with loading state", () => {
    // Set up the mock useAsync to return loading state
    mockUseAsyncResult.loading = true;
    mockUseAsyncResult.data = undefined;
    mockUseAsyncResult.error = undefined;

    const result = useDuckDb();

    expect(result).toEqual({
      db: undefined,
      loading: true,
      error: undefined,
    });
  });

  it("should return the DB when loaded successfully", () => {
    // Set up the mock useAsync to return success state with DB
    mockUseAsyncResult.loading = false;
    // Use type assertion to fix TypeScript error
    (mockUseAsyncResult as any).data = mockAsyncDuckDB;
    mockUseAsyncResult.error = undefined;

    const result = useDuckDb();

    expect(result).toEqual({
      db: mockAsyncDuckDB,
      loading: false,
      error: undefined,
    });
  });

  it("should return error state when loading fails", () => {
    const mockError = new Error("Failed to load DuckDB");

    // Set up the mock useAsync to return error state
    mockUseAsyncResult.loading = false;
    mockUseAsyncResult.data = undefined;
    // Use type assertion to fix TypeScript error
    (mockUseAsyncResult as any).error = mockError;

    const result = useDuckDb();

    expect(result).toEqual({
      db: undefined,
      loading: false,
      error: mockError,
    });
  });

  it("should call getDuckDB in the async function", async () => {
    // Capture the async function passed to useAsync
    useDuckDb();
    const asyncFn = (useAsync as jest.Mock).mock.calls[0][0];

    // Call the async function with proper type casting
    await (asyncFn as Function)();

    expect(getDuckDB).toHaveBeenCalled();
  });
});
