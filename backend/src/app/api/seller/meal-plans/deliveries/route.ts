import { getMealSubscriptionDeliveries } from "@/controllers/sellerMealPlanController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: Request) {
  try {
    const data = await getMealSubscriptionDeliveries(req);
    return successResponse(data, "Meal subscription deliveries fetched successfully", 200);
  } catch (error: any) {
    if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
    console.error("Error in GET /api/seller/meal-plans/deliveries:", error);
    return errorResponse("Unable to load meal subscription deliveries. Please try again later.", 500);
  }
}
