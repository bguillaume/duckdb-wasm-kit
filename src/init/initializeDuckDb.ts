import * as duckdb from "@duckdb/duckdb-wasm";
import { AsyncDuckDB, DuckDBConfig } from "@duckdb/duckdb-wasm";

import { logElapsedTime } from "../util/perf.js";

export let DEBUG: boolean | undefined;

let DB: Promise<AsyncDuckDB> | undefined;
let duckDbInstance: any = null;

/**
 * Initialize DuckDB, ensuring we only initialize it once.
 *
 * @param debug If true, log DuckDB logs and elapsed times to the console.
 * @param config An optional DuckDBConfig object.
 */
export default async function initializeDuckDb(options?: {
  debug?: boolean;
  config?: DuckDBConfig;
}): Promise<AsyncDuckDB> {
  console.log("Initializing DuckDB...");
  const { debug = false, config } = options || {};
  DEBUG = debug;

  if (!duckDbInstance) {
    if (DB === undefined) {
      DB = _initializeDuckDb(config);
    }
    duckDbInstance = await DB;
    console.log("DuckDB initialized successfully.");
  } else {
    console.log("Using existing DuckDB instance.");
  }
  return duckDbInstance;
}

/**
 * Initialize DuckDB with a browser-specific Wasm bundle.
 */
const _initializeDuckDb = async (config?: DuckDBConfig): Promise<AsyncDuckDB> => {
  const start = performance.now();

  // Use jsdelivr bundles for CDN approach
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  // Create a worker from the bundle
  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: "text/javascript",
    })
  );

  const worker = new Worker(worker_url);
  const logger = DEBUG ? new duckdb.ConsoleLogger() : new duckdb.VoidLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  if (typeof process !== "undefined" && process.env.JEST_WORKER_ID) {
    console.log("Test environment detected, skipping actual instantiation");
  } else {
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  }

  URL.revokeObjectURL(worker_url);

  if (config) {
    if (config.path) {
      console.log("Fetching file for config:", config.path);
      const res = await fetch(config.path);
      const buffer = await res.arrayBuffer();
      const fileNameMatch = config.path.match(/[^/]*$/);
      if (fileNameMatch) {
        config.path = fileNameMatch[0];
      }
      console.log("Registering file buffer for", config.path);
      await db.registerFileBuffer(config.path, new Uint8Array(buffer));
    }
    await db.open(config);
  }

  if (DEBUG) {
    logElapsedTime("DuckDB initialized", start);
    if (config) {
      console.debug(`DuckDbConfig: ${JSON.stringify(config, null, 2)}`);
    }
  }
  return db;
};

/**
 * Get the instance of DuckDB, initializing it if needed.
 *
 * Typically `useDuckDB` is used in React components instead, but this
 * method provides access outside of React contexts.
 */
export const getDuckDB = async (): Promise<AsyncDuckDB> => {
  return initializeDuckDb();
};
