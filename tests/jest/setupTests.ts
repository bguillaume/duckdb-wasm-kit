/**
 * Jest setup file for duckdb-wasm-kit tests
 */
import { jest } from "@jest/globals";

// Set up browser-like globals
class MockWorker {
  onmessage: ((ev: MessageEvent) => any) | null = null;
  onmessageerror: ((ev: MessageEvent) => any) | null = null;
  onerror: ((ev: ErrorEvent) => any) | null = null;

  constructor(_stringUrl: string) {
    // Mock implementation
  }

  postMessage(_message: any, _transfer?: Transferable[]): void {
    // Mock implementation
  }

  terminate(): void {
    // Mock implementation
  }

  addEventListener(
    _type: string,
    _listener: EventListenerOrEventListenerObject,
    _options?: boolean | AddEventListenerOptions,
  ): void {
    // Mock implementation
  }

  removeEventListener(
    _type: string,
    _listener: EventListenerOrEventListenerObject,
    _options?: boolean | EventListenerOptions,
  ): void {
    // Mock implementation
  }

  dispatchEvent(_event: Event): boolean {
    return true;
  }
}

// Add Worker to global scope
global.Worker = MockWorker as any;

// Mock URL API
global.URL = {
  createObjectURL: jest.fn().mockReturnValue("blob-url"),
  revokeObjectURL: jest.fn(),
} as any;

// Mock performance API
global.performance = {
  now: jest.fn().mockReturnValue(1000),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn().mockReturnValue([]),
} as any;

// Mock TextEncoder/TextDecoder
class MockTextEncoder {
  encode(_input?: string): Uint8Array {
    return new Uint8Array(0);
  }
}

class MockTextDecoder {
  decode(_input?: BufferSource): string {
    return "";
  }
}

global.TextEncoder = MockTextEncoder as any;
global.TextDecoder = MockTextDecoder as any;

// Create a properly typed fetch mock function
const mockFetch = function (
  _input: RequestInfo | URL,
  _init?: RequestInit,
): Promise<Response> {
  const response = {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
    redirected: false,
    type: "basic" as ResponseType,
    url: "https://example.com",
    body: null,
    bodyUsed: false,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    clone: function () {
      return this;
    },
  } as Response;

  return Promise.resolve(response);
};

// Replace global fetch with our typed mock
global.fetch = mockFetch as typeof global.fetch;

// Configure Jest timeouts
jest.setTimeout(30000); // Increase timeout for async tests

import "@testing-library/jest-dom";
