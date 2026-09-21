import { requestSellerRevision, getSellerRevisionDetails } from "@/controllers/sellerRevisionController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const details = await getSellerRevisionDetails();
        return successResponse(details, "Seller application reapply/revision details retrieved successfully.");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Get reapply details error:", error);
        return errorResponse("An error occurred while fetching reapplication details", 500);
    }
}

export async function POST(req: Request) {
    try {
        const updatedProfile = await requestSellerRevision(req);
        return successResponse(updatedProfile, "Seller application re-submitted successfully! Your application is now under review.");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Reapply submit error:", error);
        return errorResponse("An error occurred while re-submitting application", 500);
    }
}
