import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
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

  // 2. Extract session token cookie (NextAuth v4/v5 development and production names)
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isAuthenticated = Boolean(sessionToken && sessionToken.trim() !== "");

  // 3. Define public seller onboarding and login pages
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

  // 4. Protected Seller Console routes
  const isSellerRoute =
    (pathname === "/seller" ||
      pathname.startsWith("/seller/") ||
      pathname === "/dashboard/seller" ||
      pathname.startsWith("/dashboard/seller/")) &&
    !isPublicSellerPath;

  if (isSellerRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname + search);
    const loginUrl = new URL(`/seller/login?callbackUrl=${callbackUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Protected Admin & Superadmin routes
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

  if (isAdminRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname + search);
    const loginUrl = new URL(`/auth/login/admin?callbackUrl=${callbackUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Protected Delivery routes
  const isPublicDeliveryPath =
    pathname === "/auth/login/delivery" ||
    pathname === "/delivery-addresses-desktop";

  const isDeliveryRoute =
    (pathname === "/delivery" ||
      pathname.startsWith("/delivery/") ||
      pathname === "/dashboard/delivery" ||
      pathname.startsWith("/dashboard/delivery/")) &&
    !isPublicDeliveryPath;

  if (isDeliveryRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname + search);
    const loginUrl = new URL(`/auth/login/delivery?callbackUrl=${callbackUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 7. Protected User Checkout & Account routes:
  // Public user pages: /, /explore*, /restaurant*, /room-booking*, /cart, /user/cart, /user/user-cart, /login, /signup, etc.
  // Protected user pages: Checkout (/checkout, /user/checkout, /dashboard/user/checkout), User Dashboard & Orders
  const isUserCheckoutRoute =
    pathname === "/checkout" ||
    pathname === "/user/checkout" ||
    pathname === "/dashboard/user/checkout";

  const isUserAccountRoute =
    pathname.startsWith("/dashboard/user") ||
    (pathname.startsWith("/user/") &&
      pathname !== "/user/cart" &&
      pathname !== "/user/user-cart") ||
    pathname === "/profile" ||
    pathname === "/profile-desktop" ||
    pathname === "/settings" ||
    pathname === "/settings-desktop" ||
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

  if ((isUserCheckoutRoute || isUserAccountRoute) && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname + search);
    const loginUrl = new URL(`/login?callbackUrl=${callbackUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

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
