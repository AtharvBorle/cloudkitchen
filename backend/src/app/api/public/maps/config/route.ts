import { getMapsConfig } from "@/controllers/mapsController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
    try {
        const config = await getMapsConfig();
        const response = successResponse(config, "Google Maps configuration status");
        response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        return response;
    } catch (err: any) {
        console.error("Error retrieving maps config:", err);
        return errorResponse(err?.message || "Failed to retrieve maps config", 500);
    }
}
