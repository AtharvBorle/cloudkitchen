import { NextRequest } from "next/server";
import { geocodeAddress } from "@/controllers/mapsController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get("address") || searchParams.get("q") || "";

        if (!address.trim()) {
            return errorResponse("Missing required parameter: address", 400);
        }

        const result = await geocodeAddress(address);
        const response = successResponse(result, "Address geocoded successfully");
        response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        return response;
    } catch (err: any) {
        console.error("Error geocoding address:", err);
        return errorResponse(err?.message || "Failed to geocode address", 500);
    }
}
