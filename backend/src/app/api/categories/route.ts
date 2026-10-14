import { getPublicCategories } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204 });
}

export async function GET() {
    try {
        const data = await getPublicCategories();
        return successResponse(data, "Categories fetched successfully", 200);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch categories", 500);
    }
}
