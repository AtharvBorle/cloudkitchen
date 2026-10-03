import { redirect } from "next/navigation";

export default async function ForgetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === "string") {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    }
  });

  const queryString = query.toString();
  redirect(queryString ? `/auth/forgot-password?${queryString}` : "/auth/forgot-password");
}
