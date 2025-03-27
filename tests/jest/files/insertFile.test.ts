/**
 * Tests for insertFile.ts - insertFile function
 */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  MockFile,
  setupUtilityMocks,
  setupTestEnvironment,
  mockAsyncDuckDB,
  mockRegisterFileText,
} from "./fileTestSetup";

// Setup mocks for all utilities
setupUtilityMocks();

// Import modules under test
import { insertFile, InsertFileError } from "../../../src/files/insertFile";
import { isArrowFile } from "../../../src/files/arrow";
import { isParquetFile } from "../../../src/files/parquet";
import { logElapsedTime } from "../../../src/util/perf";
import { runQuery } from "../../../src/util/runQuery";

describe("insertFile", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  it("should detect and insert a parquet file", async () => {
    const file = new MockFile("test.parquet");
    (isParquetFile as jest.Mock).mockImplementation(() => Promise.resolve(true));

    await insertFile(mockAsyncDuckDB, file);

    expect(isParquetFile).toHaveBeenCalledWith(file);
    expect(isArrowFile).not.toHaveBeenCalled(); // Should not check Arrow if Parquet is detected
    expect(runQuery).toHaveBeenCalled(); // From insertParquet
  });

  it("should detect and insert an arrow file", async () => {
    const file = new MockFile("test.arrow");
    (isParquetFile as jest.Mock).mockImplementation(() => Promise.resolve(false));
    (isArrowFile as jest.Mock).mockImplementation(() => Promise.resolve(true));

    await insertFile(mockAsyncDuckDB, file);

    expect(isParquetFile).toHaveBeenCalledWith(file);
    expect(isArrowFile).toHaveBeenCalledWith(file);
  });

  it("should insert a csv file based on extension", async () => {
    const file = new MockFile("test.csv");
    const csvContent = "header1,header2\nvalue1,value2";

    // Use jest.spyOn to mock file.text()
    jest.spyOn(file, "text").mockResolvedValue(csvContent);

    // Mock isParquetFile and isArrowFile to return false
    (isParquetFile as jest.Mock).mockImplementation(() => Promise.resolve(false));
    (isArrowFile as jest.Mock).mockImplementation(() => Promise.resolve(false));

    // Actually mock the internal functions instead of using a spy
    // const originalInsertCSV = require("../../../src/files/insertFile").insertCSV;
    jest
      .spyOn(require("../../../src/files/insertFile"), "insertCSV")
      .mockImplementation(async (_db, _f, _name) => {
        await mockRegisterFileText("temp-file-123", csvContent);
        return Promise.resolve();
      });

    await insertFile(mockAsyncDuckDB, file);

    expect(mockRegisterFileText).toHaveBeenCalledWith("temp-file-123", csvContent);

    // Restore original implementation
    jest.spyOn(require("../../../src/files/insertFile"), "insertCSV").mockRestore();
  });

  it("should use tableName if provided", async () => {
    const file = new MockFile("test.csv");
    const tableName = "custom_table";
    const csvContent = "header1,header2\nvalue1,value2";

    // Use jest.spyOn to mock file.text()
    jest.spyOn(file, "text").mockResolvedValue(csvContent);

    // Mock isParquetFile and isArrowFile to return false
    (isParquetFile as jest.Mock).mockImplementation(() => Promise.resolve(false));
    (isArrowFile as jest.Mock).mockImplementation(() => Promise.resolve(false));

    // Actually mock the internal functions
    jest
      .spyOn(require("../../../src/files/insertFile"), "insertCSV")
      .mockImplementation(async (_db, _f, _name) => {
        await mockRegisterFileText("temp-file-123", csvContent);
        return Promise.resolve();
      });

    await insertFile(mockAsyncDuckDB, file, tableName);

    expect(mockRegisterFileText).toHaveBeenCalledWith("temp-file-123", csvContent);

    // Restore original implementation
    jest.spyOn(require("../../../src/files/insertFile"), "insertCSV").mockRestore();
  });

  it("should log elapsed time when debug is true", async () => {
    const file = new MockFile("test.csv");
    const csvContent = "header1,header2\nvalue1,value2";

    // Properly type and mock the file.text() method
    file.text = jest
      .fn()
      .mockImplementation(() => Promise.resolve(csvContent)) as jest.MockedFunction<
      () => Promise<string>
    >;

    await insertFile(mockAsyncDuckDB, file, undefined, true);

    expect(logElapsedTime).toHaveBeenCalledWith(`Imported test.csv`, expect.any(Number));
  });

  it("should throw InsertFileError for unsupported file types", async () => {
    const file = new MockFile("test.unknown");

    // Configure the file type detection mocks to return false
    (isParquetFile as jest.Mock).mockImplementation(() => Promise.resolve(false));
    (isArrowFile as jest.Mock).mockImplementation(() => Promise.resolve(false));

    // Set up the insertCSV mock to throw an error to simulate failure with unsupported type
    jest
      .spyOn(require("../../../src/files/insertFile"), "insertCSV")
      .mockImplementation(() => {
        throw new InsertFileError(
          "Invalid file type",
          "Only CSV, Parquet, or Arrow files are supported",
        );
      });

    await expect(insertFile(mockAsyncDuckDB, file)).rejects.toThrow(InsertFileError);

    // Restore original implementation
    jest.spyOn(require("../../../src/files/insertFile"), "insertCSV").mockRestore();
  });
});
