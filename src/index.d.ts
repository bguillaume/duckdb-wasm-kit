/**
 * duckdb-wasm-kit
 *
 * This module serves as the main entry point for duckdb-wasm-kit and re-exports
 * key functions and classes for interacting with DuckDB in a web environment.
 *
 * @module duckdb-wasm-kit
 */
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

import { useDuckDb } from "./hooks/useDuckDb.js";
import { useDuckDbQuery } from "./hooks/useDuckDbQuery.js";
import initializeDuckDb, { getDuckDB } from "./init/initializeDuckDb.js";
import { cardinalities, drop, tableNames } from "./util/queries.js";
import { runQuery } from "./util/runQuery.js";
import { getTempFilename } from "./util/tempfile.js";
export * from "./files/index.js";
export { AsyncDuckDB, getDuckDB, initializeDuckDb, runQuery, tableNames, // Add this export
useDuckDb, useDuckDbQuery };
export { cardinalities, drop, getTempFilename };
