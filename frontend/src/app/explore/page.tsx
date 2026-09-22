import { redirect } from 'next/navigation';

export default async function ExploreRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const params = new URLSearchParams();

  if (resolvedParams) {
    Object.entries(resolvedParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        params.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      }
    });
  }

  const query = params.toString();
  redirect(query ? `/explore-desktop?${query}` : '/explore-desktop');
}
