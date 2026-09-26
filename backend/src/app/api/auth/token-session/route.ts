import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { encode } from "@auth/core/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";

const getCookieName = (isSecure: boolean) => {
    return isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
};

async function handleTokenSession(token: string | null | undefined, req: NextRequest) {
    if (!token || typeof token !== "string" || token.trim() === "") {
        return errorResponse("Authentication token is required", 400);
    }

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "super_secret_for_local_testing_dev_only";

    let decoded: any = null;
    try {
        decoded = jwt.verify(token.trim(), secret) as any;
    } catch (jwtErr: any) {
        // Also try fallback dev secret if different
        try {
            decoded = jwt.verify(token.trim(), "fallback_secret_for_development_only") as any;
        } catch {
            return errorResponse("Invalid or expired authentication token", 401);
        }
    }

    if (!decoded || !decoded.id) {
        return errorResponse("Invalid token payload", 401);
    }

    // Verify user exists in DB
    const user = await db.user.findUnique({
        where: { id: decoded.id },
        include: { sellerProfile: true }
    });

    if (!user) {
        return errorResponse("User account not found", 404);
    }

    const isSecure = process.env.NODE_ENV === "production";
    const cookieName = getCookieName(isSecure);

    // Create NextAuth v5 JWE session token
    let sessionToken: string;
    try {
        sessionToken = await encode({
            token: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            secret,
            salt: cookieName,
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });
    } catch (encodeErr: any) {
        console.error("Failed to encode NextAuth session token:", encodeErr);
        sessionToken = "";
    }

    const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const response = NextResponse.json({
        success: true,
        message: "Session authenticated successfully",
        data: {
            user: safeUser,
            sellerProfile: user.sellerProfile ? {
                id: user.sellerProfile.id,
                trackingId: user.sellerProfile.trackingId,
                businessName: user.sellerProfile.businessName,
                businessCategory: user.sellerProfile.businessCategory,
                verificationStatus: user.sellerProfile.verificationStatus,
                foodVerificationStatus: user.sellerProfile.foodVerificationStatus,
                propertyVerificationStatus: user.sellerProfile.propertyVerificationStatus,
            } : null,
        }
    });

    if (sessionToken) {
        // Set standard session cookie
        response.cookies.set(cookieName, sessionToken, {
            httpOnly: true,
            sameSite: isSecure ? "none" : "lax",
            path: "/",
            secure: isSecure,
            maxAge: 30 * 24 * 60 * 60,
        });

        // Also set non-secure cookie name in non-production for local flexibility
        if (!isSecure) {
            response.cookies.set("next-auth.session-token", sessionToken, {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: false,
                maxAge: 30 * 24 * 60 * 60,
            });
        }
    }

    return response;
}

export async function POST(req: NextRequest) {
    try {
        let token: string | null = null;

        // 1. Check Authorization header
        const authHeader = req.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        // 2. Check JSON body
        if (!token) {
            try {
                const body = await req.json();
                token = body.token || body.authToken;
            } catch {
                // No JSON body
            }
        }

        // 3. Check query param
        if (!token) {
            token = req.nextUrl.searchParams.get("token");
        }

        return await handleTokenSession(token, req);
    } catch (error: any) {
        console.error("Token session error:", error);
        return errorResponse("Internal server error during session initialization", 500);
    }
}

export async function GET(req: NextRequest) {
    try {
        let token = req.nextUrl.searchParams.get("token");

        if (!token) {
            const authHeader = req.headers.get("authorization");
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        return await handleTokenSession(token, req);
    } catch (error: any) {
        console.error("Token session GET error:", error);
        return errorResponse("Internal server error during session verification", 500);
    }
}
