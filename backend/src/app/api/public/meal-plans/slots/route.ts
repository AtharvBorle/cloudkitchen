import { getMealSlotsConfig } from "@/controllers/sellerMealPlanController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: Request) {
  try {
    const data = await getMealSlotsConfig(req);
    return successResponse(data, "Predefined meal slots fetched successfully", 200);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch meal slots", 500);
  }
}
