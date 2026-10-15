import { getPublicMealPlans } from "@/controllers/sellerMealPlanController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204 });
}

export async function GET(req: Request) {
    try {
        const data = await getPublicMealPlans(req);
        return successResponse(data, "Meal plans fetched successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to fetch meal plans", 500);
    }
}
