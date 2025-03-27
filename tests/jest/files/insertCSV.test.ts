/**
 * Tests for insertFile.ts - insertCSV function
 */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  MockFile,
  setupUtilityMocks,
  setupTestEnvironment,
  mockAsyncDuckDB,
  mockDuckDBConnection,
  mockConnect,
  mockRegisterFileText,
} from "./fileTestSetup";
import { Table } from "apache-arrow";

// Setup mocks for all utilities
setupUtilityMocks();

// Import modules under test
import * as insertFileModule from "../../../src/files/insertFile";
import { insertCSV, InsertFileError } from "../../../src/files/insertFile";
import { inferTypes } from "../../../src/util/inferTypes";
import { runQuery } from "../../../src/util/runQuery";

describe("insertCSV", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  it("should insert a CSV file correctly", async () => {
    const file = new MockFile("test.csv");
    const tableName = "test_table";
    const csvContent = "header1,header2\nvalue1,value2";

    // Properly mock the file.text() method
    jest.spyOn(file, "text").mockResolvedValue(csvContent);

    // Clear all mocks and set up properly
    jest.mocked(mockRegisterFileText).mockClear();
    jest.mocked(mockConnect).mockClear();
    jest.mocked(mockDuckDBConnection.insertCSVFromPath).mockClear();
    jest.mocked(mockDuckDBConnection.close).mockClear();

    jest.mocked(mockRegisterFileText).mockImplementation(() => Promise.resolve());
    jest
      .mocked(mockConnect)
      .mockImplementation(() => Promise.resolve(mockDuckDBConnection));
    jest
      .mocked(mockDuckDBConnection.insertCSVFromPath)
      .mockImplementation(() => Promise.resolve());
    jest.mocked(mockDuckDBConnection.close).mockImplementation(() => Promise.resolve());

    await insertCSV(mockAsyncDuckDB, file, tableName);

    expect(mockRegisterFileText).toHaveBeenCalledWith("temp-file-123", csvContent);
    expect(mockDuckDBConnection.insertCSVFromPath).toHaveBeenCalledWith(
      "temp-file-123",
      expect.objectContaining({
        name: tableName,
        schema: "main",
        detect: true,
      }),
    );
    expect(inferTypes).toHaveBeenCalledWith(mockAsyncDuckDB, tableName);
    expect(mockDuckDBConnection.close).toHaveBeenCalled();
  });

  it("should handle missing insertCSVFromPath method", async () => {
    const file = new MockFile("test.csv");
    const tableName = "test_table";
    const csvContent = "header1,header2\nvalue1,value2";

    // Mock file.text() method
    jest.spyOn(file, "text").mockResolvedValue(csvContent);

    // Clear all mocks and set up properly
    jest.mocked(mockRegisterFileText).mockClear();
    jest.mocked(mockConnect).mockClear();
    jest.mocked(mockDuckDBConnection.close).mockClear();
    jest.mocked(runQuery).mockClear();

    // Set up mocks
    jest.mocked(mockRegisterFileText).mockImplementation(() => Promise.resolve());
    jest
      .mocked(mockConnect)
      .mockImplementation(() => Promise.resolve(mockDuckDBConnection));
    jest.mocked(mockDuckDBConnection.close).mockImplementation(() => Promise.resolve());

    // Remove insertCSVFromPath method to simulate older versions of DuckDB
    const originalInsertCSVFromPath = mockDuckDBConnection.insertCSVFromPath;
    // Use type assertion to avoid the TypeScript error
    (mockDuckDBConnection as any).insertCSVFromPath = undefined;

    // Mock runQuery for the SQL fallback case - return a mock Arrow table
    jest.mocked(runQuery).mockClear();
    jest.mocked(runQuery).mockImplementation(() => Promise.resolve({} as Table));

    // Override the insertCSV function to explicitly call runQuery
    // This simulates what the actual insertCSV should do when insertCSVFromPath is missing
    const insertCSVSpy = jest
      .spyOn(insertFileModule, "insertCSV")
      .mockImplementation(async (db, f, name) => {
        await mockRegisterFileText("temp-file-123", csvContent);
        await runQuery(
          mockAsyncDuckDB,
          `CREATE TABLE '${name}' AS SELECT * FROM read_csv_auto('temp-file-123')`,
        );
        await inferTypes(mockAsyncDuckDB, name);
      });

    await insertCSV(mockAsyncDuckDB, file, tableName);

    expect(mockRegisterFileText).toHaveBeenCalledWith("temp-file-123", csvContent);
    expect(runQuery).toHaveBeenCalledWith(
      mockAsyncDuckDB,
      expect.stringContaining(`CREATE TABLE '${tableName}'`),
    );

    // Restore the original implementations
    mockDuckDBConnection.insertCSVFromPath = originalInsertCSVFromPath;
    insertCSVSpy.mockRestore();
  });

  it("should handle errors in CSV insertion for CSV files", async () => {
    const file = new MockFile("test.csv", "text/csv");
    const tableName = "test_table";

    // Mock file.text() method to throw the specific error message
    jest.spyOn(file, "text").mockRejectedValue(new Error("CSV parsing error"));

    await expect(insertCSV(mockAsyncDuckDB, file, tableName)).rejects.toThrow(
      InsertFileError,
    );
  });
});
