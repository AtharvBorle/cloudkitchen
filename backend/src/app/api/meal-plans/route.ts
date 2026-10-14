import { getPublicMealPlans } from "@/controllers/sellerMealPlanController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
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
        const data = await getPublicMealPlans(req);
        return successResponse(data, "Meal plans fetched successfully", 200, req);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode, req);
        return errorResponse(error.message || "Failed to fetch meal plans", 500, req);
    }
}
