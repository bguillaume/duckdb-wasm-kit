/**
 * Tests for perf.ts utilities
 */
import { describe, expect, it, jest, beforeEach, afterEach } from "../utils/jest-utils";

// Import the module under test
import { logElapsedTime } from "../../../src/util/perf";

describe("perf utilities", () => {
  // Save original console.debug
  const originalConsoleDebug = console.debug;
  const consoleDebugSpy = jest.fn();

  beforeEach(() => {
    // Mock console.debug
    console.debug = consoleDebugSpy;

    // Mock performance.now()
    jest.spyOn(performance, "now").mockReturnValue(1000);
  });

  afterEach(() => {
    // Restore console.debug
    console.debug = originalConsoleDebug;
    jest.restoreAllMocks();
  });

  describe("logElapsedTime", () => {
    it("should log time in seconds for elapsed time >= 1000ms", () => {
      // Simulate elapsed time of 1500ms
      jest.spyOn(performance, "now").mockReturnValue(2500);

      logElapsedTime("Test operation", 1000);

      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining("[1.5s]"));
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test operation"),
      );
    });

    it("should log time in milliseconds for elapsed time between 1ms and 999ms", () => {
      // Simulate elapsed time of 500ms
      jest.spyOn(performance, "now").mockReturnValue(1500);

      logElapsedTime("Test operation", 1000);

      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining("[500ms]"));
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test operation"),
      );
    });

    it("should log time with decimal precision for elapsed time < 1ms", () => {
      // Simulate elapsed time of 0.5ms
      jest.spyOn(performance, "now").mockReturnValue(1000.5);

      logElapsedTime("Test operation", 1000);

      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining("[0.500ms]"));
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test operation"),
      );
    });

    it("should use provided end time when specified", () => {
      logElapsedTime("Test operation", 1000, 1200);

      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining("[200ms]"));
    });

    it("should include ANSI color codes in the output", () => {
      logElapsedTime("Test operation", 1000, 1200);

      const colorRegex = /\x1b\[\d+m/; // Match ANSI color codes
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringMatching(colorRegex));
    });
  });
});
