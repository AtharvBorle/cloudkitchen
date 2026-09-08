import RestaurantClient from "./[id]/RestaurantClient";

export const dynamic = "force-dynamic";

export default async function RestaurantPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; kitchen?: string }>;
}) {
  const params = await searchParams;
  const kitchenId = params?.id || params?.kitchen || "7-12-kitchen";
  return <RestaurantClient kitchenId={kitchenId} />;
}
