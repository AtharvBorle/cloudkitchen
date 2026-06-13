import PublicShopClient from "./client-page";

export const dynamic = "force-dynamic";

export default async function PublicShopPage({ params }: { params: Promise<{ trackingId: string }> }) {
    const { trackingId } = await params;
    return <PublicShopClient trackingId={trackingId} />;
}
