import { getSellerProfile, updateSellerProfile } from "@/controllers/sellerProfileController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getSellerProfile();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch profile error:", error);
        return errorResponse("An error occurred while fetching profile", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await updateSellerProfile(req);
        return successResponse(data, "Profile updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Update profile error:", error);
        return errorResponse("An error occurred while updating the profile", 500);
    }
}

export async function PUT(req: Request) {
    return POST(req);
}

export async function PATCH(req: Request) {
    return POST(req);
}
