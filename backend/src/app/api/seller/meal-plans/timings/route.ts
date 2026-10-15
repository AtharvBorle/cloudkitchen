import { getMealSlotsConfig, updateMealSlotsConfig } from "@/controllers/sellerMealPlanController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: Request) {
  try {
    const data = await getMealSlotsConfig(req);
    return successResponse(data, "Meal subscription timings fetched successfully", 200);
  } catch (error: any) {
    if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
    return errorResponse(error.message || "Failed to fetch meal timings", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const data = await updateMealSlotsConfig(req);
    return successResponse(data, data.message, 200);
  } catch (error: any) {
    if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
    return errorResponse(error.message || "Failed to update meal timings", 500);
  }
}

export async function PATCH(req: Request) {
  return PUT(req);
}

export async function POST(req: Request) {
  return PUT(req);
}
