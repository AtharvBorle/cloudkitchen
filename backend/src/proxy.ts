import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
        // Retrieve origin from headers
        const origin = request.headers.get("origin");
        
        // List of allowed origins (e.g. S3 frontend domains)
        const allowedOrigins = [
            "http://localhost:3000",
            process.env.FRONTEND_URL
        ].filter((o): o is string => !!o);

        const isAllowedOrigin = origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development");

        // Handle preflight OPTIONS requests
        if (request.method === "OPTIONS") {
            const response = new NextResponse(null, { status: 204 });
            if (isAllowedOrigin && origin) {
                response.headers.set("Access-Control-Allow-Origin", origin);
                response.headers.set("Access-Control-Allow-Credentials", "true");
                response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
                response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            }
            return response;
        }

        const response = NextResponse.next();
        if (isAllowedOrigin && origin) {
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
