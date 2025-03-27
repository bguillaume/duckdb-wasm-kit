/**
 * Tests for parquet.ts functions
 */
import { describe, expect, it, jest } from "@jest/globals";

// Import the module under test
import { isParquetFile, PARQUET_MIME_TYPE } from "../../../src/files/parquet";

describe("parquet utilities", () => {
  describe("isParquetFile", () => {
    it("should identify parquet files by signature", async () => {
      // Create a mock content with PAR1 signature at the beginning
      const mockContent = "PAR1somedata";

      // Create a properly mocked Blob for the slice result
      const mockSliceResult = {
        text: jest.fn().mockImplementation(() => Promise.resolve("PAR1")),
      };

      // Create a file with proper mock implementation of slice and text methods
      const file = {
        name: "test.parquet",
        type: PARQUET_MIME_TYPE,
        size: mockContent.length,
        text: jest.fn().mockImplementation(() => Promise.resolve(mockContent)),
        // The slice method should return a Blob with a text method
        slice: jest.fn().mockReturnValue(mockSliceResult),
        arrayBuffer: jest.fn(),
        stream: jest.fn(),
      } as unknown as File;

      const result = await isParquetFile(file);

      expect(result).toBe(true);
      expect(file.slice).toHaveBeenCalledWith(0, 4);
      expect(mockSliceResult.text).toHaveBeenCalled();
    });

    it("should return false for non-parquet files", async () => {
      // Create a mock content without PAR1 signature
      const mockContent = "TEXT";

      // Create a properly mocked Blob for the slice result
      const mockSliceResult = {
        text: jest.fn().mockImplementation(() => Promise.resolve("TEXT")),
      };

      // Create a file with proper mock implementation of slice and text methods
      const file = {
        name: "test.txt",
        type: "text/plain",
        size: mockContent.length,
        text: jest.fn().mockImplementation(() => Promise.resolve(mockContent)),
        // The slice method should return a Blob with a text method
        slice: jest.fn().mockReturnValue(mockSliceResult),
        arrayBuffer: jest.fn(),
        stream: jest.fn(),
      } as unknown as File;

      const result = await isParquetFile(file);

      expect(result).toBe(false);
      expect(file.slice).toHaveBeenCalledWith(0, 4);
      expect(mockSliceResult.text).toHaveBeenCalled();
    });
  });

  describe("PARQUET_MIME_TYPE", () => {
    it("should have the correct value", () => {
      expect(PARQUET_MIME_TYPE).toBe("application/vnd.apache.parquet");
    });
  });
});
