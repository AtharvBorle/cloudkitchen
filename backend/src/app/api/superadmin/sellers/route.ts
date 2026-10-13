import { NextRequest } from "next/server";
import { getSuperadminSellers } from "@/controllers/superadminSellerController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const data = await getSuperadminSellers(req);
        return successResponse(data);
    } catch (error: any) {
        const statusCode = error?.statusCode || (error instanceof ApiError ? error.statusCode : 500);
        console.error("Error fetching sellers:", error);
        return errorResponse(error?.message || "An error occurred", statusCode);
    }
}
