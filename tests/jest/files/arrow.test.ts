/**
 * Tests for arrow.ts functions
 */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
// Import the mock first to ensure proper mocking
import "../mocks/arrow";
import { mockArrowTable, mockTableFromIPC, mockTableToIPC } from "../mocks/arrow";
// Import the types separately, but not the implementation
import type { Table, StructRowProxy } from "apache-arrow";

// Import the module under test
import {
  isArrow,
  isArrowFile,
  arrayBufferToArrow,
  arrowToArrayBuffer,
  arrowToJSON,
  ARROW_MIME_TYPE,
} from "../../../src/files/arrow";

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("arrow utilities", () => {
  describe("isArrow", () => {
    it("should return true for Arrow tables", () => {
      const result = isArrow(mockArrowTable);
      expect(result).toBe(true);
    });

    it("should return false for non-Arrow objects", () => {
      const result = isArrow({});
      expect(result).toBe(false);
    });
  });

  describe("isArrowFile", () => {
    it("should return true for files with Arrow MIME type", async () => {
      const file = {
        type: ARROW_MIME_TYPE,
        arrayBuffer: jest
          .fn<() => Promise<ArrayBuffer>>()
          .mockResolvedValue(new ArrayBuffer(10)),
      } as unknown as File;

      const result = await isArrowFile(file);
      expect(result).toBe(true);
    });

    it("should return true for valid Arrow files without proper MIME type", async () => {
      const file = {
        type: "",
        arrayBuffer: jest
          .fn<() => Promise<ArrayBuffer>>()
          .mockResolvedValue(new ArrayBuffer(10)),
      } as unknown as File;

      const result = await isArrowFile(file);
      expect(result).toBe(true);
      expect(file.arrayBuffer).toHaveBeenCalled();
      expect(mockTableFromIPC).toHaveBeenCalled();
    });

    it("should return false for invalid Arrow files", async () => {
      const file = {
        type: "",
        arrayBuffer: jest
          .fn<() => Promise<ArrayBuffer>>()
          .mockResolvedValue(new ArrayBuffer(10)),
      } as unknown as File;

      // Make tableFromIPC throw an error
      mockTableFromIPC.mockImplementationOnce(() => {
        throw new Error("Invalid Arrow file");
      });

      const result = await isArrowFile(file);
      expect(result).toBe(false);
    });
  });

  describe("arrayBufferToArrow", () => {
    it("should convert ArrayBuffer to Arrow table", () => {
      const buffer = new ArrayBuffer(10);
      const result = arrayBufferToArrow(buffer);

      expect(mockTableFromIPC).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(result).toBe(mockArrowTable);
    });
  });

  describe("arrowToArrayBuffer", () => {
    it("should convert Arrow table to ArrayBuffer", () => {
      // We need to cast to make TypeScript happy, since the mock doesn't fully implement Table<any>
      const result = arrowToArrayBuffer(mockArrowTable as unknown as Table<any>);

      expect(mockTableToIPC).toHaveBeenCalledWith(mockArrowTable, "file");
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe("arrowToJSON", () => {
    it("should convert Arrow table to JSON", () => {
      const expectedResult = [
        { id: 1, name: "Row 1" },
        { id: 2, name: "Row 2" },
      ];

      // Set up the mockArrowTable.get implementation for this test
      const originalGet = mockArrowTable.get;
      // Fix: Use appropriate type for mock implementation
      (mockArrowTable.get as jest.Mock).mockImplementation(function (i: unknown) {
        const index = i as number;
        const rows = [
          { id: 1, name: "Row 1" },
          { id: 2, name: "Row 2" },
        ];

        return {
          toJSON: () => rows[index],
          toArray: () => [rows[index].id, rows[index].name],
          [Symbol.iterator]: function* () {
            yield* Object.values(rows[index]);
          },
        } as unknown as StructRowProxy<any>;
      });

      // Cast mockArrowTable to Table<any> to make TypeScript happy
      const result = arrowToJSON(mockArrowTable as unknown as Table<any>);

      expect(result).toEqual(expectedResult);
      expect(mockArrowTable.get).toHaveBeenCalledTimes(2);

      // Restore original implementation
      mockArrowTable.get = originalGet;
    });

    it("should handle empty rows", () => {
      // Set up the mockArrowTable.get implementation for this test
      const originalGet = mockArrowTable.get;
      // Fix: Use appropriate type for mock implementation
      (mockArrowTable.get as jest.Mock).mockImplementation(function (i: unknown) {
        const index = i as number;
        return index === 0
          ? null
          : ({
              toJSON: () => ({ id: 2, name: "Row 2" }),
              toArray: () => [2, "Row 2"],
              [Symbol.iterator]: function* () {
                yield 2;
                yield "Row 2";
              },
            } as unknown as StructRowProxy<any>);
      });

      // Cast mockArrowTable to Table<any> to make TypeScript happy
      const result = arrowToJSON(mockArrowTable as unknown as Table<any>);

      expect(result).toEqual([{ id: 2, name: "Row 2" }]);
      expect(mockArrowTable.get).toHaveBeenCalledTimes(2);

      // Restore original implementation
      mockArrowTable.get = originalGet;
    });
  });
});
