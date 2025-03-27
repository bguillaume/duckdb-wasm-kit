/**
 * Tests for useAsync.ts
 */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import "../mocks/react-hooks";
import { mockUseState, mockUseEffect, storedEffectFn } from "../mocks/react-hooks";

type AsyncFunction<T> = () => Promise<T>;

// Import the module under test
import useAsync from "../../../src/hooks/useAsync";

describe("useAsync", () => {
  // Mock state setters
  const mockSetLoading = jest.fn();
  const mockSetError = jest.fn();
  const mockSetData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Override useState mock to return our custom state setters
    // Use explicit type assertions to avoid type errors
    (mockUseState as jest.Mock)
      .mockImplementationOnce(() => [false as any, mockSetLoading])
      .mockImplementationOnce(() => [undefined as any, mockSetError])
      .mockImplementationOnce(() => [undefined as any, mockSetData]);
  });

  it("should initialize with loading=false, error=undefined, data=undefined", () => {
    const mockFn = jest.fn().mockImplementation((): Promise<string> => {
      return Promise.resolve("test-data");
    });

    const result = useAsync(mockFn as AsyncFunction<unknown>);

    expect(result).toEqual({
      loading: false,
      error: undefined,
      data: undefined,
    });
  });

  it("should call the async function and update states correctly on success", async () => {
    const mockData = "test-data";
    const mockFn = jest.fn().mockImplementation((): Promise<string> => {
      return Promise.resolve(mockData);
    });

    // Get the effect callback
    useAsync(mockFn as AsyncFunction<unknown>);

    // Execute the stored effect function safely
    let _cleanupFn;
    if (storedEffectFn) {
      _cleanupFn = storedEffectFn();
    }

    // Wait for promises to resolve
    await Promise.resolve();

    // Check loading state updates
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);

    // Check error state is reset
    expect(mockSetError).toHaveBeenCalledWith(undefined);

    // Check data state is updated with resolved value
    expect(mockSetData).toHaveBeenCalledWith(mockData);
  });

  it("should handle errors correctly", async () => {
    const mockError = new Error("test-error");
    const mockFn = jest.fn().mockImplementation((): Promise<never> => {
      return Promise.reject(mockError);
    });

    // Get the effect callback
    useAsync(mockFn as AsyncFunction<unknown>);

    // Execute the stored effect function safely
    let _cleanupFn;
    if (storedEffectFn) {
      _cleanupFn = storedEffectFn();
    }

    // Wait for promises to resolve
    await Promise.resolve();

    // Check loading state updates
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);

    // Check error state is updated with the error
    expect(mockSetError).toHaveBeenCalledWith(mockError);

    // Check data state is not updated
    expect(mockSetData).not.toHaveBeenCalled();
  });

  it("should respect the dependency array", () => {
    const mockFn = jest.fn().mockImplementation((): Promise<string> => {
      return Promise.resolve("test-data");
    });
    const deps = [1, 2, 3];

    useAsync(mockFn as AsyncFunction<unknown>, deps);

    // Check if the effect function is called with the correct dependencies
    expect(mockUseEffect.mock.calls[0][1]).toEqual(deps);
  });

  it("should handle unmounting (cleanup function)", async () => {
    // Reset mock implementations to ensure clean state
    jest.clearAllMocks();

    const mockFn = jest.fn().mockImplementation((): Promise<string> => {
      // This creates a promise that won't resolve until after the cleanup
      return new Promise((resolve) => {
        setTimeout(() => resolve("test-data"), 100);
      });
    });

    // Re-setup the state hooks for this specific test
    // Use explicit type assertions to avoid type errors
    (mockUseState as jest.Mock)
      .mockImplementationOnce(() => [false as any, mockSetLoading])
      .mockImplementationOnce(() => [undefined as any, mockSetError])
      .mockImplementationOnce(() => [undefined as any, mockSetData]);

    // Call the hook
    useAsync(mockFn as AsyncFunction<unknown>);

    // Execute the stored effect function safely to get the cleanup function
    let cleanupFn;
    if (storedEffectFn) {
      cleanupFn = storedEffectFn();
    }

    // At this point, setLoading(true) should have been called once
    expect(mockSetLoading).toHaveBeenCalledTimes(1);
    expect(mockSetLoading).toHaveBeenCalledWith(true);

    // Execute the cleanup function if it exists, simulating component unmount
    if (cleanupFn && typeof cleanupFn === "function") {
      cleanupFn();
    }

    // Wait for the async operation to complete, but it shouldn't affect state
    // as we've already "unmounted"
    await new Promise((resolve) => setTimeout(resolve, 200));

    // After unmounting, state setters should not be called more than once
    // (only the initial loading=true should have happened)
    expect(mockSetLoading).toHaveBeenCalledTimes(1);
    expect(mockSetData).not.toHaveBeenCalled();
  });
});
