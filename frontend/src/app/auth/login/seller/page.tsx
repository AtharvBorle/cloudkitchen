import { redirect } from 'next/navigation';

export default async function LegacySellerLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  const resolved = searchParams ? await Promise.resolve(searchParams) : {};
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(resolved)) {
    if (typeof val === "string") {
      query.set(key, val);
    } else if (Array.isArray(val)) {
      val.forEach((v) => query.append(key, v));
    }
  }
  const q = query.toString();
  redirect(q ? `/seller/login?${q}` : '/seller/login');
}
