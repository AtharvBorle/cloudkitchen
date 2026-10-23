import { NextRequest } from "next/server";

/**
 * ==============================================================================
 * 🛡️ Neo Cloud Bites - Secure CORS Configuration
 * ==============================================================================
 * Enforces explicit trusted origin validation to prevent cross-origin data theft
 * and unauthorized credentialed access from malicious third-party origins.
 */

const STATIC_ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5000",
  "http://localhost:8081",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5000",
  "https://dev.neocloudbites.com",
  "https://dev.api.neocloudbites.com",
  "https://neocloudbites.com",
  "https://www.neocloudbites.com",
  "https://api.neocloudbites.com",
  "https://cloudkitchen-rose.vercel.app",
]);

function getDynamicAllowedOrigins(): Set<string> {
  const dynamic = new Set<string>();

  const envVars = [
    process.env.FRONTEND_URL,
    process.env.TRACKING_DOMAIN,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
  ];

  for (const val of envVars) {
    if (val && typeof val === "string") {
      try {
        const trimmed = val.trim();
        const origin = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`).origin;
        dynamic.add(origin);
      } catch {
        // Ignore invalid URL formatting
      }
    }
  }

  if (process.env.CORS_ALLOWED_ORIGINS) {
    const customList = process.env.CORS_ALLOWED_ORIGINS.split(",");
    for (const item of customList) {
      const trimmed = item.trim();
      if (trimmed) {
        try {
          const origin = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`).origin;
          dynamic.add(origin);
        } catch {
          // Ignore invalid URL formatting
        }
      }
    }
  }

  return dynamic;
}

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  const clean = origin.trim();

  if (STATIC_ALLOWED_ORIGINS.has(clean)) return true;

  const dynamic = getDynamicAllowedOrigins();
  if (dynamic.has(clean)) return true;

  try {
    const url = new URL(clean);
    // Allow HTTPS subdomains of neocloudbites.com
    if (url.protocol === "https:" && (url.hostname === "neocloudbites.com" || url.hostname.endsWith(".neocloudbites.com"))) {
      return true;
    }

    // In local development, permit local LAN network IP origins for mobile device testing
    if (process.env.NODE_ENV !== "production") {
      if (
        /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(clean)
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export function getCorsHeaders(req?: Request | NextRequest | null): Record<string, string> {
  let origin: string | null = null;
  let requestedHeaders: string | null = null;

  if (req) {
    try {
      origin = req.headers.get("origin");
      requestedHeaders = req.headers.get("access-control-request-headers");
    } catch {
      // Header extraction error fallback
    }
  }

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
  ];

  let allowedHeaders = defaultHeaders.join(", ");
  if (requestedHeaders) {
    allowedHeaders = `${allowedHeaders}, ${requestedHeaders}`;
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": allowedHeaders,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin, Access-Control-Request-Headers",
  };

  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  } else if (!origin) {
    // Non-browser or direct server-to-server request
    headers["Access-Control-Allow-Origin"] = "*";
  } else {
    // Untrusted origin: explicitly do not set Allow-Credentials or reflected Allow-Origin
    headers["Access-Control-Allow-Origin"] = "null";
  }

  return headers;
}
