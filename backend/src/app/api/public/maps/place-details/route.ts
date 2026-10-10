import { NextRequest } from "next/server";
import { getPlaceDetails } from "@/controllers/mapsController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const placeId = searchParams.get("placeId") || searchParams.get("place_id") || "";
        const sessionToken = searchParams.get("sessionToken") || searchParams.get("session_token") || undefined;

        if (!placeId) {
            return errorResponse("Missing required parameter: placeId", 400);
        }

        const result = await getPlaceDetails(placeId, sessionToken);
        const response = successResponse(result, "Place details fetched successfully");
        response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        return response;
    } catch (err: any) {
        console.error("Error fetching place details:", err);
        return errorResponse(err?.message || "Failed to fetch place details", 500);
    }
}
