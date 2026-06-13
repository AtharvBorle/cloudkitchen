import { getPublicPopupBanners } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sellerId = searchParams.get('sellerId');

        const data = await getPublicPopupBanners(sellerId);
        const response = successResponse(data);
        response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
        return response;
    } catch (error) {
        console.error("Error fetching public popup banners:", error);
        return errorResponse("An error occurred", 500);
    }
}
