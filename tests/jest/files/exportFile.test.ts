/**
 * Tests for exportFile.ts functions
 */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import "../mocks/duckdb";
import "../mocks/arrow";
import { mockAsyncDuckDB } from "../mocks/duckdb";
import { mockArrowTable } from "../mocks/arrow";

// Mock the utility functions
jest.mock("../../../src/util/tempfile", () => ({
  getTempFilename: jest.fn().mockReturnValue("temp-file-123"),
}));

jest.mock("../../../src/util/runQuery", () => ({
  runQuery: jest.fn().mockImplementation(() => Promise.resolve(mockArrowTable)),
}));

jest.mock("../../../src/files/arrow", () => ({
  ARROW_MIME_TYPE: "application/vnd.apache.arrow.file",
  arrowToArrayBuffer: jest.fn().mockReturnValue(new ArrayBuffer(10)),
}));

// Import modules under test
import { exportArrow, exportCsv, exportParquet } from "../../../src/files/exportFile";

import { runQuery } from "../../../src/util/runQuery";
import { getTempFilename } from "../../../src/util/tempfile";
import { arrowToArrayBuffer, ARROW_MIME_TYPE } from "../../../src/files/arrow";
import { CSV_MIME_TYPE } from "../../../src/files/csv";
import { PARQUET_MIME_TYPE } from "../../../src/files/parquet";

describe("exportFile utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Fix: Add proper type assertions to mock implementations
    mockAsyncDuckDB.copyFileToBuffer = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Uint8Array(10)),
      ) as jest.MockedFunction<typeof mockAsyncDuckDB.copyFileToBuffer>;

    mockAsyncDuckDB.dropFile = jest
      .fn()
      .mockImplementation(() => Promise.resolve(null)) as jest.MockedFunction<
      typeof mockAsyncDuckDB.dropFile
    >;
  });

  describe("exportArrow", () => {
    it("should export a table as Arrow file with default filename", async () => {
      const tableName = "test_table";

      const result = await exportArrow(mockAsyncDuckDB, tableName);

      expect(runQuery).toHaveBeenCalledWith(
        mockAsyncDuckDB,
        `SELECT * FROM 'test_table'`,
      );
      expect(arrowToArrayBuffer).toHaveBeenCalledWith(mockArrowTable);
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe("test_table.arrow");
      expect(result.type).toBe(ARROW_MIME_TYPE);
    });

    it("should use provided filename when specified", async () => {
      const tableName = "test_table";
      const filename = "custom_name.arrow";

      const result = await exportArrow(mockAsyncDuckDB, tableName, filename);

      expect(result.name).toBe("custom_name.arrow");
    });

    it("should strip extensions from table names when generating filenames", async () => {
      const tableName = "test_table.csv"; // Table with .csv extension

      const result = await exportArrow(mockAsyncDuckDB, tableName);

      expect(result.name).toBe("test_table.arrow"); // CSV extension should be stripped
    });
  });

  describe("exportCsv", () => {
    it("should export a table as CSV file with default filename and delimiter", async () => {
      const tableName = "test_table";

      const result = await exportCsv(mockAsyncDuckDB, tableName);

      expect(getTempFilename).toHaveBeenCalled();
      expect(runQuery).toHaveBeenCalledWith(
        mockAsyncDuckDB,
        `COPY 'test_table' TO 'temp-file-123' WITH (HEADER 1, DELIMITER ',')`,
      );
      expect(mockAsyncDuckDB.copyFileToBuffer).toHaveBeenCalledWith("temp-file-123");
      expect(mockAsyncDuckDB.dropFile).toHaveBeenCalledWith("temp-file-123");
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe("test_table.csv");
      expect(result.type).toBe(CSV_MIME_TYPE);
    });

    it("should use provided filename when specified", async () => {
      const tableName = "test_table";
      const filename = "custom_name.csv";

      const result = await exportCsv(mockAsyncDuckDB, tableName, filename);

      expect(result.name).toBe("custom_name.csv");
    });

    it("should use custom delimiter when specified", async () => {
      const tableName = "test_table";
      const filename = undefined;
      const delimiter = ";";

      await exportCsv(mockAsyncDuckDB, tableName, filename, delimiter);

      expect(runQuery).toHaveBeenCalledWith(
        mockAsyncDuckDB,
        `COPY 'test_table' TO 'temp-file-123' WITH (HEADER 1, DELIMITER ';')`,
      );
    });
  });

  describe("exportParquet", () => {
    it("should export a table as Parquet file with default filename and compression", async () => {
      const tableName = "test_table";

      const result = await exportParquet(mockAsyncDuckDB, tableName);

      expect(getTempFilename).toHaveBeenCalled();
      expect(runQuery).toHaveBeenCalledWith(
        mockAsyncDuckDB,
        `COPY 'test_table' TO 'temp-file-123' (FORMAT PARQUET, COMPRESSION zstd)`,
      );
      expect(mockAsyncDuckDB.copyFileToBuffer).toHaveBeenCalledWith("temp-file-123");
      expect(mockAsyncDuckDB.dropFile).toHaveBeenCalledWith("temp-file-123");
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe("test_table.parquet");
      expect(result.type).toBe(PARQUET_MIME_TYPE);
    });

    it("should use provided filename when specified", async () => {
      const tableName = "test_table";
      const filename = "custom_name.parquet";

      const result = await exportParquet(mockAsyncDuckDB, tableName, filename);

      expect(result.name).toBe("custom_name.parquet");
    });

    it("should use custom compression when specified", async () => {
      const tableName = "test_table";
      const filename = undefined;
      const compression = "snappy";

      await exportParquet(mockAsyncDuckDB, tableName, filename, compression);

      expect(runQuery).toHaveBeenCalledWith(
        mockAsyncDuckDB,
        `COPY 'test_table' TO 'temp-file-123' (FORMAT PARQUET, COMPRESSION snappy)`,
      );
    });
  });
});
