import { requestSellerRevision, getSellerRevisionDetails } from "@/controllers/sellerRevisionController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const details = await getSellerRevisionDetails();
        return successResponse(details, "Seller application revision details retrieved successfully.");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Get revision details error:", error);
        return errorResponse("An error occurred while fetching revision details", 500);
    }
}

export async function POST(req: Request) {
    try {
        const updatedProfile = await requestSellerRevision(req);
        return successResponse(updatedProfile, "Application and documents resubmitted successfully! Your application is now under review.");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Revision submit error:", error);
        return errorResponse("An error occurred while uploading documents", 500);
    }
}
