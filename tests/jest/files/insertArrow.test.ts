/**
 * Tests for insertFile.ts - insertArrow and insertArrowTable functions
 */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  MockFile,
  setupUtilityMocks,
  setupTestEnvironment,
  mockAsyncDuckDB,
  mockDuckDBConnection,
  mockConnect,
  mockInsertArrowTable,
  mockArrowTable,
} from "./fileTestSetup";

// Setup mocks for all utilities
setupUtilityMocks();

// Import modules under test
import {
  insertArrow,
  insertArrowTable,
  InsertFileError,
} from "../../../src/files/insertFile";
import { arrayBufferToArrow } from "../../../src/files/arrow";

describe("Arrow functionality", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  describe("insertArrow", () => {
    it("should insert an Arrow file correctly", async () => {
      const file = new MockFile("test.arrow");
      const tableName = "test_table";

      // Mock file.arrayBuffer() method
      const buffer = new ArrayBuffer(10);
      jest.spyOn(file, "arrayBuffer").mockImplementation(() => Promise.resolve(buffer));

      await insertArrow(mockAsyncDuckDB, file, tableName);

      expect(arrayBufferToArrow).toHaveBeenCalledWith(buffer);
      expect(mockConnect).toHaveBeenCalled();
      expect(mockInsertArrowTable).toHaveBeenCalledWith(
        mockArrowTable,
        expect.objectContaining({ name: tableName }),
      );
      expect(mockDuckDBConnection.close).toHaveBeenCalled();
    });

    it("should handle errors in Arrow insertion", async () => {
      const file = new MockFile("test.arrow");
      const tableName = "test_table";

      // Mock file.arrayBuffer() method to throw the specific error
      jest
        .spyOn(file, "arrayBuffer")
        .mockImplementation(() => Promise.reject(new Error("Arrow parsing error")));

      await expect(insertArrow(mockAsyncDuckDB, file, tableName)).rejects.toThrow(
        new InsertFileError("Arrow import failed", "Sorry, we couldn't import that file"),
      );
    });
  });

  describe("insertArrowTable", () => {
    it("should insert an Arrow table correctly", async () => {
      const tableName = "test_table";

      await insertArrowTable(mockAsyncDuckDB, mockArrowTable, tableName);

      expect(mockConnect).toHaveBeenCalled();
      expect(mockInsertArrowTable).toHaveBeenCalledWith(
        mockArrowTable,
        expect.objectContaining({ name: tableName }),
      );
      expect(mockDuckDBConnection.close).toHaveBeenCalled();
    });
  });
});
