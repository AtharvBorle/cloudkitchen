import { NextRequest } from "next/server";
import { getPublicExploreData } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").toLowerCase().trim();
        const pincode = (searchParams.get("pincode") || "").trim();
        const vegOnly = searchParams.get("vegOnly") === "true";
        const category = (searchParams.get("category") || "").toLowerCase().trim();
        const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : null;
        const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : null;
        const minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : null;

        const exploreData = await getPublicExploreData();
        let foodItems = exploreData.foodItems || [];
        let kitchens = exploreData.kitchens || [];

        // 1. Keyword search (dish name, description, category, seller name)
        if (q) {
            foodItems = foodItems.filter((item: any) =>
                item.name?.toLowerCase().includes(q) ||
                item.description?.toLowerCase().includes(q) ||
                item.foodCategory?.name?.toLowerCase().includes(q) ||
                item.category?.name?.toLowerCase().includes(q) ||
                item.sellerName?.toLowerCase().includes(q)
            );

            kitchens = kitchens.filter((k: any) =>
                k.name?.toLowerCase().includes(q) ||
                k.type?.toLowerCase().includes(q) ||
                k.locality?.toLowerCase().includes(q) ||
                k.city?.toLowerCase().includes(q)
            );
        }

        // 2. Pincode / Service area filter
        if (pincode) {
            foodItems = foodItems.filter((item: any) =>
                item.sellerPincode === pincode ||
                (Array.isArray(item.servedPincodes) && item.servedPincodes.includes(pincode))
            );

            kitchens = kitchens.filter((k: any) =>
                k.pincode === pincode ||
                (Array.isArray(k.servedPincodes) && k.servedPincodes.includes(pincode))
            );
        }

        // 3. Dietary filter
        if (vegOnly) {
            foodItems = foodItems.filter((item: any) => item.itemType === "VEG");
            kitchens = kitchens.filter((k: any) => k.foodType === "VEG" || k.foodType === "BOTH");
        }

        // 4. Category filter
        if (category && category !== "all" && category !== "food") {
            foodItems = foodItems.filter((item: any) =>
                item.foodCategory?.name?.toLowerCase().includes(category) ||
                item.category?.name?.toLowerCase().includes(category) ||
                item.name?.toLowerCase().includes(category)
            );
        }

        // 5. Price filter
        if (minPrice !== null && !isNaN(minPrice)) {
            foodItems = foodItems.filter((item: any) => item.price >= minPrice);
        }
        if (maxPrice !== null && !isNaN(maxPrice)) {
            foodItems = foodItems.filter((item: any) => item.price <= maxPrice);
        }

        // 6. Rating filter
        if (minRating !== null && !isNaN(minRating)) {
            foodItems = foodItems.filter((item: any) => (item.rating || 0) >= minRating);
            kitchens = kitchens.filter((k: any) => (k.rating || 0) >= minRating);
        }

        // Autocomplete suggestions (top unique dish names and kitchen names)
        const suggestions = Array.from(
            new Set([
                ...foodItems.slice(0, 5).map((f: any) => f.name),
                ...kitchens.slice(0, 3).map((k: any) => k.name),
            ])
        ).slice(0, 6);

        const response = successResponse({
            query: q,
            totalItems: foodItems.length,
            totalKitchens: kitchens.length,
            suggestions,
            foodItems,
            kitchens,
            categories: exploreData.foodCategories || []
        });

        response.headers.set("Cache-Control", "public, s-maxage=15, stale-while-revalidate=10");
        return response;
    } catch (error) {
        console.error("Error in public search route:", error);
        return errorResponse("Search failed", 500);
    }
}
