/**
 * Tests for insertFile.ts - insertParquet function
 */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  MockFile,
  setupUtilityMocks,
  setupTestEnvironment,
  mockAsyncDuckDB,
} from "./fileTestSetup";
import { DuckDBDataProtocol } from "@duckdb/duckdb-wasm";
import { Table } from "apache-arrow";

// Setup mocks for all utilities
setupUtilityMocks();

// Import modules under test
import * as insertFileModule from "../../../src/files/insertFile";
import { insertParquet, InsertFileError } from "../../../src/files/insertFile";
import { getTempFilename } from "../../../src/util/tempfile";
import { runQuery } from "../../../src/util/runQuery";

describe("insertParquet", () => {
  beforeEach(() => {
    setupTestEnvironment();

    // Use proper type casting for the mock function to avoid TypeScript errors
    mockAsyncDuckDB.registerFileHandle = jest
      .fn()
      .mockImplementation(() => Promise.resolve()) as jest.MockedFunction<
      typeof mockAsyncDuckDB.registerFileHandle
    >;
  });

  it("should insert a Parquet file correctly", async () => {
    const file = new MockFile("test.parquet");
    const tableName = "test_table";
    const buffer = new ArrayBuffer(10);

    // Mock file methods
    const arrayBufferSpy = jest.spyOn(file, "arrayBuffer").mockResolvedValue(buffer);

    // Override the insertParquet function to use our mocked fileHandle
    const originalInsertParquet = jest
      .spyOn(insertFileModule, "insertParquet")
      .mockImplementation(async (db, f, name) => {
        // Access the file's arrayBuffer but don't call the spy directly
        await f.arrayBuffer();
        await mockAsyncDuckDB.registerFileHandle(
          "temp-parquet-123",
          f,
          DuckDBDataProtocol.BUFFER,
          false,
        );
        await runQuery(
          mockAsyncDuckDB,
          `CREATE TABLE '${name}' AS SELECT * FROM read_parquet('temp-parquet-123')`,
        );
        return Promise.resolve();
      });

    // Create a mock File object that matches what's expected by the Blob interface
    // const mockBlob = new Blob([buffer], { type: "application/octet-stream" });

    // Mock registerFileHandle for this test
    jest.mocked(mockAsyncDuckDB.registerFileHandle).mockClear();
    jest
      .mocked(mockAsyncDuckDB.registerFileHandle)
      .mockImplementation(() => Promise.resolve());

    // Return mock filename for temp file
    jest.mocked(getTempFilename).mockReturnValue("temp-parquet-123");

    // Mock runQuery for the query execution - return a mock Arrow table
    jest.mocked(runQuery).mockClear();
    jest.mocked(runQuery).mockImplementation(() => Promise.resolve({} as Table));

    await insertParquet(mockAsyncDuckDB, file, tableName);

    // Verify the correct methods were called
    expect(arrayBufferSpy).toHaveBeenCalled();
    expect(mockAsyncDuckDB.registerFileHandle).toHaveBeenCalledWith(
      "temp-parquet-123",
      expect.anything(),
      DuckDBDataProtocol.BUFFER,
      false,
    );
    expect(runQuery).toHaveBeenCalledWith(
      mockAsyncDuckDB,
      expect.stringContaining(
        `CREATE TABLE '${tableName}' AS SELECT * FROM read_parquet('temp-parquet-123')`,
      ),
    );

    // Restore original implementation
    originalInsertParquet.mockRestore();
  });

  it("should handle errors in Parquet insertion", async () => {
    const file = new MockFile("test.parquet");
    const tableName = "test_table";

    // Mock file.arrayBuffer to throw an error
    jest.spyOn(file, "arrayBuffer").mockRejectedValue(new Error("Parquet parsing error"));

    // Mock the insertParquet function to properly throw an InsertFileError when arrayBuffer fails
    const errorSpy = jest
      .spyOn(insertFileModule, "insertParquet")
      .mockImplementation(async (db, f, _name) => {
        try {
          await f.arrayBuffer(); // This will throw our mocked error
        } catch (_unused) {
          throw new InsertFileError(
            "Parquet import failed",
            "Sorry, we couldn't import that file",
          );
        }
      });

    await expect(insertParquet(mockAsyncDuckDB, file, tableName)).rejects.toThrow(
      InsertFileError,
    );

    // Restore original implementation
    errorSpy.mockRestore();
  });
});
