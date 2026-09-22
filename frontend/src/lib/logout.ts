"use client";

import { signOut } from "next-auth/react";

import { clearCachedProfile } from "@/hooks/useSellerProfile";

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
 * Synchronously removes all auth-related items from localStorage, sessionStorage,
 * in-memory hooks/caches, and expires known session cookies.
 */
export function clearAllAuthData(): void {
  if (typeof window === "undefined") return;

  try {
    // Clear known local storage keys
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("seller");
    localStorage.removeItem("latestConfirmedOrder");
    localStorage.removeItem("seller_registration_data");
    localStorage.removeItem("neo_seller_reg_store_v1");

    // Clear session storage
    sessionStorage.clear();

    // Clear module-level seller profile cache
    clearCachedProfile();

    // Clear known NextAuth & Auth.js session cookies on current domain & root path
    const cookieNames = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "next-auth.callback-url",
      "__Secure-next-auth.callback-url",
      "next-auth.csrf-token",
      "__Secure-next-auth.csrf-token",
    ];

    for (const name of cookieNames) {
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      document.cookie = `${name}=; Path=/; Domain=${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    }
  } catch (e) {
    console.warn("Storage cleanup failed:", e);
  }
}

/**
 * Discards any currently active session, token, and caches completely.
 * Always call before authenticating new credentials to prevent role/dashboard merging.
 */
export async function discardExistingSession(): Promise<void> {
  clearAllAuthData();

  try {
    await signOut({ redirect: false });
  } catch (err) {
    console.warn("NextAuth signOut during session discard warning:", err);
  }

  // Double check storage after signOut
  clearAllAuthData();
}

/**
 * Robust logout execution:
 * 1. Clears localStorage, sessionStorage, profile caches, and cookies.
 * 2. Invalidates NextAuth session on the server via signOut.
 * 3. Performs a hard redirect to the role's respective login page.
 */
export async function performLogout(options?: {
  role?: string | null;
  redirectTo?: string;
}): Promise<void> {
  const targetUrl = options?.redirectTo || getLoginRouteForRole(options?.role);

  await discardExistingSession();

  if (typeof window !== "undefined") {
    window.location.href = targetUrl;
  }
}
