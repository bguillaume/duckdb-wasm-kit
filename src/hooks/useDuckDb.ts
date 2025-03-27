import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

import { getDuckDB } from "../init/initializeDuckDb.js";
// import { useAsync } from "react-async-hook";
import useAsync from "./useAsync.js";

/**
 * React hook to access a singleton DuckDB instance within components or other hooks.
 */
export const useDuckDb = (): {
  db: AsyncDuckDB | undefined;
  loading: boolean;
  error: Error | undefined;
} => {
  const { data: result, loading, error } = useAsync(async () => {
    return await getDuckDB();
  }, []);

  return { db: result, loading, error };
};
