import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    // In production, Nginx handles all CORS headers.
    // In development, we set them here for local testing.
    if (request.nextUrl.pathname.startsWith("/api/") && process.env.NODE_ENV === "development") {
        const origin = request.headers.get("origin");
        if (request.method === "OPTIONS") {
            const response = new NextResponse(null, { status: 204 });
            if (origin) {
                response.headers.set("Access-Control-Allow-Origin", origin);
                response.headers.set("Access-Control-Allow-Credentials", "true");
                response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
                response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            }
            return response;
        }

        const response = NextResponse.next();
        if (origin) {
            response.headers.set("Access-Control-Allow-Origin", origin);
            response.headers.set("Access-Control-Allow-Credentials", "true");
            response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        }
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: "/api/:path*",
};
