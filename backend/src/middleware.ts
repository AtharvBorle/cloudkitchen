import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCorsHeaders } from "@/lib/cors";

export function middleware(request: NextRequest) {
    const corsHeaders = getCorsHeaders(request);

    // Preflight OPTIONS requests - return 204 immediately with full CORS headers
    if (request.method === "OPTIONS") {
        const response = new NextResponse(null, { status: 204 });
        for (const [key, val] of Object.entries(corsHeaders)) {
            response.headers.set(key, val);
        }
        return response;
    }

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

    if (rewrites[pathname]) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = rewrites[pathname];
        const response = NextResponse.rewrite(rewriteUrl);
        for (const [key, val] of Object.entries(corsHeaders)) {
            response.headers.set(key, val);
        }
        return response;
    }

    const response = NextResponse.next();
    for (const [key, val] of Object.entries(corsHeaders)) {
        response.headers.set(key, val);
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
