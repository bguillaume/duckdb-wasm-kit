/**
 * Arrow Table mock for testing arrow.ts functions
 */
import { jest } from "@jest/globals";
import { StructRowProxy } from "apache-arrow";

// Import the Table type from apache-arrow to help with typings
import type { Table } from "apache-arrow";

// We'll create our own mock without importing the actual Table
// to avoid circular dependencies

// Define explicit types for our Jest mock functions
type _MockFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

// Create a properly typed mock Arrow Table
const createMockArrowTable = () => {
  const mockTable = {
    // Basic table properties
    numRows: 2,
    numCols: 2,
    length: 2,
    chunks: [],
    dictionaries: new Map(),
    schema: {
      fields: [
        { name: "id", type: { typeId: "int" }, nullable: false },
        { name: "name", type: { typeId: "utf8" }, nullable: false },
      ],
    },

    // Properties required by the Table interface
    TType: {} as any,
    TArray: {} as any,
    TValue: {} as any,
    _offsets: [] as any,
    _children: [] as any,
    _nulls: [] as any,
    _type: {} as any,
    _name: "test_table" as any,
    _chunkIndex: [] as any,
    _rowIndex: [] as any,
    _chunks: [] as any,
    _schema: {} as any,
    _names: [] as any,
    _dictionaries: new Map(),
    _rowCount: 2,
    Symbol: Symbol() as any,

    // Mock implementation of get method
    get: jest.fn().mockImplementation(function (i: unknown) {
      const index = i as number;
      const rows = [
        { id: 1, name: "Row 1" },
        { id: 2, name: "Row 2" },
      ];

      // Return an object that satisfies the StructRowProxy interface
      return {
        toJSON: () => rows[index],
        toArray: () => [rows[index].id, rows[index].name],
        [Symbol.iterator]: function* () {
          yield* Object.values(rows[index]);
        },
      } as unknown as StructRowProxy<any>;
    }),

    // Mock implementations of other methods
    toArray: jest.fn().mockReturnValue([
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ]),
    getChild: jest.fn(),
    concat: jest.fn(),
    slice: jest.fn(),
    filter: jest.fn(),
    scan: jest.fn(),
    countBy: jest.fn(),
    select: jest.fn(),
    selectAt: jest.fn(),
    assign: jest.fn(),
  };

  return mockTable as unknown as Table<any>;
};

// Create the mock instance
export const mockArrowTable = createMockArrowTable();

// Mock apache-arrow functions with explicit type assertions
export const mockTableFromIPC = jest
  .fn()
  .mockReturnValue(mockArrowTable) as jest.MockedFunction<
  (buffer: ArrayBuffer) => Table<any>
>;

export const mockTableToIPC = jest.fn().mockReturnValue({
  buffer: new ArrayBuffer(10),
}) as jest.MockedFunction<(table: Table<any>, mode?: any) => { buffer: ArrayBuffer }>;

// Create a fake Table constructor for instanceof checks
// without relying on the actual apache-arrow import
const TableMock = function () {} as unknown as { new (): Table<any>; prototype: object };

// Set the prototype chain to enable instanceof checks
Object.setPrototypeOf(mockArrowTable, TableMock.prototype);

// Mock the apache-arrow module
jest.mock("apache-arrow", () => {
  return {
    __esModule: true,
    // Use our mock Table class instead of importing the real one
    Table: TableMock,
    // Fix TypeScript errors by using any for parameters
    tableFromIPC: jest.fn().mockImplementation(function (buffer: any) {
      return mockTableFromIPC(buffer);
    }),
    tableToIPC: jest.fn().mockImplementation(function (table: any, mode?: any) {
      return mockTableToIPC(table, mode);
    }),
  };
});
