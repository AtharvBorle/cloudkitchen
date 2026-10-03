"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperadminSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/superadmin");
  }, [router]);

  return (
    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
      Redirecting to Superadmin Dashboard...
    </div>
  );
}
