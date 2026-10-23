import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCorsHeaders } from "@/lib/cors";

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Mobile client aliases & rewrites
    const rewrites: Record<string, string> = {
        "/explore": "/api/public/explore",
        "/api/explore": "/api/public/explore",
        "/promo-banners": "/api/public/promo-banners",
        "/api/promo-banners": "/api/public/promo-banners",
        "/categories": "/api/public/categories",
        "/api/categories": "/api/public/categories",
        "/meal-plans": "/api/public/meal-plans",
        "/api/meal-plans": "/api/public/meal-plans",
        "/search": "/api/public/search",
        "/api/search": "/api/public/search",
    };

    // When behind an Nginx reverse proxy on neocloudbites.com that already injects CORS headers,
    // setting them here in Next.js results in duplicate headers ("origin, origin") which browsers reject.
    // In local development or standalone deployments (mobile dev, LAN IP, emulators), Next.js provides the CORS headers.
    const isBehindNginx =
        process.env.NGINX_HANDLES_CORS === "true" ||
        ((Boolean(request.headers.get("host")?.includes("neocloudbites.com")) ||
          Boolean(request.headers.get("x-forwarded-host")?.includes("neocloudbites.com"))) &&
         (request.headers.has("x-real-ip") || request.headers.has("x-forwarded-for")));

    // Preflight OPTIONS requests - return 204 immediately
    if (request.method === "OPTIONS") {
        const response = new NextResponse(null, { status: 204 });
        if (!isBehindNginx) {
            const corsHeaders = getCorsHeaders(request);
            for (const [key, val] of Object.entries(corsHeaders)) {
                response.headers.set(key, val);
            }
        }
        return response;
    }

    if (rewrites[pathname]) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = rewrites[pathname];
        const response = NextResponse.rewrite(rewriteUrl);
        if (!isBehindNginx) {
            const corsHeaders = getCorsHeaders(request);
            for (const [key, val] of Object.entries(corsHeaders)) {
                response.headers.set(key, val);
            }
        }
        return response;
    }

    const response = NextResponse.next();
    if (!isBehindNginx) {
        const corsHeaders = getCorsHeaders(request);
        for (const [key, val] of Object.entries(corsHeaders)) {
            response.headers.set(key, val);
        }
    }
    return response;
}

export const config = {
    matcher: [
        "/api/:path*",
        "/explore",
        "/promo-banners",
        "/categories",
        "/meal-plans",
        "/search",
    ],
};
