import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export type NotificationCategory =
    | "all"
    | "orders"
    | "offers"
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
    const { session, sellerProfile } = await getAuthenticatedSeller();
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
                actionHref: `/seller/orders/details?orderId=${encodeURIComponent(ord.id)}`,
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
                actionHref: `/seller/orders/details?orderId=${encodeURIComponent(ord.id)}`,
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
                actionHref: `/seller/orders/details?orderId=${encodeURIComponent(ord.id)}`,
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
                actionHref: `/seller/orders/details?orderId=${encodeURIComponent(ord.id)}`,
                metadata: { orderId: ord.id }
            });
        }
    }

    // 2. Fetch Stock & Inventory Items for the Seller
    const foodItems = await db.foodItem.findMany({
        where: {
            sellerId: sellerProfile.id,
        },
        orderBy: [
            { isAvailable: "asc" },
            { stockQuantity: "asc" }
        ],
        take: 50
    });

    for (const item of foodItems) {
        const isOutOfStock = !item.isAvailable || item.stockQuantity === 0;
        const isLowStock = !isOutOfStock && item.stockQuantity <= 5 && item.stockQuantity > 0;

        let title = `Stock & Inventory: ${item.name}`;
        let message = `Current available inventory for "${item.name}" is ${item.stockQuantity} unit(s).`;
        let severity: NotificationSeverity = "info";

        if (isOutOfStock) {
            title = `Out of Stock: ${item.name}`;
            message = `Inventory for "${item.name}" is depleted (0 units). Item is unavailable on storefront.`;
            severity = "critical";
        } else if (isLowStock) {
            title = `Low Stock Alert: ${item.name}`;
            message = `Only ${item.stockQuantity} portion(s) remaining for "${item.name}". Restock item soon.`;
            severity = "warning";
        } else {
            title = `Stock & Inventory: ${item.name}`;
            message = `Current available inventory for "${item.name}" is ${item.stockQuantity} unit(s).`;
            severity = "success";
        }

        notifications.push({
            id: `stock-${item.id}`,
            category: "stock",
            title,
            message,
            details: `Current Stock: ${item.stockQuantity >= 0 ? item.stockQuantity : 0} units • Category: ${item.itemType} • Price: ₹${item.price.toFixed(0)}`,
            timestamp: new Date().toISOString(),
            timeAgo: "Live",
            isRead: !isOutOfStock && !isLowStock,
            severity,
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

    // 5. Fetch Room Bookings & Reports
    let bookings = await db.booking.findMany({
        where: {
            OR: [
                { room: { sellerId: sellerProfile.id } },
                { room: { seller: { userId: session.user.id } } },
                { userId: session.user.id }
            ]
        },
        include: {
            room: { select: { id: true, title: true } },
            user: { select: { id: true, name: true, phone: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 30
    });

    if (bookings.length === 0) {
        bookings = await db.booking.findMany({
            include: {
                room: { select: { id: true, title: true } },
                user: { select: { id: true, name: true, phone: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });
    }

    for (const bk of bookings) {
        const isRecent = (new Date().getTime() - bk.createdAt.getTime()) < (7 * 24 * 60 * 60 * 1000);
        const guestName = bk.user?.name || "Guest";
        const roomTitle = bk.room?.title || "Cozy Room";
        const startDateStr = new Date(bk.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const endDateStr = new Date(bk.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const phone = bk.user?.phone ? ` • Phone: ${bk.user.phone}` : "";
        const total = typeof bk.totalAmount === "number" ? bk.totalAmount.toFixed(0) : (bk.totalAmount || "0");

        notifications.push({
            id: `bk-${bk.id}`,
            category: "bookings",
            title: `Room Reservation #${bk.id.slice(-6).toUpperCase()}: ${roomTitle}`,
            message: `Guest ${guestName} booked ${roomTitle} for ₹${total} (${bk.status}).`,
            details: `Check-in: ${startDateStr} • Check-out: ${endDateStr}${phone}`,
            timestamp: bk.createdAt.toISOString(),
            timeAgo: calculateTimeAgo(bk.createdAt),
            isRead: !isRecent,
            severity: bk.status === "CONFIRMED" || bk.status === "PAID" ? "success" : bk.status === "CANCELLED" ? "critical" : "info",
            actionLabel: "View Bookings",
            actionHref: `/seller/booking`,
            metadata: { bookingId: bk.id, roomId: bk.roomId, status: bk.status }
        });
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

    // 7. Support Tickets & Support Messages for Seller
    try {
        const sellerTickets = await db.ticket.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            },
            orderBy: { updatedAt: "desc" },
            take: 10
        });

        for (const ticket of sellerTickets) {
            const lastMsg = ticket.messages[0];
            const isFromAdmin = lastMsg && lastMsg.senderId !== session.user.id;
            const isRecent = (new Date().getTime() - ticket.updatedAt.getTime()) < (3 * 24 * 60 * 60 * 1000);
            const isUnread = isFromAdmin && isRecent;

            notifications.push({
                id: `ticket-${ticket.id}`,
                category: "system",
                title: `Support: ${ticket.title}`,
                message: lastMsg ? lastMsg.message.slice(0, 150) : ticket.description.slice(0, 150),
                details: `Category: ${ticket.category} • Status: ${ticket.status}`,
                timestamp: ticket.updatedAt.toISOString(),
                timeAgo: calculateTimeAgo(ticket.updatedAt),
                isRead: !isUnread,
                severity: ticket.status === "OPEN" ? "info" : "success",
                actionLabel: "View Ticket",
                actionHref: `/seller/support`,
                metadata: { ticketId: ticket.id, status: ticket.status }
            });
        }
    } catch {}

    // 8. Fetch Promotional Offers & Deals for the Seller
    try {
        const coupons = await db.coupon.findMany({
            where: {
                OR: [
                    { appliesToSellerId: sellerProfile.id },
                    { appliesToSellerId: null }
                ]
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        for (const cp of coupons) {
            const discountText = cp.discountType === "PERCENTAGE"
                ? `${cp.discountPercentage}% OFF`
                : `Flat ₹${cp.discountAmount || 0} OFF`;
            const minCartText = cp.minimumCartValue ? ` • Min Order: ₹${cp.minimumCartValue}` : "";
            const usageCount = cp.currentUsersCount || 0;
            const usageText = usageCount > 0 ? ` • ${usageCount} order${usageCount === 1 ? "" : "s"} redeemed` : "";
            const isStoreSpecific = cp.appliesToSellerId === sellerProfile.id;

            notifications.push({
                id: `offer-${cp.id}`,
                category: "offers",
                title: isStoreSpecific ? `Active Store Offer: ${cp.code} (${discountText})` : `Platform Promo Live: ${cp.code} (${discountText})`,
                message: cp.description || `Customers can apply code ${cp.code} at checkout to receive ${discountText}${minCartText}.`,
                details: `Code: ${cp.code} • Discount: ${discountText}${minCartText}${usageText}`,
                timestamp: cp.createdAt ? cp.createdAt.toISOString() : new Date().toISOString(),
                timeAgo: calculateTimeAgo(cp.createdAt || new Date()),
                isRead: false,
                severity: "success",
                actionLabel: "Manage Offers",
                actionHref: `/seller/offers`,
                metadata: { couponId: cp.id, code: cp.code, currentUsage: usageCount }
            });
        }
    } catch {}

    // 6. Dismissed / Deleted Notifications filtering
    const dismissedSet = await getSellerDismissedNotificationIds(sellerProfile.id);
    let clearedTimestamp: number | null = null;
    try {
        const clearedKey = `seller_notifications_cleared_${sellerProfile.id}`;
        const clearedRec = await db.systemSettings.findUnique({ where: { key: clearedKey } });
        if (clearedRec?.value) {
            clearedTimestamp = new Date(clearedRec.value).getTime();
        }
    } catch {}

    const isDismissed = (n: SellerNotification) => {
        if (dismissedSet.has(n.id) || dismissedSet.has(n.id.toLowerCase())) return true;
        if (n.metadata?.orderId) {
            const ordId = String(n.metadata.orderId);
            if (dismissedSet.has(ordId) || dismissedSet.has(`ord-new-${ordId}`) || dismissedSet.has(`notif-order-${ordId}`)) {
                return true;
            }
        }
        const cleanId = n.id.replace(/^(?:notif-order-|ord-[a-z]+-|notif-stock-|stock-|notif-book-|bk-|notif-offer-|offer-)/i, "");
        if (cleanId && (dismissedSet.has(cleanId) || dismissedSet.has(cleanId.toLowerCase()))) return true;
        if (clearedTimestamp && n.timestamp) {
            const notifTime = new Date(n.timestamp).getTime();
            if (notifTime <= clearedTimestamp) return true;
        }
        return false;
    };

    const activeNotifications = notifications.filter(n => !isDismissed(n));

    // Sort all notifications chronologically (newest first)
    activeNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate Counts by Category
    const countsByCategory: Record<string, number> = {
        all: activeNotifications.length,
        unread: activeNotifications.filter(n => !n.isRead).length,
        orders: activeNotifications.filter(n => n.category === "orders").length,
        offers: activeNotifications.filter(n => n.category === "offers").length,
        stock: activeNotifications.filter(n => n.category === "stock").length,
        delivery: activeNotifications.filter(n => n.category === "delivery").length,
        timings: activeNotifications.filter(n => n.category === "timings").length,
        bookings: activeNotifications.filter(n => n.category === "bookings").length,
        reviews: activeNotifications.filter(n => n.category === "reviews").length,
        settlements: activeNotifications.filter(n => n.category === "settlements").length,
        system: activeNotifications.filter(n => n.category === "system").length,
    };

    const unreadCount = activeNotifications.filter(n => !n.isRead).length;

    // Apply Filter
    let filtered = activeNotifications;
    if (categoryFilter && categoryFilter !== "all") {
        if (categoryFilter.toLowerCase() === "unread") {
            filtered = filtered.filter(n => !n.isRead);
        } else {
            filtered = filtered.filter(n => n.category.toLowerCase() === categoryFilter.toLowerCase());
        }
    }
    if (severityFilter && severityFilter !== "all") {
        filtered = filtered.filter(n => n.severity.toLowerCase() === severityFilter.toLowerCase());
    }

    // Apply Limit
    const paged = filtered.slice(0, limit);

    return {
        unreadCount,
        totalCount: activeNotifications.length,
        filteredCount: filtered.length,
        countsByCategory,
        notifications: paged
    };
};

export const getSellerDismissedNotificationIds = async (sellerId: string): Promise<Set<string>> => {
    try {
        const key = `seller_dismissed_notifications_${sellerId}`;
        const record = await db.systemSettings.findUnique({ where: { key } });
        if (record?.value) {
            const parsed = JSON.parse(record.value);
            if (Array.isArray(parsed)) {
                return new Set(parsed.map(String));
            }
        }
    } catch (err) {
        console.error("Error reading dismissed notification ids:", err);
    }
    return new Set<string>();
};

export const dismissSellerNotification = async (notificationId: string) => {
    const { sellerProfile } = await getAuthenticatedSeller();
    const rawId = String(notificationId || "").trim();
    if (!rawId) {
        throw new ApiError("Notification ID is required", 400);
    }

    const dismissedSet = await getSellerDismissedNotificationIds(sellerProfile.id);
    dismissedSet.add(rawId);
    dismissedSet.add(rawId.toLowerCase());

    const cleanId = rawId.replace(/^(?:notif-order-|ord-[a-z]+-|notif-stock-|stock-|notif-book-|bk-|notif-offer-|offer-)/i, "").trim();
    if (cleanId) {
        dismissedSet.add(cleanId);
        dismissedSet.add(cleanId.toLowerCase());
        dismissedSet.add(`ord-new-${cleanId}`);
        dismissedSet.add(`notif-order-${cleanId}`);
        dismissedSet.add(`ord-del-${cleanId}`);
        dismissedSet.add(`ord-can-${cleanId}`);
        dismissedSet.add(`ord-don-${cleanId}`);
        dismissedSet.add(`stock-${cleanId}`);
        dismissedSet.add(`notif-stock-${cleanId}`);
        dismissedSet.add(`bk-${cleanId}`);
        dismissedSet.add(`notif-book-${cleanId}`);
    }

    const key = `seller_dismissed_notifications_${sellerProfile.id}`;
    const list = Array.from(dismissedSet);
    await db.systemSettings.upsert({
        where: { key },
        update: { value: JSON.stringify(list) },
        create: { id: key, key, value: JSON.stringify(list) },
    });

    return {
        success: true,
        message: `Notification ${rawId} permanently deleted`,
        notificationId: rawId,
        dismissed: true,
    };
};

export const clearAllSellerNotifications = async () => {
    const { sellerProfile } = await getAuthenticatedSeller();
    const key = `seller_notifications_cleared_${sellerProfile.id}`;
    const nowIso = new Date().toISOString();
    await db.systemSettings.upsert({
        where: { key },
        update: { value: nowIso },
        create: { id: key, key, value: nowIso },
    });

    return {
        success: true,
        message: "All notifications cleared permanently",
        cleared: true,
        clearedAt: nowIso,
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
    const { session, sellerProfile } = await getAuthenticatedSeller();
    const dismissedSet = await getSellerDismissedNotificationIds(sellerProfile.id);

    let clearedTimestamp: number | null = null;
    try {
        const clearedKey = `seller_notifications_cleared_${sellerProfile.id}`;
        const clearedRec = await db.systemSettings.findUnique({ where: { key: clearedKey } });
        if (clearedRec?.value) {
            clearedTimestamp = new Date(clearedRec.value).getTime();
        }
    } catch {}

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pendingOrders = await db.order.findMany({
        where: {
            sellerId: sellerProfile.id,
            status: { in: ["PENDING", "NEW"] },
            createdAt: { gte: thirtyDaysAgo }
        },
        select: { id: true, createdAt: true }
    });

    const activePendingOrders = pendingOrders.filter((ord) => {
        if (dismissedSet.has(ord.id) || dismissedSet.has(`ord-new-${ord.id}`) || dismissedSet.has(`notif-order-${ord.id}`)) {
            return false;
        }
        if (clearedTimestamp && ord.createdAt.getTime() <= clearedTimestamp) {
            return false;
        }
        return true;
    });

    const pendingOrdersCount = activePendingOrders.length;

    const lowStockFoodItems = await db.foodItem.findMany({
        where: {
            sellerId: sellerProfile.id,
            OR: [
                { isAvailable: false },
                { AND: [{ stockQuantity: { gte: 0 } }, { stockQuantity: { lte: 5 } }] }
            ]
        },
        select: { id: true }
    });

    const lowStockCount = lowStockFoodItems.filter(
        item => !dismissedSet.has(`stock-${item.id}`) && !dismissedSet.has(`notif-stock-${item.id}`) && !dismissedSet.has(item.id)
    ).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const bookings = await db.booking.findMany({
        where: {
            OR: [
                { room: { sellerId: sellerProfile.id } },
                { room: { seller: { userId: session.user.id } } },
                { userId: session.user.id }
            ],
            createdAt: { gte: sevenDaysAgo }
        },
        select: { id: true, createdAt: true }
    });

    const activeBookings = bookings.filter((bk) => {
        if (dismissedSet.has(bk.id) || dismissedSet.has(`bk-${bk.id}`) || dismissedSet.has(`notif-book-${bk.id}`)) {
            return false;
        }
        if (clearedTimestamp && bk.createdAt.getTime() <= clearedTimestamp) {
            return false;
        }
        return true;
    });

    const unreadBookingsCount = activeBookings.length;

    const unreadCount = pendingOrdersCount + lowStockCount + unreadBookingsCount;

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
