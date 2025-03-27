/**
 * Mocks for React hooks
 */
import type * as React from "react";
import { jest } from "@jest/globals";

// Define explicit types for our Jest mock functions with underscore prefix to avoid warnings
type _MockFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

// Mock state values and setters with proper types
type SetStateFn<T> = (value: T | ((prev: T) => T)) => void;
export const mockSetState = jest.fn() as jest.MockedFunction<SetStateFn<any>>;

// Type-safe useState mock
export const mockUseState = jest
  .fn()
  .mockImplementation(<T>(initialValue: T): [T, SetStateFn<T>] => {
    return [initialValue, mockSetState as SetStateFn<T>];
  }) as jest.MockedFunction<typeof React.useState>;

// Create a proper cleanup function type for useEffect
export type CleanupFn = void | (() => void);
export type EffectFn = () => CleanupFn;

// Store the effect function for direct access in tests
export let storedEffectFn: EffectFn | undefined;

// Mock useEffect to properly handle function return including cleanup and store dependencies
// Use a simpler type assertion approach to avoid TypeScript errors
export const mockUseEffect = jest.fn().mockImplementation(function (
  fn: unknown,
  _deps?: unknown,
) {
  // Store the function for direct access in tests
  storedEffectFn = fn as EffectFn;
  return undefined;
}) as jest.MockedFunction<typeof React.useEffect>;

// Mock useRef with proper typing
// Use a simpler type assertion approach to avoid TypeScript errors
export const mockUseRef = jest
  .fn()
  .mockImplementation(<T>(initialValue: T): { current: T } => {
    return { current: initialValue };
  }) as jest.MockedFunction<typeof React.useRef>;

// Mock useCallback with proper typing
// Use a simpler type assertion approach to avoid TypeScript errors
export const mockUseCallback = jest.fn().mockImplementation(function (
  fn: unknown,
  _deps?: unknown,
) {
  // Simply return the callback function, ignoring the deps
  return fn;
}) as jest.MockedFunction<typeof React.useCallback>;

// Mock useContext with proper typing
// Use a simpler type assertion approach to avoid TypeScript errors
export const mockUseContext = jest.fn() as jest.MockedFunction<typeof React.useContext>;

// Mock React
jest.mock("react", () => ({
  useState: (initialValue: any) => mockUseState(initialValue),
  useEffect: (fn: any, deps?: React.DependencyList) => mockUseEffect(fn, deps),
  useRef: (initialValue: any) => mockUseRef(initialValue),
  // Fix: Ensure deps is always a valid DependencyList
  useCallback: (fn: any, deps?: React.DependencyList) => mockUseCallback(fn, deps || []),
  useContext: (context: any) => mockUseContext(context),
}));
