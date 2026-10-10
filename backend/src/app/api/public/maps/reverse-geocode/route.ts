import { NextRequest } from "next/server";
import { reverseGeocode } from "@/controllers/mapsController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const latParam = searchParams.get("lat") || searchParams.get("latitude");
        const lngParam = searchParams.get("lng") || searchParams.get("lon") || searchParams.get("longitude");

        if (!latParam || !lngParam) {
            return errorResponse("Missing required parameters: lat and lng", 400);
        }

        const lat = parseFloat(latParam);
        const lng = parseFloat(lngParam);

        if (isNaN(lat) || isNaN(lng)) {
            return errorResponse("Invalid coordinates provided", 400);
        }

        const result = await reverseGeocode(lat, lng);
        const response = successResponse(result, "Address reverse geocoded successfully");
        response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
        return response;
    } catch (err: any) {
        console.error("Error reverse geocoding:", err);
        return errorResponse(err?.message || "Failed to reverse geocode coordinates", 500);
    }
}
