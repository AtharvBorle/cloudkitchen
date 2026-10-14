import { getPublicCategories } from "@/controllers/publicController";
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
        const data = await getPublicCategories();
        return successResponse(data, "Categories fetched successfully", 200, req);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch categories", 500, req);
    }
}
