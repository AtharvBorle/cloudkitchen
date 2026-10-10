import { NextRequest } from "next/server";
import { getPlacesAutocomplete } from "@/controllers/mapsController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const input = searchParams.get("input") || searchParams.get("q") || "";
        const sessionToken = searchParams.get("sessionToken") || searchParams.get("session_token") || undefined;
        const latParam = searchParams.get("lat");
        const lngParam = searchParams.get("lng");
        const radiusParam = searchParams.get("radius");

        const lat = latParam ? parseFloat(latParam) : undefined;
        const lng = lngParam ? parseFloat(lngParam) : undefined;
        const radius = radiusParam ? parseInt(radiusParam, 10) : undefined;

        if (!input.trim()) {
            return successResponse({ suggestions: [], provider: "empty" }, "No search query provided");
        }

        const result = await getPlacesAutocomplete(input, sessionToken, lat, lng, radius);
        const response = successResponse(result, "Places suggestions fetched successfully");
        response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
        return response;
    } catch (err: any) {
        console.error("Error fetching places autocomplete:", err);
        return errorResponse(err?.message || "Failed to fetch places autocomplete", 500);
    }
}
