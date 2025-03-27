/**
 * Utility file that re-exports all commonly used Jest globals
 * This helps ensure consistent imports across test files
 */
import {
  describe,
  expect,
  it,
  test,
  jest,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "@jest/globals";

export { describe, expect, it, test, jest, beforeAll, afterAll, beforeEach, afterEach };
