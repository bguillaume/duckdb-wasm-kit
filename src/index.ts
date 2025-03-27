/**
 * duckdb-wasm-kit
 *
 * This module serves as the main entry point for duckdb-wasm-kit and re-exports
 * key functions and classes for interacting with DuckDB in a web environment.
 *
 * @module duckdb-wasm-kit
 */

import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

// Update local imports to remove file extensions
import { useDuckDb } from "./hooks/useDuckDb";
import { useDuckDbQuery } from "./hooks/useDuckDbQuery";
import initializeDuckDb, { getDuckDB } from "./init/initializeDuckDb";
import { cardinalities, drop, tableNames } from "./util/queries";
import { runQuery } from "./util/runQuery";
import { getTempFilename } from "./util/tempfile";

// Replace export with no extension
export * from "./files/index";

export {
  AsyncDuckDB,
  getDuckDB,
  initializeDuckDb,
  runQuery,
  tableNames,
  useDuckDb,
  useDuckDbQuery,
};

// Don't depend on these :)
export { cardinalities, drop, getTempFilename };
