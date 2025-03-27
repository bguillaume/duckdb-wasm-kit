import { Table as Arrow } from "apache-arrow";

import { runQuery } from "../util/runQuery.js";
import useAsync from "./useAsync.js";
import { useDuckDb } from "./useDuckDb.js";

/**
 * Execute a SQL query and return the result as Arrow.
 *
 * Wait for DuckDB to initialize if necessary.
 *
 * If sql is undefined, returns undefined.
 */
export const useDuckDbQuery = (
  sql: string | undefined,
): {
  arrow: Arrow | undefined;
  loading: boolean;
  error: Error | undefined;
} => {
  const { db } = useDuckDb();

  const { data: arrow, loading, error } = useAsync(async () => {
    if (!db || !sql) return undefined;
    return await runQuery(db, sql);
  }, [db, sql]);

  return { arrow, loading, error };
};
