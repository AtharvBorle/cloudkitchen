import { getPublicCoupons } from "@/controllers/publicController";
import { successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sellerId = searchParams.get("sellerId");
        const userId = searchParams.get("userId");

        const data = await getPublicCoupons(sellerId, userId);
        const response = successResponse(data || []);
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
        return response;
    } catch (error: any) {
        console.error("Error fetching public coupons:", error);
        const response = successResponse([]);
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
        return response;
    }
}
