/**
 * DuckDB mocks for testing
 */
import { jest } from "@jest/globals";
import { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { Table } from "apache-arrow";

// Define explicit types for our Jest mock functions - underscore prefix to avoid unused warning
type _MockFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

// Define CSVInsertOptions interface locally - underscore prefix to avoid unused warning
interface _CSVInsertOptions {
  name: string;
  schema?: string;
  detect?: boolean;
  header?: boolean;
  delimiter?: string;
}

// Mock functions with proper return types and explicit type assertions
export const mockRunQuery = jest
  .fn()
  .mockReturnValue(Promise.resolve()) as jest.MockedFunction<() => Promise<void>>;

export const mockConnect = jest
  .fn()
  .mockReturnValue(Promise.resolve({} as AsyncDuckDBConnection)) as jest.MockedFunction<
  () => Promise<AsyncDuckDBConnection>
>;

export const mockRegisterFileHandle = jest
  .fn()
  .mockReturnValue(Promise.resolve()) as jest.MockedFunction<
  (path: string, fileHandle: any) => Promise<void>
>;

export const mockRegisterFileBuffer = jest
  .fn()
  .mockReturnValue(Promise.resolve()) as jest.MockedFunction<
  (path: string, buffer: Uint8Array) => Promise<void>
>;

export const mockExportFileBuffer = jest
  .fn()
  .mockReturnValue(Promise.resolve(new Uint8Array())) as jest.MockedFunction<
  (path: string) => Promise<Uint8Array>
>;

export const mockInsertArrowTable = jest
  .fn()
  .mockReturnValue(Promise.resolve()) as jest.MockedFunction<
  (table: Table<any>, options: any) => Promise<void>
>;

export const mockInsertArrowFromIPCStream = jest
  .fn()
  .mockReturnValue(Promise.resolve()) as jest.MockedFunction<
  (buffer: Uint8Array, options: any) => Promise<void>
>;

export const mockQueryArrow = jest
  .fn()
  .mockReturnValue(Promise.resolve({} as Table<any>)) as jest.MockedFunction<
  (sql: string) => Promise<Table<any>>
>;

export const mockQuery = jest
  .fn()
  .mockReturnValue(Promise.resolve()) as jest.MockedFunction<
  (sql: string) => Promise<any>
>;

export const mockRegisterFileText = jest
  .fn()
  .mockReturnValue(Promise.resolve()) as jest.MockedFunction<
  (path: string, text: string) => Promise<void>
>;

export const mockDropFile = jest
  .fn()
  .mockReturnValue(Promise.resolve(null)) as jest.MockedFunction<
  (path: string) => Promise<null>
>;

export const mockCopyFileToBuffer = jest
  .fn()
  .mockReturnValue(Promise.resolve(new Uint8Array())) as jest.MockedFunction<
  (path: string) => Promise<Uint8Array>
>;

export const mockInstantiate = jest
  .fn()
  .mockReturnValue(Promise.resolve()) as jest.MockedFunction<() => Promise<void>>;

export const mockOpen = jest
  .fn()
  .mockReturnValue(Promise.resolve({} as AsyncDuckDB)) as jest.MockedFunction<
  () => Promise<AsyncDuckDB>
>;

// Create a mock DuckDB connection with properly typed methods
export const mockDuckDBConnection = {
  query: mockQuery,
  queryArrow: mockQueryArrow,
  insertArrowTable: mockInsertArrowTable,
  insertCSVFromPath: jest.fn().mockReturnValue(Promise.resolve()),
  close: jest.fn().mockReturnValue(Promise.resolve()),
} as unknown as AsyncDuckDBConnection;

// Create a dummy AsyncDuckDB object to avoid circular reference
const dummyAsyncDuckDB = {} as AsyncDuckDB;

// Create a more complete mock implementation with proper Promise return types
export const mockAsyncDuckDB = {
  // Methods we're using in our tests
  connect: mockConnect.mockReturnValue(Promise.resolve(mockDuckDBConnection)),
  registerFileHandle: mockRegisterFileHandle.mockReturnValue(Promise.resolve()),
  registerFileBuffer: mockRegisterFileBuffer.mockReturnValue(Promise.resolve()),
  registerFileText: mockRegisterFileText.mockReturnValue(Promise.resolve()),
  exportFileBuffer: mockExportFileBuffer.mockReturnValue(
    Promise.resolve(new Uint8Array()),
  ),
  insertArrowFromIPCStream: mockInsertArrowFromIPCStream.mockReturnValue(
    Promise.resolve(),
  ),
  copyFileToBuffer: mockCopyFileToBuffer.mockReturnValue(
    Promise.resolve(new Uint8Array()),
  ),
  dropFile: mockDropFile.mockReturnValue(Promise.resolve(null)),
  instantiate: mockInstantiate.mockReturnValue(Promise.resolve()),
  // Fix: Use dummy object instead of causing a circular reference
  open: mockOpen.mockReturnValue(Promise.resolve(dummyAsyncDuckDB)),
  close: jest.fn().mockReturnValue(Promise.resolve()),
  terminate: jest.fn().mockReturnValue(Promise.resolve()),

  // Add missing methods required by tests
  collectFileStatistics: jest.fn().mockReturnValue(Promise.resolve({})),
  dropFiles: jest.fn().mockReturnValue(Promise.resolve()),
  flushFiles: jest.fn().mockReturnValue(Promise.resolve()),
  globFiles: jest.fn().mockReturnValue(Promise.resolve([])),
  listTableNames: jest.fn().mockReturnValue(Promise.resolve([])),
  reset: jest.fn().mockReturnValue(Promise.resolve()),
  tokenize: jest.fn().mockReturnValue(Promise.resolve([])),
  registerFileURL: jest.fn().mockReturnValue(Promise.resolve()),
  createTable: jest.fn().mockReturnValue(Promise.resolve()),
  registerEmptyFileBuffer: jest.fn().mockReturnValue(Promise.resolve()),
} as unknown as AsyncDuckDB;

// Now that mockAsyncDuckDB is fully initialized, we can properly set up mockOpen
// to return it instead of the dummy instance
mockOpen.mockReturnValue(Promise.resolve(mockAsyncDuckDB));

// Define the bundle interface to match what DuckDB expects
interface DuckDBBundle {
  mainWorker: string;
  mainModule: string;
  pthreadWorker: string;
}

// Mock DuckDB module
jest.mock("@duckdb/duckdb-wasm", () => {
  //   const _originalModule = jest.requireActual("@duckdb/duckdb-wasm");

  // Create a typed mock module without using spread operator
  const mockModule = {
    // Add specific properties we need from the original module
    AsyncDuckDB: jest.fn().mockImplementation(() => mockAsyncDuckDB),
    ConsoleLogger: jest.fn(),
    VoidLogger: jest.fn(),
    getJsDelivrBundles: jest.fn().mockReturnValue({
      mvp: {
        mainWorker: "worker.js",
        mainModule: "module.wasm",
        pthreadWorker: "pthread.js",
      },
      eh: {
        mainWorker: "worker-eh.js",
        mainModule: "module-eh.wasm",
        pthreadWorker: "pthread-eh.js",
      },
    }),
    // Properly type the selectBundle function return value
    selectBundle: jest.fn().mockImplementation((): Promise<DuckDBBundle> => {
      return Promise.resolve({
        mainWorker: "worker.js",
        mainModule: "module.wasm",
        pthreadWorker: "pthread.js",
      });
    }),
    DuckDBDataProtocol: {
      BROWSER_FILEREADER: "BROWSER_FILEREADER",
      NODE_FILESYSTEM: "NODE_FILESYSTEM",
    },
  };

  return mockModule;
});
