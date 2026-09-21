"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/fetch-api";

export interface SellerProfileData {
  id?: string;
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
  authStatus: "loading" | "authenticated" | "unauthenticated";
  user: any;
  profile: any;
}

let cachedProfile: Partial<SellerProfileData> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function isGenericFallbackName(name?: string): boolean {
  if (!name || !name.trim()) return true;
  const lower = name.trim().toLowerCase();
  return (
    lower === "john doe" ||
    lower === "rahul sharma" ||
    lower === "rahul" ||
    lower === "kitchen owner" ||
    lower === "seller" ||
    lower === "seller partner" ||
    lower === "seller role" ||
    lower === "owner role" ||
    lower === "cloud kitchen"
  );
}

export function computeInitials(name?: string): string {
  if (!name || !name.trim()) return "SK";
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "SK";
}

export function updateCachedProfile(partial: Partial<SellerProfileData>) {
  if (!cachedProfile) {
    cachedProfile = {};
  }
  cachedProfile = { ...cachedProfile, ...partial };
  notifyListeners();
}

export function clearCachedProfile() {
  cachedProfile = null;
  notifyListeners();
}

export async function toggleSellerOnlineStatus(newStatus?: boolean): Promise<boolean> {
  const currentStatus = cachedProfile?.isOnline ?? true;
  const targetStatus = typeof newStatus === "boolean" ? newStatus : !currentStatus;
  
  // Optimistically update
  updateCachedProfile({ isOnline: targetStatus });

  try {
    const res = await fetchApi("/api/seller/profile/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: targetStatus }),
    });

    if (res.ok) {
      const json = await res.json();
      const confirmedStatus = json.data?.isOnline ?? targetStatus;
      updateCachedProfile({ isOnline: confirmedStatus });
      return confirmedStatus;
    } else {
      // Revert if error
      updateCachedProfile({ isOnline: currentStatus });
      return currentStatus;
    }
  } catch (err) {
    console.error("Failed to update seller online status:", err);
    updateCachedProfile({ isOnline: currentStatus });
    return currentStatus;
  }
}

export function isPublicSellerRoute(pathname?: string): boolean {
  if (!pathname) return false;
  return (
    pathname === "/seller/login" ||
    pathname === "/seller/res/login" ||
    pathname === "/auth/login/seller" ||
    pathname === "/seller-onboarding" ||
    pathname.startsWith("/seller-onboarding") ||
    pathname.startsWith("/seller/registration") ||
    pathname.startsWith("/seller/registration-submitted") ||
    pathname.startsWith("/seller/account-information") ||
    pathname.startsWith("/seller/business-information") ||
    pathname.startsWith("/seller/confirm-information") ||
    pathname.startsWith("/seller/confirm-registration") ||
    pathname.startsWith("/seller/legal-documents") ||
    pathname.startsWith("/seller/legal-information") ||
    pathname.startsWith("/seller/media-gallery") ||
    pathname.startsWith("/seller/media-information") ||
    pathname.startsWith("/seller/faq") ||
    pathname.startsWith("/seller/res/faq") ||
    pathname.startsWith("/seller/tc") ||
    pathname.startsWith("/seller/res/tc")
  );
}

export function useSellerProfile() {
  const { data: session, status } = useSession();
  const sessionName = session?.user?.name || "";
  const sessionEmail = session?.user?.email || "";
  const sessionRole = session?.user?.role;

  const [profileState, setProfileState] = useState<SellerProfileData>(() => {
    const isSeller = sessionRole === "SELLER";
    const rawName = (isSeller && cachedProfile?.ownerName) || (!isGenericFallbackName(sessionName) ? sessionName : "") || "";
    const busName = (isSeller && cachedProfile?.businessName) || rawName;
    const name = busName || rawName;
    return {
      ownerName: isSeller ? name : "",
      businessName: isSeller ? busName : "",
      userFullName: (isSeller && cachedProfile?.userFullName) || sessionName || name,
      email: (isSeller && cachedProfile?.email) || sessionEmail || "",
      phone: (isSeller && cachedProfile?.phone) || "",
      city: (isSeller && cachedProfile?.city) || "",
      pincode: (isSeller && cachedProfile?.pincode) || "",
      address: (isSeller && cachedProfile?.address) || "",
      avatarInitials: isSeller ? (cachedProfile?.avatarInitials || computeInitials(name)) : "SK",
      partnerRole: isSeller ? (cachedProfile?.partnerRole || "Neo Cloud Partner") : "",
      isOnline: isSeller ? (cachedProfile?.isOnline ?? true) : true,
      isLoading: isSeller ? !cachedProfile : false,
      authStatus: status,
      user: isSeller ? (cachedProfile?.user || null) : null,
      profile: isSeller ? (cachedProfile?.profile || null) : null,
    };
  });

  useEffect(() => {
    setProfileState((prev) => ({ ...prev, authStatus: status }));

    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    const isPublicSellerPath = isPublicSellerRoute(pathname);

    const isSellerRoute =
      pathname === "/seller" ||
      pathname.startsWith("/seller/") ||
      pathname === "/dashboard/seller" ||
      pathname.startsWith("/dashboard/seller/");

    if (isSellerRoute && !isPublicSellerPath && (status === "unauthenticated" || (status === "authenticated" && sessionRole !== "SELLER"))) {
      const callbackUrl = encodeURIComponent(pathname + window.location.search);
      window.location.href = `/seller/login?callbackUrl=${callbackUrl}`;
    }
  }, [status, sessionRole]);

  useEffect(() => {
    const handleUpdate = () => {
      if (cachedProfile && sessionRole === "SELLER") {
        setProfileState((prev) => ({
          ...prev,
          ...cachedProfile,
          authStatus: status,
          isLoading: false,
        }));
      }
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, [status, sessionRole]);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      // Only make authenticated profile request when the user has an active SELLER session
      if (status !== "authenticated" || sessionRole !== "SELLER") {
        if (isMounted) {
          setProfileState((prev) => ({
            ...prev,
            authStatus: status,
            isLoading: false,
            ownerName: sessionRole === "SELLER" ? prev.ownerName : "",
            businessName: sessionRole === "SELLER" ? prev.businessName : "",
            user: sessionRole === "SELLER" ? prev.user : null,
            profile: sessionRole === "SELLER" ? prev.profile : null,
          }));
        }
        return;
      }

      try {
        const res = await fetchApi("/api/seller/profile");
        if (res.ok) {
          const json = await res.json();
          const user = json.data?.user || json.user;
          const profile = json.data?.profile || json.profile;

          const validUserName = user?.name && !isGenericFallbackName(user.name) ? user.name : "";
          const validSessionName = sessionName && !isGenericFallbackName(sessionName) ? sessionName : "";
          const rawBusinessName =
            profile?.businessName || validUserName || validSessionName || user?.name || "Kitchen Owner";
          const rawOwnerName = rawBusinessName;
          const rawFullName = validUserName || validSessionName || user?.name || rawBusinessName;
          const rawEmail = user?.email || sessionEmail || "";
          const rawPhone = user?.phone || "";
          const rawCity = user?.city || "";
          const rawPincode = user?.pincode || "";
          const rawAddress =
            profile?.addressLocality ||
            `${profile?.addressFlat ? profile.addressFlat + ", " : ""}${profile?.addressLocality || ""}` ||
            user?.city ||
            "";
          const rawInitials = computeInitials(rawBusinessName);
          const rawOnline = typeof profile?.isOnline === "boolean" ? profile.isOnline : true;

          cachedProfile = {
            id: profile?.id || user?.sellerProfile?.id || user?.id || "",
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
              id: profile?.id || user?.sellerProfile?.id || user?.id || "",
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
              authStatus: status,
              user,
              profile,
            });
          }
        } else if (res.status === 401) {
          if (typeof window !== "undefined") {
            const pathname = window.location.pathname;
            const isPublicSellerPath = isPublicSellerRoute(pathname);

            if (!isPublicSellerPath && (pathname.startsWith("/seller") || pathname.startsWith("/dashboard/seller"))) {
              const callbackUrl = encodeURIComponent(pathname + window.location.search);
              window.location.href = `/seller/login?callbackUrl=${callbackUrl}`;
            }
          }
        }
      } catch (e) {
        console.error("useSellerProfile fetch error:", e);
      } finally {
        if (isMounted) {
          setProfileState((prev) => ({ ...prev, authStatus: status, isLoading: false }));
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [sessionName, sessionEmail, status]);

  return profileState;
}
