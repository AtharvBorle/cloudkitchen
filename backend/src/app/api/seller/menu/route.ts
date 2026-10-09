import { getMenuItems, createMenuItem } from "@/controllers/sellerMenuController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        const data = await getMenuItems();
        const response = successResponse(data);
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        return response;
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createMenuItem(req);
        return successResponse(data, "Food item created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error creating food item:", error);
        return errorResponse("An error occurred", 500);
    }
}
