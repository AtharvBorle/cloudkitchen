import RestaurantClient from "../../[id]/RestaurantClient";

export const dynamic = "force-dynamic";

export default async function KitchenSubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RestaurantClient kitchenId={id} />;
}
