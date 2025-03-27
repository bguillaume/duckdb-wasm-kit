/**
 * Tests for queries.ts utilities
 */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import "../mocks/duckdb";
import "../mocks/arrow";
import { mockAsyncDuckDB } from "../mocks/duckdb";

// Mock the runQuery function with proper typing
const mockRunQuery = jest.fn();
jest.mock("../../../src/util/runQuery", () => ({
  runQuery: (...args: any[]) => mockRunQuery(...args),
}));

// Import the module under test
import {
  TableType,
  tableType,
  drop,
  rename,
  tableNames,
  columnTypes,
  cardinalities,
} from "../../../src/util/queries";

describe("queries utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("tableType", () => {
    it("should return TableType.Table for base tables", async () => {
      // Mock arrow table with one row indicating a base table
      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          numRows: 1,
          get: jest.fn().mockReturnValue({
            toArray: () => ["BASE TABLE"],
          }),
        }),
      );

      const result = await tableType(mockAsyncDuckDB, "test_table");

      expect(mockRunQuery).toHaveBeenCalledWith(
        mockAsyncDuckDB,
        expect.stringContaining("where table_name = 'test_table'"),
      );
      expect(result).toBe(TableType.Table);
    });

    it("should return TableType.View for views", async () => {
      // Mock arrow table with one row indicating a view
      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          numRows: 1,
          get: jest.fn().mockReturnValue({
            toArray: () => ["VIEW"],
          }),
        }),
      );

      const result = await tableType(mockAsyncDuckDB, "test_view");

      expect(result).toBe(TableType.View);
    });

    it("should return undefined for non-existent tables", async () => {
      // Mock arrow table with no rows
      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          numRows: 0,
          get: jest.fn(),
        }),
      );

      const result = await tableType(mockAsyncDuckDB, "non_existent");

      expect(result).toBeUndefined();
    });

    it("should throw error for unexpected table types", async () => {
      // Mock arrow table with unexpected table type
      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          numRows: 1,
          get: jest.fn().mockReturnValue({
            toArray: () => ["UNKNOWN_TYPE"],
          }),
        }),
      );

      await expect(tableType(mockAsyncDuckDB, "weird_table")).rejects.toThrow(
        "Unexpected table type: UNKNOWN_TYPE",
      );
    });
  });

  describe("drop", () => {
    it("should drop tables correctly", async () => {
      // Setup sequential mocks for the different calls
      mockRunQuery.mockImplementationOnce(() =>
        Promise.resolve({
          numRows: 1,
          get: jest.fn().mockReturnValue({
            toArray: () => ["BASE TABLE"],
          }),
        }),
      );

      mockRunQuery.mockImplementationOnce(() => Promise.resolve({}));

      await drop(mockAsyncDuckDB, "test_table");

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        mockAsyncDuckDB,
        'drop table if exists "test_table"',
      );
    });

    it("should drop views correctly", async () => {
      // Mock tableType to return TableType.View
      mockRunQuery.mockImplementationOnce(() =>
        Promise.resolve({
          numRows: 1,
          get: jest.fn().mockReturnValue({
            toArray: () => ["VIEW"],
          }),
        }),
      );

      mockRunQuery.mockImplementationOnce(() => Promise.resolve({}));

      await drop(mockAsyncDuckDB, "test_view");

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        mockAsyncDuckDB,
        'drop view if exists "test_view"',
      );
    });

    it("should do nothing for non-existent tables", async () => {
      // Mock tableType to return undefined
      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          numRows: 0,
          get: jest.fn(),
        }),
      );

      await drop(mockAsyncDuckDB, "non_existent");

      // Only the initial tableType query should be called
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe("rename", () => {
    it("should rename tables correctly", async () => {
      // Mock tableType to return TableType.Table
      mockRunQuery.mockImplementationOnce(() =>
        Promise.resolve({
          numRows: 1,
          get: jest.fn().mockReturnValue({
            toArray: () => ["BASE TABLE"],
          }),
        }),
      );

      mockRunQuery.mockImplementationOnce(() => Promise.resolve({}));

      await rename(mockAsyncDuckDB, "old_name", "new_name");

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        mockAsyncDuckDB,
        'alter table "old_name" rename to "new_name"',
      );
    });

    it("should rename views correctly", async () => {
      // Mock tableType to return TableType.View
      mockRunQuery.mockImplementationOnce(() =>
        Promise.resolve({
          numRows: 1,
          get: jest.fn().mockReturnValue({
            toArray: () => ["VIEW"],
          }),
        }),
      );

      mockRunQuery.mockImplementationOnce(() => Promise.resolve({}));

      await rename(mockAsyncDuckDB, "old_view", "new_view");

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        mockAsyncDuckDB,
        'alter view "old_view" rename to "new_view"',
      );
    });

    it("should throw error for non-existent tables", async () => {
      // Mock tableType to return undefined
      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          numRows: 0,
          get: jest.fn(),
        }),
      );

      await expect(rename(mockAsyncDuckDB, "non_existent", "new_name")).rejects.toThrow(
        "Table not found: non_existent",
      );
    });
  });

  describe("tableNames", () => {
    it("should return table names excluding views by default", async () => {
      // Mock runQuery to return a table with table names
      const mockTableNames = ["table1", "table2"];
      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          getChild: jest.fn().mockReturnValue({
            toArray: () => mockTableNames,
          }),
        }),
      );

      const result = await tableNames(mockAsyncDuckDB);

      expect(mockRunQuery).toHaveBeenCalledWith(
        mockAsyncDuckDB,
        expect.stringContaining("where table_type = 'BASE TABLE'"),
      );
      expect(result).toEqual(mockTableNames);
    });

    it("should include views when includeViews is true", async () => {
      // Mock runQuery to return a table with table and view names
      const mockAllNames = ["table1", "table2", "view1"];
      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          getChild: jest.fn().mockReturnValue({
            toArray: () => mockAllNames,
          }),
        }),
      );

      const result = await tableNames(mockAsyncDuckDB, true);

      expect(mockRunQuery).toHaveBeenCalledWith(
        mockAsyncDuckDB,
        expect.not.stringContaining("where table_type = 'BASE TABLE'"),
      );
      expect(result).toEqual(mockAllNames);
    });

    it("should return empty array when no tables exist", async () => {
      // Mock runQuery to return a table with no child
      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          getChild: jest.fn().mockReturnValue(null),
        }),
      );

      const result = await tableNames(mockAsyncDuckDB);

      expect(result).toEqual([]);
    });
  });

  describe("columnTypes", () => {
    it("should return map of column names to types", async () => {
      // Mock runQuery to return columns and types
      const mockGet = jest.fn();
      mockGet
        .mockReturnValueOnce({
          toArray: () => ["id", "INTEGER"],
        })
        .mockReturnValueOnce({
          toArray: () => ["name", "VARCHAR"],
        });

      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          numRows: 2,
          get: mockGet,
        }),
      );

      const result = await columnTypes(mockAsyncDuckDB, "test_table");

      expect(mockRunQuery).toHaveBeenCalledWith(
        mockAsyncDuckDB,
        expect.stringContaining("where table_name = 'test_table'"),
      );
      expect(result).toEqual(
        new Map([
          ["id", "INTEGER"],
          ["name", "VARCHAR"],
        ]),
      );
    });

    it("should return empty map for non-existent tables", async () => {
      // Mock runQuery to return empty table
      mockRunQuery.mockImplementation(() =>
        Promise.resolve({
          numRows: 0,
          get: jest.fn(),
        }),
      );

      const result = await columnTypes(mockAsyncDuckDB, "non_existent");

      expect(result).toEqual(new Map());
    });
  });

  describe("cardinalities", () => {
    it("should return cardinalities of all columns", async () => {
      // Mock columnTypes to return column types
      const mockGet1 = jest.fn();
      mockGet1
        .mockReturnValueOnce({
          toArray: () => ["id", "INTEGER"],
        })
        .mockReturnValueOnce({
          toArray: () => ["name", "VARCHAR"],
        });

      mockRunQuery.mockImplementationOnce(() =>
        Promise.resolve({
          numRows: 2,
          get: mockGet1,
        }),
      );

      mockRunQuery.mockImplementationOnce(() =>
        Promise.resolve({
          get: jest.fn().mockReturnValue({
            toArray: () => [10, 5],
          }),
        }),
      );

      const result = await cardinalities(mockAsyncDuckDB, "test_table");

      expect(result).toEqual({
        id: 10,
        name: 5,
      });
    });

    it("should throw error if count query returns no rows", async () => {
      // Mock columnTypes and empty count result
      const mockGet1 = jest.fn();
      mockGet1
        .mockReturnValueOnce({
          toArray: () => ["id", "INTEGER"],
        })
        .mockReturnValueOnce({
          toArray: () => ["name", "VARCHAR"],
        });

      mockRunQuery.mockImplementationOnce(() =>
        Promise.resolve({
          numRows: 2,
          get: mockGet1,
        }),
      );

      mockRunQuery.mockImplementationOnce(() =>
        Promise.resolve({
          get: jest.fn().mockReturnValue(null),
        }),
      );

      await expect(cardinalities(mockAsyncDuckDB, "test_table")).rejects.toThrow(
        "Expected a single row of cardinalities: test_table",
      );
    });

    it("should throw error if column count mismatch", async () => {
      // Mock columnTypes and mismatched count result
      const mockGet1 = jest.fn();
      mockGet1
        .mockReturnValueOnce({
          toArray: () => ["id", "INTEGER"],
        })
        .mockReturnValueOnce({
          toArray: () => ["name", "VARCHAR"],
        });

      mockRunQuery.mockImplementationOnce(() =>
        Promise.resolve({
          numRows: 2,
          get: mockGet1,
        }),
      );

      mockRunQuery.mockImplementationOnce(() =>
        Promise.resolve({
          get: jest.fn().mockReturnValue({
            toArray: () => [10], // Only one value instead of two
          }),
        }),
      );

      await expect(cardinalities(mockAsyncDuckDB, "test_table")).rejects.toThrow(
        "Unexpected length mismatch: test_table",
      );
    });
  });
});
