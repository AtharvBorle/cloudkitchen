import { getUserProfile, updateUserProfile } from "@/controllers/userController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getUserProfile();
        return successResponse(data, "Profile fetched successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while fetching profile", 500);
    }
}

export async function PUT(req: Request) {
    try {
        const data = await updateUserProfile(req);
        return successResponse(data, "Profile updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while updating profile", 500);
    }
}
