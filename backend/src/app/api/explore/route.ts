import { getPublicExploreData } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getCorsHeaders } from "@/lib/cors";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(req),
    });
}

export async function GET(req: Request) {
    try {
        const data = await getPublicExploreData();
        return successResponse(data, "Explore data fetched successfully", 200, req);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch explore data", 500, req);
    }
}
