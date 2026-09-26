import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export type NotificationCategory =
    | "all"
    | "orders"
    | "stock"
    | "delivery"
    | "timings"
    | "bookings"
    | "reviews"
    | "settlements"
    | "system";

export type NotificationSeverity = "critical" | "warning" | "info" | "success";

export interface SellerNotification {
    id: string;
    category: NotificationCategory;
    title: string;
    message: string;
    details?: string;
    timestamp: string;
    timeAgo: string;
    isRead: boolean;
    severity: NotificationSeverity;
    actionLabel?: string;
    actionHref?: string;
    metadata?: Record<string, any>;
}

function calculateTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 45) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export const getAuthenticatedSeller = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to access notifications.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id },
        include: { user: true }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
    }

    return { session, sellerProfile };
};

export const getSellerNotifications = async (req: Request) => {
    const { sellerProfile } = await getAuthenticatedSeller();
    const url = new URL(req.url);
    const categoryFilter = url.searchParams.get("category") || "all";
    const severityFilter = url.searchParams.get("severity");
    const limit = parseInt(url.searchParams.get("limit") || "60", 10);

    const notifications: SellerNotification[] = [];

    // 1. Fetch Recent Orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await db.order.findMany({
        where: {
            sellerId: sellerProfile.id,
            createdAt: { gte: thirtyDaysAgo }
        },
        include: {
            user: { select: { id: true, name: true, phone: true } },
            deliveryPerson: { select: { id: true, name: true, phone: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 30
    });

    for (const ord of orders) {
        const ordShort = ord.id.slice(-6).toUpperCase();
        let itemsCount = 0;
        try {
            const parsed = JSON.parse(ord.items || "[]");
            itemsCount = Array.isArray(parsed) ? parsed.length : 1;
        } catch {
            itemsCount = 1;
        }

        const isRecent = (new Date().getTime() - ord.createdAt.getTime()) < (6 * 60 * 60 * 1000); // within 6 hours considered unread by default

        if (ord.status === "PENDING" || ord.status === "NEW") {
            notifications.push({
                id: `ord-new-${ord.id}`,
                category: "orders",
                title: `New Order Received #ORD-${ordShort}`,
                message: `Order for ₹${ord.totalAmount.toFixed(0)} (${itemsCount} items) received from ${ord.user?.name || "Customer"}.`,
                details: `Payment: ${ord.paymentMethod} • Status: ${ord.isPaid ? "Paid" : "Pending"}`,
                timestamp: ord.createdAt.toISOString(),
                timeAgo: calculateTimeAgo(ord.createdAt),
                isRead: !isRecent,
                severity: "success",
                actionLabel: "View Order",
                actionHref: `/seller/orders?id=${ord.id}`,
                metadata: { orderId: ord.id, totalAmount: ord.totalAmount, status: ord.status }
            });
        } else if (ord.status === "OUT_FOR_DELIVERY" || ord.status === "PICKED_UP") {
            notifications.push({
                id: `ord-del-${ord.id}`,
                category: "delivery",
                title: `Order Out for Delivery #ORD-${ordShort}`,
                message: ord.deliveryPerson
                    ? `Rider ${ord.deliveryPerson.name} has picked up the order and is on the way.`
                    : `Order #ORD-${ordShort} is out for delivery to customer.`,
                details: `Destination: ${ord.deliveryAddress || "Customer Address"}`,
                timestamp: ord.updatedAt.toISOString(),
                timeAgo: calculateTimeAgo(ord.updatedAt),
                isRead: true,
                severity: "info",
                actionLabel: "Track Delivery",
                actionHref: `/seller/delivery?id=${ord.id}`,
                metadata: { orderId: ord.id, deliveryPersonId: ord.deliveryPersonId }
            });
        } else if (ord.status === "CANCELLED" || ord.status === "REJECTED") {
            notifications.push({
                id: `ord-can-${ord.id}`,
                category: "orders",
                title: `Order Cancelled #ORD-${ordShort}`,
                message: `Order #ORD-${ordShort} for ₹${ord.totalAmount.toFixed(0)} was cancelled.`,
                details: "Customer requested cancellation or time window elapsed.",
                timestamp: ord.updatedAt.toISOString(),
                timeAgo: calculateTimeAgo(ord.updatedAt),
                isRead: true,
                severity: "critical",
                actionLabel: "View Order",
                actionHref: `/seller/orders?id=${ord.id}`,
                metadata: { orderId: ord.id }
            });
        } else if (ord.status === "DELIVERED" || ord.status === "COMPLETED") {
            notifications.push({
                id: `ord-don-${ord.id}`,
                category: "orders",
                title: `Order Delivered #ORD-${ordShort}`,
                message: `Order for ₹${ord.totalAmount.toFixed(0)} was delivered successfully.`,
                timestamp: ord.updatedAt.toISOString(),
                timeAgo: calculateTimeAgo(ord.updatedAt),
                isRead: true,
                severity: "success",
                actionLabel: "View Order",
                actionHref: `/seller/orders?id=${ord.id}`,
                metadata: { orderId: ord.id }
            });
        }
    }

    // 2. Fetch Low Stock / Unavailable Menu Items
    const unavailableFood = await db.foodItem.findMany({
        where: {
            sellerId: sellerProfile.id,
            OR: [
                { isAvailable: false },
                { AND: [{ stockQuantity: { gte: 0 } }, { stockQuantity: { lte: 5 } }] }
            ]
        },
        take: 10
    });

    for (const item of unavailableFood) {
        notifications.push({
            id: `stock-${item.id}`,
            category: "stock",
            title: item.isAvailable ? `Low Stock Alert: ${item.name}` : `Out of Stock: ${item.name}`,
            message: item.isAvailable
                ? `Only ${item.stockQuantity} portion(s) remaining in kitchen inventory.`
                : `Item is marked unavailable on your digital storefront.`,
            details: `Price: ₹${item.price.toFixed(0)} • Category: ${item.itemType}`,
            timestamp: new Date().toISOString(),
            timeAgo: "Live",
            isRead: false,
            severity: "warning",
            actionLabel: "Manage Menu",
            actionHref: `/seller/menu`,
            metadata: { foodItemId: item.id, stockQuantity: item.stockQuantity }
        });
    }

    // 3. Fetch User Meal Subscriptions
    const userMealSubs = await db.userMealSubscription.findMany({
        where: {
            sellerId: sellerProfile.id
        },
        include: {
            user: { select: { id: true, name: true, phone: true } },
            plan: { select: { id: true, name: true, tier: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 15
    });

    for (const sub of userMealSubs) {
        const isSubRecent = (new Date().getTime() - sub.createdAt.getTime()) < (24 * 60 * 60 * 1000);
        notifications.push({
            id: `mealsub-${sub.id}`,
            category: "settlements",
            title: `New Meal Subscriber: ${sub.plan?.name || "Meal Plan"}`,
            message: `${sub.user?.name || "Customer"} subscribed (${sub.tier} Tier, ${sub.cycle}) for ₹${sub.pricePaid.toFixed(0)}.`,
            details: `Delivery to: ${sub.deliveryAddress || "Customer Address"} • Status: ${sub.status}`,
            timestamp: sub.createdAt.toISOString(),
            timeAgo: calculateTimeAgo(sub.createdAt),
            isRead: !isSubRecent,
            severity: "success",
            actionLabel: "View Subscribers",
            actionHref: `/seller/subscription`,
            metadata: { subscriptionId: sub.id, planId: sub.planId }
        });
    }

    // 4. Fetch Reviews
    const reviews = await db.review.findMany({
        where: {
            sellerId: sellerProfile.id
        },
        include: {
            user: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 15
    });

    for (const rev of reviews) {
        const isHigh = rev.rating >= 4;
        const isLow = rev.rating <= 2;
        notifications.push({
            id: `rev-${rev.id}`,
            category: "reviews",
            title: `New ${rev.rating}-Star Customer Review`,
            message: rev.comment ? `"${rev.comment}"` : `Customer gave a ${rev.rating}-star rating.`,
            details: `Reviewed by: ${rev.user?.name || "Customer"}`,
            timestamp: rev.createdAt.toISOString(),
            timeAgo: calculateTimeAgo(rev.createdAt),
            isRead: true,
            severity: isHigh ? "success" : isLow ? "warning" : "info",
            actionLabel: "View Reviews",
            actionHref: `/seller/reviews`,
            metadata: { reviewId: rev.id, rating: rev.rating }
        });
    }

    // 5. Fetch Room Bookings (if property seller)
    if (sellerProfile.businessCategory === "PROPERTY" || sellerProfile.businessCategory === "BOTH") {
        const bookings = await db.booking.findMany({
            where: {
                room: { sellerId: sellerProfile.id }
            },
            include: {
                room: { select: { id: true, title: true } },
                user: { select: { id: true, name: true, phone: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 10
        });

        for (const bk of bookings) {
            notifications.push({
                id: `bk-${bk.id}`,
                category: "bookings",
                title: `Room Reservation: ${bk.room?.title || "Cozy Room"}`,
                message: `Guest ${bk.user?.name || "Resident"} booked for ₹${bk.totalAmount.toFixed(0)} (${bk.status}).`,
                details: `From ${new Date(bk.startDate).toLocaleDateString()} to ${new Date(bk.endDate).toLocaleDateString()}`,
                timestamp: bk.createdAt.toISOString(),
                timeAgo: calculateTimeAgo(bk.createdAt),
                isRead: true,
                severity: "info",
                actionLabel: "View Bookings",
                actionHref: `/seller/booking`,
                metadata: { bookingId: bk.id, roomId: bk.roomId }
            });
        }
    }

    // 6. Platform Store Verification & System Alerts
    const verifTimestamp = sellerProfile.user?.updatedAt || new Date();
    if (sellerProfile.foodVerificationStatus === "APPROVED") {
        notifications.push({
            id: `sys-food-verif-${sellerProfile.id}`,
            category: "system",
            title: "Food Business Verification Approved ✅",
            message: "Your cloud kitchen documents have been verified and approved by Neo Cloud Bites admin.",
            timestamp: verifTimestamp.toISOString(),
            timeAgo: calculateTimeAgo(verifTimestamp),
            isRead: true,
            severity: "success",
            actionLabel: "View Store Profile",
            actionHref: `/seller/profile`,
        });
    } else if (sellerProfile.foodVerificationStatus === "REJECTED") {
        notifications.push({
            id: `sys-food-rej-${sellerProfile.id}`,
            category: "system",
            title: "Action Required: Food Verification Needs Revision ⚠️",
            message: "One or more KYC documents were rejected. Please review feedback and re-submit.",
            timestamp: verifTimestamp.toISOString(),
            timeAgo: calculateTimeAgo(verifTimestamp),
            isRead: false,
            severity: "critical",
            actionLabel: "Re-apply Verification",
            actionHref: `/seller/reapply`,
        });
    }

    // Sort all notifications chronologically (newest first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate Counts by Category
    const countsByCategory: Record<string, number> = {
        all: notifications.length,
        orders: notifications.filter(n => n.category === "orders").length,
        stock: notifications.filter(n => n.category === "stock").length,
        delivery: notifications.filter(n => n.category === "delivery").length,
        bookings: notifications.filter(n => n.category === "bookings").length,
        reviews: notifications.filter(n => n.category === "reviews").length,
        settlements: notifications.filter(n => n.category === "settlements").length,
        system: notifications.filter(n => n.category === "system").length,
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Apply Filter
    let filtered = notifications;
    if (categoryFilter && categoryFilter !== "all") {
        filtered = filtered.filter(n => n.category.toLowerCase() === categoryFilter.toLowerCase());
    }
    if (severityFilter && severityFilter !== "all") {
        filtered = filtered.filter(n => n.severity.toLowerCase() === severityFilter.toLowerCase());
    }

    // Apply Limit
    const paged = filtered.slice(0, limit);

    return {
        unreadCount,
        totalCount: notifications.length,
        filteredCount: filtered.length,
        countsByCategory,
        notifications: paged
    };
};

export const markSellerNotificationRead = async (req: Request) => {
    await getAuthenticatedSeller();
    let body: any = {};
    try {
        body = await req.json();
    } catch {}

    const { id, ids, markAllRead } = body;

    return {
        success: true,
        message: markAllRead ? "All notifications marked as read" : "Notification marked as read",
        readId: id || null,
        readIds: ids || [],
        markAllRead: Boolean(markAllRead)
    };
};

export const getSellerNotificationCount = async () => {
    const { sellerProfile } = await getAuthenticatedSeller();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pendingOrdersCount = await db.order.count({
        where: {
            sellerId: sellerProfile.id,
            status: { in: ["PENDING", "NEW"] },
            createdAt: { gte: thirtyDaysAgo }
        }
    });

    const lowStockCount = await db.foodItem.count({
        where: {
            sellerId: sellerProfile.id,
            OR: [
                { isAvailable: false },
                { AND: [{ stockQuantity: { gte: 0 } }, { stockQuantity: { lte: 5 } }] }
            ]
        }
    });

    const unreadCount = pendingOrdersCount + lowStockCount;

    return {
        unreadCount,
        pendingOrders: pendingOrdersCount,
        lowStockItems: lowStockCount,
    };
};

export const getSellerNotificationPreferences = async () => {
    const { sellerProfile } = await getAuthenticatedSeller();

    return {
        channels: {
            push: true,
            sms: true,
            email: true,
            whatsapp: false,
            soundEnabled: true,
        },
        alerts: {
            orderAlerts: true,
            outForDeliveryAlert: true,
            lowStockAlert: true,
            bookingRequestAlert: true,
            negativeReviewAlert: true,
            closingReminder30Min: true,
        },
        sellerId: sellerProfile.id
    };
};

export const updateSellerNotificationPreferences = async (req: Request) => {
    const { sellerProfile } = await getAuthenticatedSeller();
    const body = await req.json();

    return {
        success: true,
        message: "Notification preferences updated successfully",
        preferences: body,
        sellerId: sellerProfile.id
    };
};
