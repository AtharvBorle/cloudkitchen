import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "@auth/core/jwt";

// ──────────────────────────────────────────────
// Helper: Decrypt the NextAuth v5 JWE session token to extract user role
// ──────────────────────────────────────────────
async function getSessionRole(request: NextRequest): Promise<string | null> {
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken || sessionToken.trim() === "") return null;

  try {
    const secret =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "super_secret_for_local_testing_dev_only";

    const decoded = await decode({
      token: sessionToken,
      secret,
      salt:
        request.cookies.get("__Secure-next-auth.session-token")?.value
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
    });

    if (decoded && typeof decoded.role === "string") {
      return decoded.role;
    }
  } catch (err) {
    // Token is invalid or expired — treat as unauthenticated
    console.warn("Middleware JWT decode failed:", err);
  }

  return null;
}

// ──────────────────────────────────────────────
// Helper: Get the dashboard URL for a given role
// ──────────────────────────────────────────────
function getDashboardForRole(role: string): string {
  switch (role.toUpperCase()) {
    case "SELLER":
      return "/seller/dashboard";
    case "DELIVERY":
      return "/dashboard/delivery";
    case "AGENT":
    case "ADMIN":
      return "/dashboard/admin";
    case "SUPERADMIN":
      return "/dashboard/superadmin";
    case "SUPPORT":
      return "/dashboard/support";
    case "USER":
    default:
      return "/";
  }
}

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Skip Next.js internal files, API routes, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Extract session token and decode role
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isAuthenticated = Boolean(sessionToken && sessionToken.trim() !== "");

  // Decode role from JWT (only if authenticated)
  let userRole: string | null = null;
  if (isAuthenticated) {
    userRole = await getSessionRole(request);
  }

  // ──────────────────────────────────────────
  // 3. LEGAL / TRULY PUBLIC PAGES — accessible to ALL roles (even non-USER)
  // ──────────────────────────────────────────
  const isLegalPage =
    pathname === "/support" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname.startsWith("/auth/forgot-password");

  // ──────────────────────────────────────────
  // 3b. USER-FACING CONSUMER PAGES — only for USER role & unauthenticated visitors
  //     Authenticated non-USER roles get redirected to their dashboard
  // ──────────────────────────────────────────
  const isUserFacingPage =
    pathname === "/" ||
    pathname.startsWith("/explore") ||
    pathname.startsWith("/restaurant") ||
    pathname.startsWith("/room-booking") ||
    pathname === "/cart" ||
    pathname === "/user/cart" ||
    pathname === "/user/user-cart" ||
    pathname === "/settings-desktop" ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/shop/");

  // If authenticated non-USER role tries to access user-facing consumer pages → redirect
  if (isAuthenticated && userRole && !isLegalPage && isUserFacingPage) {
    const role = userRole.toUpperCase();
    if (role !== "USER") {
      return NextResponse.redirect(
        new URL(getDashboardForRole(role), request.url)
      );
    }
  }

  // ──────────────────────────────────────────
  // 4. LOGIN PAGE GUARDS — if already logged in, redirect away from login pages
  //    to prevent cross-role session reuse
  // ──────────────────────────────────────────
  const isUserLoginPage = pathname === "/login" || pathname === "/signup";
  const isSellerLoginPage =
    pathname === "/seller/login" ||
    pathname === "/seller/res/login" ||
    pathname === "/auth/login/seller";
  const isAdminLoginPage =
    pathname === "/auth/login/admin" ||
    pathname === "/admin/login";
  const isDeliveryLoginPage = pathname === "/auth/login/delivery";

  const isAnyLoginPage =
    isUserLoginPage || isSellerLoginPage || isAdminLoginPage || isDeliveryLoginPage;

  // If authenticated and trying to access ANY login page, redirect to their own dashboard
  if (isAuthenticated && userRole && isAnyLoginPage) {
    const dashboardUrl = new URL(getDashboardForRole(userRole), request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // ──────────────────────────────────────────
  // 5. Define public seller onboarding pages (accessible without login)
  // ──────────────────────────────────────────
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

  // ──────────────────────────────────────────
  // 6. ROLE-BASED ROUTE CLASSIFICATION
  // ──────────────────────────────────────────

  // Seller routes (protected)
  const isSellerRoute =
    (pathname === "/seller" ||
      pathname.startsWith("/seller/") ||
      pathname === "/dashboard/seller" ||
      pathname.startsWith("/dashboard/seller/")) &&
    !isPublicSellerPath;

  // Admin routes (protected)
  const isPublicAdminPath =
    pathname === "/auth/login/admin" ||
    pathname === "/admin/login";

  const isAdminRoute =
    (pathname === "/admin" ||
      pathname.startsWith("/admin/") ||
      pathname === "/dashboard/admin" ||
      pathname.startsWith("/dashboard/admin/") ||
      pathname === "/dashboard/superadmin" ||
      pathname.startsWith("/dashboard/superadmin/") ||
      pathname === "/dashboard/support" ||
      pathname.startsWith("/dashboard/support/")) &&
    !isPublicAdminPath;

  // Delivery routes (protected)
  const isPublicDeliveryPath =
    pathname === "/auth/login/delivery" ||
    pathname === "/delivery-addresses-desktop";

  const isDeliveryRoute =
    (pathname === "/delivery" ||
      pathname.startsWith("/delivery/") ||
      pathname === "/dashboard/delivery" ||
      pathname.startsWith("/dashboard/delivery/")) &&
    !isPublicDeliveryPath;

  // User-only protected routes (checkout, orders, dashboard, etc.)
  const isUserCheckoutRoute =
    pathname === "/checkout" ||
    pathname === "/user/checkout" ||
    pathname === "/dashboard/user/checkout";

  const isUserAccountRoute =
    pathname.startsWith("/dashboard/user") ||
    (pathname.startsWith("/user/") &&
      pathname !== "/user/cart" &&
      pathname !== "/user/user-cart") ||
    pathname === "/my-orders" ||
    pathname === "/orders-desktop" ||
    pathname === "/order-history-desktop" ||
    pathname === "/order-confirmation" ||
    pathname === "/my-subscription" ||
    pathname === "/my-subscriptions-desktop" ||
    pathname === "/payment-methods-desktop" ||
    pathname === "/delivery-addresses-desktop" ||
    pathname === "/notifications-desktop" ||
    pathname.startsWith("/invoice");

  const isUserProtectedRoute = isUserCheckoutRoute || isUserAccountRoute;

  // ──────────────────────────────────────────
  // 7. UNAUTHENTICATED ACCESS — redirect to login
  // ──────────────────────────────────────────
  if (!isAuthenticated) {
    if (isSellerRoute) {
      const callbackUrl = encodeURIComponent(pathname + search);
      return NextResponse.redirect(
        new URL(`/seller/login?callbackUrl=${callbackUrl}`, request.url)
      );
    }
    if (isAdminRoute) {
      const callbackUrl = encodeURIComponent(pathname + search);
      return NextResponse.redirect(
        new URL(`/auth/login/admin?callbackUrl=${callbackUrl}`, request.url)
      );
    }
    if (isDeliveryRoute) {
      const callbackUrl = encodeURIComponent(pathname + search);
      return NextResponse.redirect(
        new URL(`/auth/login/delivery?callbackUrl=${callbackUrl}`, request.url)
      );
    }
    if (isUserProtectedRoute) {
      const callbackUrl = encodeURIComponent(pathname + search);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
      );
    }
    // Public page or unprotected route — allow
    return NextResponse.next();
  }

  // ──────────────────────────────────────────
  // 8. AUTHENTICATED — ROLE ENFORCEMENT
  //    Redirect users to their own dashboard if accessing wrong role's routes
  // ──────────────────────────────────────────
  if (userRole) {
    const role = userRole.toUpperCase();

    // Seller accessing non-seller protected routes → redirect to seller dashboard
    if (role === "SELLER") {
      if (isAdminRoute || isDeliveryRoute || isUserProtectedRoute) {
        return NextResponse.redirect(
          new URL("/seller/dashboard", request.url)
        );
      }
    }

    // User accessing non-user protected routes → redirect to home
    if (role === "USER") {
      if (isSellerRoute || isAdminRoute || isDeliveryRoute) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Admin/Agent/Superadmin/Support accessing other dashboards → redirect to admin
    if (
      role === "AGENT" ||
      role === "ADMIN" ||
      role === "SUPERADMIN" ||
      role === "SUPPORT"
    ) {
      if (isSellerRoute || isDeliveryRoute || isUserProtectedRoute) {
        return NextResponse.redirect(
          new URL(getDashboardForRole(role), request.url)
        );
      }
    }

    // Delivery accessing other dashboards → redirect to delivery dashboard
    if (role === "DELIVERY") {
      if (isSellerRoute || isAdminRoute || isUserProtectedRoute) {
        return NextResponse.redirect(
          new URL("/dashboard/delivery", request.url)
        );
      }
    }
  }

  // ──────────────────────────────────────────
  // 9. Allow everything else (public pages, correctly-roled access)
  // ──────────────────────────────────────────
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/fonts/assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|ico)$).*)",
  ],
};
