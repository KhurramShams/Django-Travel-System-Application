import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names and resolves conflicting Tailwind utility classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Extracts a human-readable error message string from any API response or error object.
 * Handles Django standardized envelopes { success: false, error: { message, ... } },
 * DRF error dicts { detail: "..." }, and field error arrays.
 */
export function getErrorMessage(err: unknown, fallback = "An unexpected error occurred."): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  if (typeof err === "object") {
    const errorObj = err as Record<string, any>;
    const resData = errorObj.response?.data || errorObj.data;

    if (typeof resData === "string") return resData;

    if (resData && typeof resData === "object") {
      // 1. Django standardized error envelope: resData.error = { message, status_code, ... }
      if (resData.error) {
        if (typeof resData.error === "string") return resData.error;
        if (typeof resData.error.message === "string") return resData.error.message;
        if (typeof resData.error.detail === "string") return resData.error.detail;
      }

      // 2. Direct DRF structure
      if (typeof resData.message === "string") return resData.message;
      if (typeof resData.detail === "string") return resData.detail;

      // 3. Field errors dict: e.g. { pnr_number: ["Must be uppercase."] }
      for (const key of Object.keys(resData)) {
        if (key === "error" || key === "success" || key === "status_code" || key === "code") continue;
        const val = resData[key];
        if (Array.isArray(val) && val.length > 0) {
          return `${key}: ${val[0]}`;
        }
        if (typeof val === "string") {
          return `${key}: ${val}`;
        }
      }
    }

    if (typeof errorObj.message === "string") return errorObj.message;
  }

  return fallback;
}

