/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

// /// <reference types="node" />
/// <reference types="jest" />
/**
 * Jest Setup File
 * - Sets global variables to ensure proper testing environment (e.g. IS_REACT_ACT_ENVIRONMENT).
 * - Mocks Worker, provides polyfills for TextDecoder/TextEncoder, Blob.text, and URL.createObjectURL.
 * - Patches ReactDOM for rendering and updates ReactDOMTestUtils.act.
 */

// Import non-require dependencies first
import * as ReactDOMModule from "react-dom";
import { createRoot } from "react-dom/client";
import { act } from "react";
import * as ReactDOMTestUtils from "react-dom/test-utils";

// Set up environment
process.env.IS_REACT_ACT_ENVIRONMENT = "true";

// Add this near the top if fetch is undefined:
if (typeof global.fetch === "undefined") {
  global.fetch = require("node-fetch");
}

// Add a custom Worker mock that simulates immediate instantiation response
if (typeof global.Worker === "undefined" || !global.Worker.prototype.postMessage) {
  class MockWorker {
    onmessage: ((event: Record<string, unknown>) => void) | null = null;
    constructor(scriptUrl: string) {
      console.log("MockWorker constructed with scriptUrl:", scriptUrl);
      // Simulate a successful instantiation shortly.
      setTimeout(() => {
        if (this.onmessage) {
          // Send a dummy message indicating the module has been instantiated.
          this.onmessage({ data: { type: "ready" } });
        }
      }, 10);
    }
    postMessage(_msg: unknown): void {}
    terminate(): void {}
    addEventListener(_event: string, _cb: Function): void {}
    removeEventListener(_event: string, _cb: Function): void {}
  }
  global.Worker = MockWorker as any;
}

// Polyfill for TextDecoder and TextEncoder (needed by Apache Arrow and duckdb-wasm)
if (typeof global.TextDecoder === "undefined") {
  // Fix: Use a type assertion to properly handle the incompatible TextDecoder types
  const { TextDecoder } = require("util");
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}
if (typeof global.TextEncoder === "undefined") {
  // Fix: Use a type assertion to properly handle the incompatible TextEncoder types
  const { TextEncoder } = require("util");
  global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
}

// Polyfill for Blob.prototype.text if missing
if (!Blob.prototype.text) {
  Blob.prototype.text = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        // Ensure that reader.result is not null.
        resolve(reader.result != null ? reader.result.toString() : "");
      };
      reader.readAsText(this);
    });
  };
}

// Polyfill for URL.createObjectURL
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = function (_blob: Blob): string {
    // renamed parameter to _blob
    return "blob:dummy-url";
  };
}

// NEW: Polyfill for URL.revokeObjectURL if missing.
if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = () => {};
}

// --- Patch global.ReactDOM by merging original exports with our overrides ---
const ReactDOM: any = ReactDOMModule; // cast to any to allow modification

ReactDOM.render = (element: any, container: Element) => {
  const root = createRoot(container);
  root.render(element);
};

ReactDOM.unmountComponentAtNode = (container: Element) => {
  try {
    const root = createRoot(container);
    root.unmount();
  } catch {
    container.innerHTML = "";
  }
};

(global as any).ReactDOM = ReactDOM;
if (typeof window !== "undefined") {
  (window as any).ReactDOM = ReactDOM;
}

// Patch ReactDOMTestUtils.act -> React.act for proper support.
try {
  Object.defineProperty(ReactDOMTestUtils, "act", {
    value: act,
    configurable: true,
    writable: true,
  });
} catch {
  // Do nothing if act is already non-configurable.
}
