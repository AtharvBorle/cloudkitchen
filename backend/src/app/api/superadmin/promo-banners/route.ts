import { getSuperadminHomeBanners, createHomeBanner } from "@/controllers/homePromoBannerController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getSuperadminHomeBanners();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching superadmin promo banners:", error);
        return errorResponse("An error occurred", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createHomeBanner(req);
        return successResponse(data, "Banner created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error creating promo banner:", error);
        return errorResponse("An error occurred", 500);
    }
}
