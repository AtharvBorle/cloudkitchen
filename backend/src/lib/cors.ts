import { NextRequest } from "next/server";

/**
 * Returns CORS headers allowing any requesting origin and port.
 * When an Origin header is sent by the browser/client (e.g., http://localhost:8081, http://localhost:19006),
 * it reflects that exact origin and allows credentials so any dynamic mobile/dev port is permitted.
 * When no Origin header is sent (native curl, mobile native HTTP), it defaults to "*".
 */
export function getCorsHeaders(req?: Request | NextRequest | null): Record<string, string> {
  let origin: string | null = null;
  if (req) {
    try {
      origin = req.headers.get("origin");
    } catch {}
  }

  const allowOrigin = origin && origin.trim() !== "null" ? origin.trim() : "*";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie, X-Requested-With, Accept, Origin, Cache-Control, Pragma, X-CSRF-Token, X-Api-Version",
    "Access-Control-Expose-Headers": "*",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };

  // W3C CORS spec requires Access-Control-Allow-Credentials only when Origin is not wildcard '*'
  if (allowOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}
