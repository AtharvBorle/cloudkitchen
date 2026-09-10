import RestaurantClient from "@/app/restaurant/[id]/RestaurantClient";
import { LocationProvider } from "@/components/location-provider";

export const dynamic = "force-dynamic";

export default async function PublicShopPage({ params }: { params: Promise<{ trackingId: string }> }) {
    const { trackingId } = await params;
    return (
        <LocationProvider>
            <RestaurantClient kitchenId={trackingId} />
        </LocationProvider>
    );
}
