/**
 * Tests for csv.ts
 */
import { describe, expect, it } from "@jest/globals";
import { CSV_MIME_TYPE } from "../../../src/files/csv";

describe("csv utilities", () => {
  describe("CSV_MIME_TYPE", () => {
    it("should have the correct value", () => {
      expect(CSV_MIME_TYPE).toBe("text/csv");
    });
  });
});
