"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/fetch-api";

export interface SellerProfileData {
  ownerName: string;
  businessName: string;
  userFullName: string;
  email: string;
  phone: string;
  city: string;
  pincode: string;
  address: string;
  avatarInitials: string;
  partnerRole: string;
  isOnline: boolean;
  isLoading: boolean;
  user: any;
  profile: any;
}

let cachedProfile: Partial<SellerProfileData> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function computeInitials(name?: string): string {
  if (!name || !name.trim()) return "KP";
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "KP";
}

export function useSellerProfile() {
  const { data: session, status } = useSession();
  const sessionName = session?.user?.name || "";
  const sessionEmail = session?.user?.email || "";

  const [profileState, setProfileState] = useState<SellerProfileData>(() => {
    const name = cachedProfile?.ownerName || sessionName || "";
    return {
      ownerName: name,
      businessName: cachedProfile?.businessName || name,
      userFullName: cachedProfile?.userFullName || sessionName || name,
      email: cachedProfile?.email || sessionEmail || "",
      phone: cachedProfile?.phone || "",
      city: cachedProfile?.city || "",
      pincode: cachedProfile?.pincode || "",
      address: cachedProfile?.address || "",
      avatarInitials: cachedProfile?.avatarInitials || computeInitials(name),
      partnerRole: cachedProfile?.partnerRole || "Neo Cloud Partner",
      isOnline: cachedProfile?.isOnline ?? true,
      isLoading: !cachedProfile,
      user: cachedProfile?.user || null,
      profile: cachedProfile?.profile || null,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    const isPublicSellerPath =
      pathname === "/seller/login" ||
      pathname === "/seller/res/login" ||
      pathname === "/auth/login/seller" ||
      pathname.startsWith("/seller/registration") ||
      pathname.startsWith("/seller/account-information") ||
      pathname.startsWith("/seller/business-information") ||
      pathname.startsWith("/seller/confirm-information") ||
      pathname.startsWith("/seller/confirm-registration") ||
      pathname.startsWith("/seller/legal-documents") ||
      pathname.startsWith("/seller/legal-information") ||
      pathname.startsWith("/seller/media-gallery") ||
      pathname.startsWith("/seller/media-information") ||
      pathname.startsWith("/seller/verification") ||
      pathname.startsWith("/seller/faq") ||
      pathname.startsWith("/seller/res/faq") ||
      pathname.startsWith("/seller/tc") ||
      pathname.startsWith("/seller/res/tc");

    const isSellerRoute =
      pathname === "/seller" ||
      pathname.startsWith("/seller/") ||
      pathname === "/dashboard/seller" ||
      pathname.startsWith("/dashboard/seller/");

    if (isSellerRoute && !isPublicSellerPath && status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(pathname + window.location.search);
      window.location.href = `/seller/login?callbackUrl=${callbackUrl}`;
    }
  }, [status]);

  useEffect(() => {
    const handleUpdate = () => {
      if (cachedProfile) {
        setProfileState((prev) => ({
          ...prev,
          ...cachedProfile,
          isLoading: false,
        }));
      }
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        const res = await fetchApi("/api/seller/profile");
        if (res.ok) {
          const json = await res.json();
          const user = json.data?.user || json.user;
          const profile = json.data?.profile || json.profile;

          const rawOwnerName = profile?.businessName || user?.name || sessionName || "";
          const rawBusinessName = profile?.businessName || user?.name || "Cloud Kitchen";
          const rawFullName = user?.name || sessionName || rawOwnerName;
          const rawEmail = user?.email || sessionEmail || "";
          const rawPhone = user?.phone || "";
          const rawCity = user?.city || "";
          const rawPincode = user?.pincode || "";
          const rawAddress =
            profile?.addressLocality ||
            `${profile?.addressFlat ? profile.addressFlat + ", " : ""}${profile?.addressLocality || ""}` ||
            user?.city ||
            "";
          const rawInitials = computeInitials(rawOwnerName);
          const rawOnline = typeof profile?.isOnline === "boolean" ? profile.isOnline : true;

          cachedProfile = {
            ownerName: rawOwnerName,
            businessName: rawBusinessName,
            userFullName: rawFullName,
            email: rawEmail,
            phone: rawPhone,
            city: rawCity,
            pincode: rawPincode,
            address: rawAddress,
            avatarInitials: rawInitials,
            partnerRole: "Neo Cloud Partner",
            isOnline: rawOnline,
            user,
            profile,
          };

          notifyListeners();

          if (isMounted) {
            setProfileState({
              ownerName: rawOwnerName,
              businessName: rawBusinessName,
              userFullName: rawFullName,
              email: rawEmail,
              phone: rawPhone,
              city: rawCity,
              pincode: rawPincode,
              address: rawAddress,
              avatarInitials: rawInitials,
              partnerRole: "Neo Cloud Partner",
              isOnline: rawOnline,
              isLoading: false,
              user,
              profile,
            });
          }
        } else if (res.status === 401) {
          if (typeof window !== "undefined") {
            const pathname = window.location.pathname;
            const isPublicSellerPath =
              pathname === "/seller/login" ||
              pathname === "/seller/res/login" ||
              pathname === "/auth/login/seller" ||
              pathname.startsWith("/seller/registration") ||
              pathname.startsWith("/seller/faq") ||
              pathname.startsWith("/seller/tc");

            if (!isPublicSellerPath && (pathname.startsWith("/seller") || pathname.startsWith("/dashboard/seller"))) {
              const callbackUrl = encodeURIComponent(pathname + window.location.search);
              window.location.href = `/seller/login?callbackUrl=${callbackUrl}`;
            }
          }
        }
      } catch (e) {
        console.error("useSellerProfile fetch error:", e);
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [sessionName, sessionEmail]);

  return profileState;
}
