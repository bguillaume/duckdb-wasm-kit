/**
 * File Insertion Module for duckdb-wasm-kit
 *
 * This module implements file import into DuckDB, supporting CSV, Arrow, and Parquet formats.
 * The main exported function, insertFile, selects the appropriate insertion method based on
 * the file's content, MIME type, and extension.
 *
 * If an error occurs during insertion, an InsertFileError is thrown.
 */
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { Table as Arrow } from "apache-arrow";
export declare class InsertFileError extends Error {
    title: string;
    constructor(title: string, message: string);
}
/**
 * Inserts a file (CSV, Arrow, or Parquet) into DuckDB.
 *
 * @param db DuckDB instance
 * @param file File handle (input file)
 * @param tableName Optional table name (defaults to file name)
 * @param debug If true, logs elapsed time during insertion
 * @throws {InsertFileError} if the file cannot be inserted
 */
export declare const insertFile: (db: AsyncDuckDB, file: File, tableName?: string, debug?: boolean) => Promise<void>;
/**
 * Inserts a CSV file in DuckDB from a File handle.
 */
export declare const insertCSV: (db: AsyncDuckDB, file: File, tableName: string) => Promise<void>;
/**
 * Inserts an Arrow file into DuckDB from a File handle.
 */
export declare const insertArrow: (db: AsyncDuckDB, file: File, tableName: string) => Promise<void>;
/**
 * Inserts an in-memory Arrow table into DuckDB.
 */
export declare const insertArrowTable: (db: AsyncDuckDB, arrow: Arrow, tableName: string) => Promise<void>;
/**
 * Inserts a Parquet file into DuckDB from a File handle.
 */
export declare const insertParquet: (db: AsyncDuckDB, file: File, tableName: string) => Promise<void>;
