/**
 * Arrow Utilities for duckdb-wasm-kit
 *
 * This module provides helper functions to work with Apache Arrow tables:
 *  - Check if an object is a valid Arrow table.
 *  - Validate that a File is an Arrow IPC file.
 *  - Convert an ArrayBuffer (from an IPC file) to an Arrow table and vice versa.
 *  - Convert an Arrow table to JSON row objects.
 */
import { Table as Arrow } from "apache-arrow";
export type { Table as Arrow } from "apache-arrow";
import { JSONObject } from "../util/types.js";
export declare const ARROW_MIME_TYPE = "application/vnd.apache.arrow.file";
export declare const isArrow: (obj: unknown) => obj is Arrow;
export declare const isArrowFile: (file: File) => Promise<boolean>;
export declare const arrayBufferToArrow: (arrayBuffer: ArrayBuffer) => Arrow;
export declare const arrowToArrayBuffer: (arrow: Arrow) => ArrayBuffer;
export declare function arrowToJSON(arrow: Arrow): Record<string, JSONObject>[];
