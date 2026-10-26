import { getSellerAddons, createSellerAddon } from "@/controllers/sellerAddonController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const data = await getSellerAddons(req);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller addons GET error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(req: Request) {
    try {
        const addon = await createSellerAddon(req);
        return successResponse(addon, "Add-on created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller addon POST error:", error);
        return errorResponse("Internal server error", 500);
    }
}
