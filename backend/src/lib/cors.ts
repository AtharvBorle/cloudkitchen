import { NextRequest } from "next/server";

/**
 * Returns bulletproof CORS headers allowing any requesting origin, port, and client headers.
 * When an Origin header is sent by the browser/client (e.g. Flutter web, mobile webview, http://localhost:8081),
 * it reflects that exact origin and allows credentials so any dynamic mobile/dev port is permitted.
 * When no Origin header is sent (native curl, mobile native HTTP), it defaults to "*".
 */
export function getCorsHeaders(req?: Request | NextRequest | null): Record<string, string> {
  let origin: string | null = null;
  let requestedHeaders: string | null = null;
  if (req) {
    try {
      origin = req.headers.get("origin");
      requestedHeaders = req.headers.get("access-control-request-headers");
    } catch {}
  }

  const allowOrigin = origin && origin.trim() !== "null" && origin.trim() !== "" ? origin.trim() : "*";

  const defaultHeaders = [
    "Content-Type",
    "Authorization",
    "Cookie",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "Pragma",
    "X-CSRF-Token",
    "X-Api-Version",
    "Range",
    "Baggage",
    "Sentry-Trace",
    "sec-ch-ua",
    "sec-ch-ua-mobile",
    "sec-ch-ua-platform",
    "User-Agent",
  ];

  let allowedHeaders = defaultHeaders.join(", ");
  if (requestedHeaders) {
    allowedHeaders = `${allowedHeaders}, ${requestedHeaders}`;
  }
  allowedHeaders = `${allowedHeaders}, *`;

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": allowedHeaders,
    "Access-Control-Expose-Headers": "*",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin, Access-Control-Request-Headers",
  };

  // W3C CORS spec requires Access-Control-Allow-Credentials only when Origin is not wildcard '*'
  if (allowOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}
