/**
 * Tests for tempfile.ts utilities
 */
import { describe, expect, it, jest, beforeEach, afterEach } from "../utils/jest-utils";

// Import the module under test
import { getTempFilename } from "../../../src/util/tempfile";

describe("tempfile utilities", () => {
  describe("getTempFilename", () => {
    beforeEach(() => {
      // Mock Date.now() to return a consistent timestamp
      jest.spyOn(Date, "now").mockReturnValue(1234567890);

      // Mock Math.random() to return a consistent random value
      jest.spyOn(Math, "random").mockReturnValue(0.123456789);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should generate a filename with timestamp and random string", () => {
      const filename = getTempFilename();

      expect(filename).toMatch(/^file-\d+-[a-z0-9]+$/);
      expect(filename).toContain("1234567890");
      expect(filename).toContain("4fzzzxjylrx");
    });

    it("should generate unique filenames on each call", () => {
      // Restore the mocks so we get actual random values
      jest.restoreAllMocks();

      const filename1 = getTempFilename();
      const filename2 = getTempFilename();

      expect(filename1).not.toEqual(filename2);
    });
  });
});
