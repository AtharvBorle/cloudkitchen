import RestaurantClient from "./RestaurantClient";

export const dynamic = "force-dynamic";

export default async function DynamicRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RestaurantClient kitchenId={id} />;
}
