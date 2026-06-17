import PublicShopClient from "./client-page";
import { LocationProvider } from "@/components/location-provider";

export const dynamic = "force-dynamic";

export default async function PublicShopPage({ params }: { params: Promise<{ trackingId: string }> }) {
    const { trackingId } = await params;
    return (
        <LocationProvider>
            <PublicShopClient trackingId={trackingId} />
        </LocationProvider>
    );
}
