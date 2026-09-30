"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import AdminCouponsClient from "@/app/dashboard/superadmin/coupons/client-page";

export default function AdminCouponsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;

        if (session?.user?.role === "SUPERADMIN") {
            router.replace("/dashboard/superadmin/coupons");
        } else {
            router.replace("/dashboard/admin");
        }
    }, [session, status, router]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            Redirecting...
        </div>
    );
}
