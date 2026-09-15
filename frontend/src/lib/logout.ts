"use client";

import { signOut } from "next-auth/react";

export type AppUserRole =
  | "USER"
  | "SELLER"
  | "ADMIN"
  | "SUPERADMIN"
  | "AGENT"
  | "SUPPORT"
  | "DELIVERY";

/**
 * Returns the respective login route based on user role.
 */
export function getLoginRouteForRole(role?: string | null): string {
  if (!role) return "/login";
  const r = role.toUpperCase();
  if (r === "SELLER") return "/seller/login";
  if (r === "DELIVERY") return "/delivery";
  if (r === "SUPERADMIN" || r === "AGENT" || r === "ADMIN" || r === "SUPPORT") {
    return "/admin";
  }
  return "/login";
}

/**
 * Robust logout execution:
 * 1. Clears localStorage and sessionStorage tokens/caches.
 * 2. Invalides NextAuth session on the server via signOut.
 * 3. Performs a hard redirect to the role's respective login page.
 */
export async function performLogout(options?: {
  role?: string | null;
  redirectTo?: string;
}): Promise<void> {
  const targetUrl = options?.redirectTo || getLoginRouteForRole(options?.role);

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("seller");
      localStorage.removeItem("latestConfirmedOrder");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Storage cleanup failed during logout:", e);
    }
  }

  try {
    await signOut({ redirect: false });
  } catch (err) {
    console.warn("NextAuth signOut error:", err);
  }

  if (typeof window !== "undefined") {
    window.location.href = targetUrl;
  }
}
