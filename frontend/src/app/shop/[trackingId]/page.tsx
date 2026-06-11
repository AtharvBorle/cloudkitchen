import PublicShopClient from "./client-page";

export async function generateStaticParams() {
    return [{ trackingId: "demo" }];
}

export default async function PublicShopPage({ params }: { params: Promise<{ trackingId: string }> }) {
    const { trackingId } = await params;
    return <PublicShopClient trackingId={trackingId} />;
}
