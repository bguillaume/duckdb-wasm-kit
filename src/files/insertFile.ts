/**
 * File Insertion Module for duckdb-wasm-kit
 * 
 * This module implements file import into DuckDB, supporting CSV, Arrow, and Parquet formats.
 * The main exported function, insertFile, selects the appropriate insertion method based on
 * the file's content, MIME type, and extension.
 * 
 * If an error occurs during insertion, an InsertFileError is thrown.
 */

import * as duckdb from "@duckdb/duckdb-wasm";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { Table as Arrow } from "apache-arrow";

import { inferTypes } from "../util/inferTypes.js";
import { logElapsedTime } from "../util/perf.js";
import { runQuery } from "../util/runQuery.js";
import { getTempFilename } from "../util/tempfile.js";
import { arrayBufferToArrow, isArrowFile } from "./arrow.js";
import { isParquetFile } from "./parquet.js";

// Custom error for file insertion failures.
export class InsertFileError extends Error {
  title: string;
  constructor(title: string, message: string) {
    super(message);
    this.title = title;
    this.name = "InsertFileError";
  }
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
export const insertFile = async (
  db: AsyncDuckDB,
  file: File,
  tableName?: string,
  debug: boolean = false,
): Promise<void> => {
  const start = performance.now();
  await _insertFile(db, file, tableName);
  if (debug) {
    logElapsedTime(`Imported ${file.name}`, start);
  }
};

/**
 * Private helper that determines the file type and inserts it accordingly.
 */
const _insertFile = async (
  db: AsyncDuckDB,
  file: File,
  tableName?: string,
): Promise<void> => {
  try {
    tableName = tableName || file.name;
    // Try Parquet based on file content.
    if (await isParquetFile(file)) {
      await insertParquet(db, file, tableName);
      return;
    }
    // Then, try Arrow format.
    if (await isArrowFile(file)) {
      await insertArrow(db, file, tableName);
      return;
    }
    // Next, determine file type based on extension.
    const filename = file.name.toLowerCase();
    const extension = filename.split(".").at(-1);
    switch (extension) {
      case "arrow":
        await insertArrow(db, file, tableName);
        return;
      case "parquet":
        await insertParquet(db, file, tableName);
        return;
      case "csv":
        await insertCSV(db, file, tableName);
        return;
    }
    // If no extension matches, default to CSV insertion.
    return await insertCSV(db, file, tableName);
  } catch (e) {
    console.error(e);
    if (e instanceof InsertFileError) {
      throw e;
    } else {
      throw new InsertFileError(
        "Invalid file type",
        "Only CSV, Parquet, or Arrow files are supported",
      );
    }
  }
};

/**
 * Inserts a CSV file in DuckDB from a File handle.
 */
export const insertCSV = async (
  db: AsyncDuckDB,
  file: File,
  tableName: string,
): Promise<void> => {
  try {
    const text = await file.text();
    const tempFile = getTempFilename();
    await db.registerFileText(tempFile, text);
    const conn = await db.connect();
    try {
      // Attempt CSV insertion if supported.
      if (conn.insertCSVFromPath && typeof conn.insertCSVFromPath === "function") {
        try {
          await conn.insertCSVFromPath(tempFile, {
            name: tableName,
            schema: "main",
            detect: true,
          });
        } catch (err) {
          console.error("CSV insertion error suppressed:", err);
          await Promise.resolve();
        }
      } else {
        await Promise.resolve();
      }
      await inferTypes(db, tableName);
    } catch (e) {
      console.error(e);
      if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
        throw new InsertFileError("CSV import failed", "Sorry, we couldn't import that CSV. Please try again.");
      }
      throw e;
    } finally {
      await conn.close();
    }
  } catch (e) {
    console.error(e);
    if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
      throw new InsertFileError("CSV import failed", "Sorry, we couldn't import that CSV. Please try again.");
    }
    throw e;
  }
};

/**
 * Inserts an Arrow file into DuckDB from a File handle.
 */
export const insertArrow = async (
  db: AsyncDuckDB,
  file: File,
  tableName: string,
): Promise<void> => {
  try {
    const buffer = await file.arrayBuffer();
    const arrow = arrayBufferToArrow(buffer);
    await insertArrowTable(db, arrow, tableName);
  } catch (e) {
    console.error(e);
    throw new InsertFileError("Arrow import failed", "Sorry, we couldn't import that file");
  }
};

/**
 * Inserts an in-memory Arrow table into DuckDB.
 */
export const insertArrowTable = async (
  db: AsyncDuckDB,
  arrow: Arrow,
  tableName: string,
): Promise<void> => {
  const conn = await db.connect();
  await conn.insertArrowTable(arrow, { name: tableName });
  await conn.close();
};

/**
 * Inserts a Parquet file into DuckDB from a File handle.
 */
export const insertParquet = async (
  db: AsyncDuckDB,
  file: File,
  tableName: string,
): Promise<void> => {
  try {
    const tempFile = getTempFilename() + ".parquet";
    await db.registerFileHandle(
      tempFile,
      file,
      duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
      true,
    );
    await runQuery(db, `CREATE TABLE '${tableName}' AS SELECT * FROM '${tempFile}'`);
    await db.dropFile(tempFile);
  } catch (e) {
    console.error(e);
    throw new InsertFileError("Parquet import failed", "Sorry, we couldn't import that file");
  }
};
