import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { getNowInIST, getMealDeliveryTimingStatus, getMealDeliveryOtp } from "@/lib/meal-delivery-otp";
import { getMealSlotDetails, normalizeMealSlotIds, normalizeMealSlotId, extractTimeRangeString } from "@/lib/meal-slots";

export type CustomerNotificationCategory =
    | "all"
    | "orders"
    | "subscriptions"
    | "bookings"
    | "offers"
    | "support"
    | "system";

export type CustomerNotificationSeverity = "critical" | "warning" | "info" | "success";

export interface CustomerNotification {
    id: string;
    category: CustomerNotificationCategory;
    title: string;
    message: string;
    details?: string;
    timestamp: string;
    timeAgo: string;
    isRead: boolean;
    severity: CustomerNotificationSeverity;
    actionLabel?: string;
    actionHref?: string;
    metadata?: Record<string, any>;
}

export interface CustomerNotificationPreferences {
    orderUpdates: boolean;
    promoOffers: boolean;
    newMenu: boolean;
    deliveryAlerts: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
}

export const DEFAULT_CUSTOMER_PREFERENCES: CustomerNotificationPreferences = {
    orderUpdates: true,
    promoOffers: true,
    newMenu: true,
    deliveryAlerts: true,
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
};

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

export const getAuthenticatedUser = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to access customer notifications.", 401);
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) {
        throw new ApiError("Customer account not found.", 404);
    }

    return { session, user };
};

export const getUserReadNotificationIds = async (userId: string): Promise<Set<string>> => {
    try {
        const key = `user_read_notifications_${userId}`;
        const record = await db.systemSettings.findUnique({ where: { key } });
        if (record?.value) {
            const parsed = JSON.parse(record.value);
            if (Array.isArray(parsed)) {
                return new Set(parsed.map(String));
            }
        }
    } catch (err) {
        console.error("Error reading user read notification ids:", err);
    }
    return new Set<string>();
};

export const getUserDismissedNotificationIds = async (userId: string): Promise<Set<string>> => {
    try {
        const key = `user_dismissed_notifications_${userId}`;
        const record = await db.systemSettings.findUnique({ where: { key } });
        if (record?.value) {
            const parsed = JSON.parse(record.value);
            if (Array.isArray(parsed)) {
                return new Set(parsed.map(String));
            }
        }
    } catch (err) {
        console.error("Error reading user dismissed notification ids:", err);
    }
    return new Set<string>();
};

export const getUserNotificationPreferences = async (): Promise<CustomerNotificationPreferences> => {
    const { user } = await getAuthenticatedUser();
    try {
        const key = `user_notification_preferences_${user.id}`;
        const record = await db.systemSettings.findUnique({ where: { key } });
        if (record?.value) {
            const parsed = JSON.parse(record.value);
            return { ...DEFAULT_CUSTOMER_PREFERENCES, ...parsed };
        }
    } catch (err) {
        console.error("Error loading customer notification preferences:", err);
    }
    return { ...DEFAULT_CUSTOMER_PREFERENCES };
};

export const updateUserNotificationPreferences = async (req: Request) => {
    const { user } = await getAuthenticatedUser();
    const body = await req.json();

    const current = await getUserNotificationPreferences();
    const merged: CustomerNotificationPreferences = {
        ...current,
        ...(typeof body.orderUpdates === "boolean" ? { orderUpdates: body.orderUpdates } : {}),
        ...(typeof body.promoOffers === "boolean" ? { promoOffers: body.promoOffers } : {}),
        ...(typeof body.newMenu === "boolean" ? { newMenu: body.newMenu } : {}),
        ...(typeof body.deliveryAlerts === "boolean" ? { deliveryAlerts: body.deliveryAlerts } : {}),
        ...(typeof body.pushEnabled === "boolean" ? { pushEnabled: body.pushEnabled } : {}),
        ...(typeof body.emailEnabled === "boolean" ? { emailEnabled: body.emailEnabled } : {}),
        ...(typeof body.smsEnabled === "boolean" ? { smsEnabled: body.smsEnabled } : {}),
    };

    const key = `user_notification_preferences_${user.id}`;
    await db.systemSettings.upsert({
        where: { key },
        create: { id: key, key, value: JSON.stringify(merged) },
        update: { value: JSON.stringify(merged) },
    });

    return {
        success: true,
        message: "Customer notification preferences updated successfully",
        preferences: merged,
    };
};

export const getUserNotifications = async (req: Request) => {
    const { user } = await getAuthenticatedUser();
    const url = new URL(req.url);
    const categoryFilter = url.searchParams.get("category") || "all";
    const severityFilter = url.searchParams.get("severity");
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const [readSet, dismissedSet, prefs] = await Promise.all([
        getUserReadNotificationIds(user.id),
        getUserDismissedNotificationIds(user.id),
        getUserNotificationPreferences(),
    ]);

    // Check cleared timestamp
    let clearedAt: Date | null = null;
    const clearedRecord = await db.systemSettings.findUnique({
        where: { key: `user_notifications_cleared_${user.id}` },
    });
    if (clearedRecord?.value) {
        clearedAt = new Date(clearedRecord.value);
    }

    const notifications: CustomerNotification[] = [];

    // 1. Fetch Recent Orders (last 30 days)
    if (prefs.orderUpdates || prefs.deliveryAlerts) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orders = await db.order.findMany({
            where: {
                userId: user.id,
                createdAt: { gte: thirtyDaysAgo },
            },
            include: {
                seller: { select: { id: true, businessName: true } },
                deliveryPerson: { select: { id: true, name: true, phone: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 25,
        });

        for (const ord of orders) {
            const ordShort = ord.id.slice(-6).toUpperCase();
            let parsedItems: any[] = [];
            try {
                parsedItems = typeof ord.items === "string" ? JSON.parse(ord.items) : ord.items;
            } catch {}
            const itemsCount = Array.isArray(parsedItems) ? parsedItems.length : 1;
            const sellerName = ord.seller?.businessName || "Kitchen";

            const notifId = `user-ord-${ord.id}-${ord.status.toLowerCase()}`;
            const time = ord.updatedAt || ord.createdAt;

            if (clearedAt && time < clearedAt) continue;
            if (dismissedSet.has(notifId) || dismissedSet.has(ord.id)) continue;

            let title = `Order #${ordShort}`;
            let message = `Order with ${sellerName} is currently ${ord.status.toLowerCase()}.`;
            let severity: CustomerNotificationSeverity = "info";

            if (ord.status === "PENDING") {
                title = `Order Placed - #${ordShort}`;
                message = `Your order of ${itemsCount} items with ${sellerName} has been placed for ₹${ord.totalAmount}. Waiting for kitchen confirmation.`;
                severity = "info";
            } else if (ord.status === "CONFIRMED" || ord.status === "PREPARING") {
                title = `Food is Being Prepared! - #${ordShort}`;
                message = `${sellerName} is preparing your delicious order. It will be on its way shortly.`;
                severity = "info";
            } else if (ord.status === "OUT_FOR_DELIVERY") {
                title = `Out for Delivery! - #${ordShort}`;
                const riderText = ord.deliveryPerson?.name ? ` by ${ord.deliveryPerson.name}` : "";
                message = `Your order #${ordShort} is out for delivery${riderText}. Keep your phone handy!`;
                severity = "warning";
            } else if (ord.status === "DELIVERED") {
                title = `Order Delivered! - #${ordShort}`;
                message = `Your meal from ${sellerName} was delivered successfully. Enjoy your food!`;
                severity = "success";
            } else if (ord.status === "CANCELLED") {
                title = `Order Cancelled - #${ordShort}`;
                const reason = (ord as any).cancellationReason;
                message = `Your order #${ordShort} was cancelled.${reason ? ` Reason: ${reason}` : ""}`;
                severity = "critical";
            }

            notifications.push({
                id: notifId,
                category: "orders",
                title,
                message,
                details: `Total: ₹${ord.totalAmount} • Payment: ${ord.paymentMethod || "Online"} (${(ord as any).paymentStatus || "PAID"})`,
                timestamp: time.toISOString(),
                timeAgo: calculateTimeAgo(time),
                isRead: readSet.has(notifId),
                severity,
                actionLabel: "View Order",
                actionHref: `/orders`,
                metadata: {
                    orderId: ord.id,
                    orderShort: ordShort,
                    status: ord.status,
                    totalAmount: ord.totalAmount,
                    sellerName,
                },
            });
        }
    }

    // 2. Fetch Meal Subscriptions & Delivery OTP Alerts
    if (prefs.orderUpdates || prefs.deliveryAlerts) {
        const { dateStr: todayDateStr } = getNowInIST();

        const subscriptions = await db.userMealSubscription.findMany({
            where: { userId: user.id },
            include: {
                plan: {
                    select: {
                        id: true,
                        name: true,
                        tier: true,
                        mealTimings: true,
                        slots: { select: { slotId: true, slot: true } },
                    },
                },
                seller: { select: { id: true, businessName: true } },
                slots: { select: { slotId: true, slot: true } },
            },
            orderBy: { updatedAt: "desc" },
            take: 10,
        });

        // Fetch seller custom timings if any
        const sellerIds = Array.from(new Set(subscriptions.map((s) => s.sellerId).filter(Boolean)));
        const sellerSettings = await db.systemSettings.findMany({
            where: {
                key: {
                    in: [
                        "MEAL_SUBSCRIPTION_SLOTS",
                        ...sellerIds.map((sid) => `SELLER_MEAL_TIMINGS_${sid}`),
                    ],
                },
            },
        });

        const platformTimesSetting = sellerSettings.find((s) => s.key === "MEAL_SUBSCRIPTION_SLOTS");
        let basePlatformTimes: Record<string, string> = {};
        if (platformTimesSetting?.value) {
            try { basePlatformTimes = JSON.parse(platformTimesSetting.value); } catch {}
        }
        const sellerTimesMap: Record<string, Record<string, string>> = {};
        for (const sid of sellerIds) {
            const st = sellerSettings.find((s) => s.key === `SELLER_MEAL_TIMINGS_${sid}`);
            let stTimes: Record<string, string> = {};
            if (st?.value) {
                try { stTimes = JSON.parse(st.value); } catch {}
            }
            sellerTimesMap[sid] = { ...basePlatformTimes, ...stTimes };
        }

        // Fetch today's deliveries for user
        const todayDeliveries = await db.mealSubscriptionDelivery.findMany({
            where: {
                userId: user.id,
                scheduledDate: todayDateStr,
            },
            include: {
                slot: { select: { name: true, defaultTimeRange: true } },
                subscription: {
                    select: {
                        seller: { select: { businessName: true } },
                    },
                },
            },
            orderBy: { scheduledDate: "desc" },
            take: 25,
        });

        for (const sub of subscriptions) {
            const planName = sub.plan?.name || "Meal Plan";
            const sellerName = sub.seller?.businessName || "Kitchen Partner";
            const time = sub.updatedAt || sub.createdAt;

            if (clearedAt && time < clearedAt) continue;

            const subNotifId = `user-sub-${sub.id}-${sub.status.toLowerCase()}-${sub.isPaused ? "paused" : "active"}`;
            if (!dismissedSet.has(subNotifId) && !dismissedSet.has(sub.id)) {
                let title = `Meal Subscription: ${planName}`;
                let message = `Your subscription with ${sellerName} is active.`;
                let severity: CustomerNotificationSeverity = "success";

                if (sub.isPaused) {
                    title = `Meal Subscription Paused`;
                    message = `Your ${planName} subscription is paused.${sub.pauseEndDate ? ` Scheduled to resume on ${new Date(sub.pauseEndDate).toLocaleDateString("en-IN")}.` : ""}`;
                    severity = "warning";
                } else if (sub.status === "ACTIVE") {
                    title = `Subscription Active - ${planName}`;
                    message = `Your meal subscription with ${sellerName} is running smoothly.`;
                    severity = "success";
                } else if (sub.status === "EXPIRED") {
                    title = `Subscription Expired - ${planName}`;
                    message = `Your subscription cycle ended. Renew now to avoid missing meals!`;
                    severity = "warning";
                }

                notifications.push({
                    id: subNotifId,
                    category: "subscriptions",
                    title,
                    message,
                    details: `Cycle: ${sub.cycle || "Weekly"} • Slots: ${sub.slots.length} included`,
                    timestamp: time.toISOString(),
                    timeAgo: calculateTimeAgo(time),
                    isRead: readSet.has(subNotifId),
                    severity,
                    actionLabel: "Manage Subscription",
                    actionHref: `/my-subscription`,
                    metadata: {
                        subscriptionId: sub.id,
                        planName,
                        isPaused: sub.isPaused,
                        status: sub.status,
                    },
                });
            }

            // Generate Slot Delivery OTP & Delayed Alerts for Active Subscriptions
            const isSubActiveToday = sub.status === "ACTIVE" && !sub.isPaused;
            if (isSubActiveToday) {
                const sellerTimes = (sub.sellerId ? sellerTimesMap[sub.sellerId] : null) || basePlatformTimes;
                let planTimings: string[] = [];
                try {
                    planTimings = typeof sub.plan?.mealTimings === "string"
                        ? JSON.parse(sub.plan.mealTimings)
                        : (Array.isArray(sub.plan?.mealTimings) ? sub.plan.mealTimings : []);
                } catch {
                    planTimings = [];
                }
                const rawSlots = sub.slots && sub.slots.length > 0
                    ? sub.slots.map((s) => s.slotId)
                    : (sub.plan?.slots && sub.plan.slots.length > 0
                        ? sub.plan.slots.map((s) => s.slotId)
                        : planTimings);
                const resolvedSlotIds = normalizeMealSlotIds(rawSlots);

                for (const slotId of resolvedSlotIds) {
                    const normSlot = normalizeMealSlotId(slotId) || "breakfast";
                    const slotDef = getMealSlotDetails(normSlot);
                    const dbSlot = sub.slots?.find((s) => s.slotId === slotId)?.slot || sub.plan?.slots?.find((s) => s.slotId === slotId)?.slot;
                    const customTime = (
                        sellerTimes[normSlot] ||
                        sellerTimes[normSlot.replace(/-/g, '_')] ||
                        sellerTimes[normSlot.replace(/_/g, '-')] ||
                        extractTimeRangeString(dbSlot?.defaultTimeRange) ||
                        ""
                    ).trim();

                    const existingDelivery = todayDeliveries.find(
                        (d) => d.subscriptionId === sub.id && (d.slotId === normSlot || normalizeMealSlotId(d.slotId) === normSlot)
                    );
                    const deliveryStatus = existingDelivery?.status || "PENDING";

                    // If not delivered yet, check timing and produce OTP alert if window has started
                    if (deliveryStatus !== "DELIVERED" && deliveryStatus !== "SKIPPED_PAUSED") {
                        const timing = getMealDeliveryTimingStatus(todayDateStr, customTime, slotDef, deliveryStatus);
                        if (timing.isOtpActive) {
                            const otp = getMealDeliveryOtp(sub.id, todayDateStr, normSlot);

                            if (timing.isOverdue) {
                                const notifId = `user-del-otp-${sub.id}-${todayDateStr}-${normSlot}-overdue`;
                                if (!dismissedSet.has(notifId)) {
                                    notifications.push({
                                        id: notifId,
                                        category: "subscriptions",
                                        title: `⚠️ ${slotDef.name} Delayed — Delivery OTP: ${otp}`,
                                        message: `Your ${slotDef.name} delivery time has passed (${timing.window.endFormatted}). Once your food arrives, share OTP ${otp} with your delivery partner to confirm late delivery.`,
                                        details: `Kitchen: ${sellerName} • Scheduled: ${timing.window.startFormatted} – ${timing.window.endFormatted}`,
                                        timestamp: new Date().toISOString(),
                                        timeAgo: calculateTimeAgo(new Date()),
                                        isRead: readSet.has(notifId),
                                        severity: "warning",
                                        actionLabel: "View OTP",
                                        actionHref: `/my-subscription`,
                                        metadata: {
                                            subscriptionId: sub.id,
                                            slotId: normSlot,
                                            otp,
                                            isOverdue: true,
                                            overdueMinutes: timing.overdueMinutes,
                                            status: "OVERDUE",
                                        },
                                    });
                                }
                            } else {
                                const notifId = `user-del-otp-${sub.id}-${todayDateStr}-${normSlot}-window`;
                                if (!dismissedSet.has(notifId)) {
                                    notifications.push({
                                        id: notifId,
                                        category: "subscriptions",
                                        title: `🔑 ${slotDef.name} Delivery OTP: ${otp}`,
                                        message: `Your ${slotDef.name} delivery window has started (${timing.window.startFormatted} – ${timing.window.endFormatted}). Share OTP ${otp} with your delivery partner to receive your meal.`,
                                        details: `Kitchen: ${sellerName} • Delivery Window: ${timing.window.startFormatted} – ${timing.window.endFormatted}`,
                                        timestamp: new Date().toISOString(),
                                        timeAgo: calculateTimeAgo(new Date()),
                                        isRead: readSet.has(notifId),
                                        severity: "info",
                                        actionLabel: "View OTP",
                                        actionHref: `/my-subscription`,
                                        metadata: {
                                            subscriptionId: sub.id,
                                            slotId: normSlot,
                                            otp,
                                            isOverdue: false,
                                            status: "IN_WINDOW",
                                        },
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Process Delivered Meal Records for Today
        for (const del of todayDeliveries) {
            const slotName = del.slot?.name || getMealSlotDetails(del.slotId).name;
            const notifId = `user-del-${del.id}-${del.status.toLowerCase()}`;

            if (clearedAt && del.updatedAt < clearedAt) continue;
            if (dismissedSet.has(notifId)) continue;

            if (del.status === "DELIVERED") {
                notifications.push({
                    id: notifId,
                    category: "subscriptions",
                    title: `✅ ${slotName} Delivered!`,
                    message: `Your ${slotName} meal delivery from ${del.subscription?.seller?.businessName || "Kitchen Partner"} was delivered successfully.`,
                    details: del.deliveredAt ? `Delivered at ${new Date(del.deliveredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : undefined,
                    timestamp: (del.deliveredAt || del.updatedAt).toISOString(),
                    timeAgo: calculateTimeAgo(del.deliveredAt || del.updatedAt),
                    isRead: readSet.has(notifId),
                    severity: "success",
                    actionLabel: "View Subscription",
                    actionHref: `/my-subscription`,
                    metadata: {
                        deliveryId: del.id,
                        slotId: del.slotId,
                        status: del.status,
                        date: del.scheduledDate,
                    },
                });
            } else if (del.status === "SKIPPED_PAUSED") {
                notifications.push({
                    id: notifId,
                    category: "subscriptions",
                    title: `${slotName} Skipped (Paused)`,
                    message: `Meal was skipped according to your active pause schedule.`,
                    timestamp: del.updatedAt.toISOString(),
                    timeAgo: calculateTimeAgo(del.updatedAt),
                    isRead: readSet.has(notifId),
                    severity: "info",
                    actionLabel: "View Subscription",
                    actionHref: `/my-subscription`,
                    metadata: {
                        deliveryId: del.id,
                        slotId: del.slotId,
                        status: del.status,
                        date: del.scheduledDate,
                    },
                });
            }
        }
    }

    // 4. Room Bookings
    const bookings = await db.booking.findMany({
        where: { userId: user.id },
        include: { room: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    for (const bk of bookings) {
        const roomName = bk.room?.title || "Room";
        const notifId = `user-bk-${bk.id}-${bk.status.toLowerCase()}`;
        const time = (bk as any).updatedAt || bk.createdAt;

        if (clearedAt && time < clearedAt) continue;
        if (dismissedSet.has(notifId) || dismissedSet.has(bk.id)) continue;

        let title = `Room Booking: ${roomName}`;
        let message = `Status: ${bk.status}`;
        let severity: CustomerNotificationSeverity = "info";

        if (bk.status === "CONFIRMED") {
            title = `Booking Confirmed - ${roomName}`;
            message = `Your stay is confirmed from ${new Date(bk.startDate).toLocaleDateString("en-IN")} to ${new Date(bk.endDate).toLocaleDateString("en-IN")}.`;
            severity = "success";
        } else if (bk.status === "CANCELLED") {
            title = `Booking Cancelled - ${roomName}`;
            message = `Your booking was cancelled.`;
            severity = "warning";
        }

        notifications.push({
            id: notifId,
            category: "bookings",
            title,
            message,
            timestamp: time.toISOString(),
            timeAgo: calculateTimeAgo(time),
            isRead: readSet.has(notifId),
            severity,
            actionLabel: "View Bookings",
            actionHref: `/dashboard/user/bookings`,
            metadata: {
                bookingId: bk.id,
                roomName,
                status: bk.status,
            },
        });
    }

    // 5. Promotional Offers & Coupons
    if (prefs.promoOffers) {
        const coupons = await db.coupon.findMany({
            where: {
                isActive: true,
                validUntil: { gte: new Date() },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
        });

        for (const c of coupons) {
            const notifId = `user-promo-${c.code.toLowerCase()}`;
            if (dismissedSet.has(notifId)) continue;

            const discountText =
                c.discountType === "PERCENTAGE"
                    ? `${c.discountPercentage || 0}% OFF`
                    : `₹${c.discountAmount || 0} FLAT OFF`;

            notifications.push({
                id: notifId,
                category: "offers",
                title: `Special Discount: Use ${c.code}`,
                message: `Get ${discountText} on your next order! Minimum order ₹${c.minimumCartValue || 0}.`,
                timestamp: c.createdAt.toISOString(),
                timeAgo: calculateTimeAgo(c.createdAt),
                isRead: readSet.has(notifId),
                severity: "info",
                actionLabel: "Order Now",
                actionHref: `/explore`,
                metadata: {
                    couponCode: c.code,
                    discountValue: c.discountPercentage || c.discountAmount || 0,
                    discountType: c.discountType,
                },
            });
        }
    }

    // Sort by timestamp descending
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Category Counts
    const countsByCategory: Record<string, number> = {
        all: notifications.length,
        orders: 0,
        subscriptions: 0,
        bookings: 0,
        offers: 0,
        support: 0,
        system: 0,
    };

    let unreadCount = 0;
    for (const n of notifications) {
        if (!n.isRead) unreadCount++;
        if (countsByCategory[n.category] !== undefined) {
            countsByCategory[n.category]++;
        }
    }

    // Filtering
    let filtered = notifications;
    if (unreadOnly) {
        filtered = filtered.filter((n) => !n.isRead);
    } else if (categoryFilter && categoryFilter.toLowerCase() !== "all") {
        if (categoryFilter.toLowerCase() === "unread") {
            filtered = filtered.filter((n) => !n.isRead);
        } else {
            filtered = filtered.filter((n) => n.category.toLowerCase() === categoryFilter.toLowerCase());
        }
    }

    if (severityFilter && severityFilter.toLowerCase() !== "all") {
        filtered = filtered.filter((n) => n.severity.toLowerCase() === severityFilter.toLowerCase());
    }

    const paged = filtered.slice(0, limit);

    return {
        unreadCount,
        totalCount: notifications.length,
        filteredCount: filtered.length,
        countsByCategory,
        notifications: paged,
    };
};

export const markUserNotificationRead = async (notificationId: string, isRead = true) => {
    const { user } = await getAuthenticatedUser();
    const rawId = String(notificationId || "").trim();
    if (!rawId) {
        throw new ApiError("Notification ID is required", 400);
    }

    const readSet = await getUserReadNotificationIds(user.id);
    if (isRead) {
        readSet.add(rawId);
    } else {
        readSet.delete(rawId);
    }

    const key = `user_read_notifications_${user.id}`;
    const list = Array.from(readSet);
    await db.systemSettings.upsert({
        where: { key },
        update: { value: JSON.stringify(list) },
        create: { id: key, key, value: JSON.stringify(list) },
    });

    return {
        success: true,
        message: `Notification marked as ${isRead ? "read" : "unread"}`,
        notificationId: rawId,
        isRead,
    };
};

export const markAllUserNotificationsRead = async () => {
    const { user } = await getAuthenticatedUser();
    const result = await getUserNotifications(new Request("http://localhost/api/user/notifications?limit=200"));
    const allIds = result.notifications.map((n) => n.id);

    const readSet = await getUserReadNotificationIds(user.id);
    allIds.forEach((id) => readSet.add(id));

    const key = `user_read_notifications_${user.id}`;
    const list = Array.from(readSet);
    await db.systemSettings.upsert({
        where: { key },
        update: { value: JSON.stringify(list) },
        create: { id: key, key, value: JSON.stringify(list) },
    });

    return {
        success: true,
        message: "All customer notifications marked as read",
        count: allIds.length,
    };
};

export const dismissUserNotification = async (notificationId: string) => {
    const { user } = await getAuthenticatedUser();
    const rawId = String(notificationId || "").trim();
    if (!rawId) {
        throw new ApiError("Notification ID is required", 400);
    }

    const dismissedSet = await getUserDismissedNotificationIds(user.id);
    dismissedSet.add(rawId);

    const key = `user_dismissed_notifications_${user.id}`;
    const list = Array.from(dismissedSet);
    await db.systemSettings.upsert({
        where: { key },
        update: { value: JSON.stringify(list) },
        create: { id: key, key, value: JSON.stringify(list) },
    });

    return {
        success: true,
        message: `Notification dismissed successfully`,
        notificationId: rawId,
        dismissed: true,
    };
};

export const clearAllUserNotifications = async () => {
    const { user } = await getAuthenticatedUser();
    const key = `user_notifications_cleared_${user.id}`;
    const nowIso = new Date().toISOString();
    await db.systemSettings.upsert({
        where: { key },
        update: { value: nowIso },
        create: { id: key, key, value: nowIso },
    });

    return {
        success: true,
        message: "All customer notifications cleared permanently",
        cleared: true,
        clearedAt: nowIso,
    };
};
