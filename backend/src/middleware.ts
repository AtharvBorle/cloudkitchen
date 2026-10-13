import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCorsHeaders } from "@/lib/cors";

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
        const corsHeaders = getCorsHeaders(request);

        // Preflight OPTIONS requests - return 204 immediately with full CORS headers
        if (request.method === "OPTIONS") {
            const response = new NextResponse(null, { status: 204 });
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

    return NextResponse.next();
}

export const config = {
    matcher: "/api/:path*",
};
