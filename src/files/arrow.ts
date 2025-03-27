/**
 * Arrow Utilities for duckdb-wasm-kit
 *
 * This module provides helper functions to work with Apache Arrow tables:
 *  - Check if an object is a valid Arrow table.
 *  - Validate that a File is an Arrow IPC file.
 *  - Convert an ArrayBuffer (from an IPC file) to an Arrow table and vice versa.
 *  - Convert an Arrow table to JSON row objects.
 */

import { Table as Arrow, tableFromIPC, tableToIPC } from "apache-arrow";
export type { Table as Arrow } from "apache-arrow";

import { JSONObject } from "../util/types.js";

export const ARROW_MIME_TYPE = "application/vnd.apache.arrow.file";

// Check if a given object is an instance of an Arrow table.
export const isArrow = (obj: unknown): obj is Arrow => obj instanceof Arrow;

// Determines if a given File is a valid Arrow IPC file.
export const isArrowFile = async (file: File): Promise<boolean> => {
  // If the file's MIME type matches, assume it's valid.
  if (file.type === ARROW_MIME_TYPE) {
    return true;
  }
  try {
    const buffer = await file.arrayBuffer();
    arrayBufferToArrow(buffer);
    return true;
  } catch {
    // Silently handle errors - if we can't parse it, it's not a valid Arrow file
  }

  return false;
};

// Converts an ArrayBuffer (representing an IPC file) to an Arrow table.
export const arrayBufferToArrow = (arrayBuffer: ArrayBuffer): Arrow => {
  const arrow = tableFromIPC(new Uint8Array(arrayBuffer));
  return arrow;
};

// Converts an Arrow table into an ArrayBuffer containing its IPC representation.
export const arrowToArrayBuffer = (arrow: Arrow): ArrayBuffer => {
  const array = tableToIPC(arrow, "file");
  return array.buffer;
};

// Converts an Arrow table to an array of JSON row objects.
export function arrowToJSON(arrow: Arrow): Record<string, JSONObject>[] {
  const rows: Record<string, JSONObject>[] = [];
  for (let i = 0; i < arrow.numRows; i++) {
    const row = arrow.get(i);
    if (row) {
      rows.push(row.toJSON());
    }
  }
  return rows;
}
