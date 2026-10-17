import { db } from "@/lib/db";
import {
  sendSellerSubscriptionEndingSoonEmail,
  sendSellerSubscriptionEndedEmail,
  sendUserMealSubscriptionExpiringSoonEmail,
  sendUserMealSubscriptionExpiredEmail,
  sendCouponExpiredEmail,
} from "@/lib/emailService";

/**
 * ==============================================================================
 * 🔔 Subscription & Coupon Automated Email Notification Service
 * ==============================================================================
 * Handles lifecycle reminders and expiry notifications:
 * 1. Seller subscription ending soon (3 days reminder) & ended
 * 2. User meal subscription ending soon (3 days reminder) & ended
 * 3. Seller coupon expiry & performance report (times used, discount saved, sales)
 *
 * Utilizes SystemSettings flags to prevent duplicate emails.
 */

/**
 * Checks for seller subscriptions ending in the next 3 days or already expired.
 */
export async function checkExpiringSellerSubscriptions() {
  const now = new Date();
  const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // 1. Ending Soon (within next 3 days, but not yet expired)
  const endingSoonSubs = await db.subscription.findMany({
    where: {
      status: "ACTIVE",
      validUntil: {
        gte: now,
        lte: threeDaysAhead,
      },
    },
    include: {
      seller: {
        include: {
          user: true,
        },
      },
      plan: true,
    },
  });

  let reminderCount = 0;
  for (const sub of endingSoonSubs) {
    const notifyKey = `NOTIFIED_SELLER_SUB_ENDING_${sub.id}`;
    const alreadyNotified = await db.systemSettings.findUnique({ where: { key: notifyKey } });
    if (alreadyNotified) continue;

    const sellerUser = sub.seller?.user;
    if (!sellerUser?.email) continue;

    const diffMs = new Date(sub.validUntil).getTime() - now.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

    const expiryDateStr = new Date(sub.validUntil).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    await sendSellerSubscriptionEndingSoonEmail({
      sellerName: sellerUser.name,
      sellerEmail: sellerUser.email,
      businessName: sub.seller.businessName,
      planName: sub.plan?.name || "Partner Plan",
      daysRemaining,
      expiryDate: expiryDateStr,
    }).catch((err) => console.error(`Failed to send seller ending soon email for sub ${sub.id}:`, err));

    await db.systemSettings.upsert({
      where: { key: notifyKey },
      create: { key: notifyKey, value: now.toISOString() },
      update: { value: now.toISOString() },
    });
    reminderCount++;
  }

  // 2. Already Expired
  const expiredSubs = await db.subscription.findMany({
    where: {
      validUntil: {
        lt: now,
      },
    },
    include: {
      seller: {
        include: {
          user: true,
        },
      },
      plan: true,
    },
  });

  let expiredCount = 0;
  for (const sub of expiredSubs) {
    const notifyKey = `NOTIFIED_SELLER_SUB_ENDED_${sub.id}`;
    const alreadyNotified = await db.systemSettings.findUnique({ where: { key: notifyKey } });
    if (alreadyNotified) continue;

    const sellerUser = sub.seller?.user;
    if (!sellerUser?.email) continue;

    const expiryDateStr = new Date(sub.validUntil).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    await sendSellerSubscriptionEndedEmail({
      sellerName: sellerUser.name,
      sellerEmail: sellerUser.email,
      businessName: sub.seller.businessName,
      planName: sub.plan?.name || "Partner Plan",
      expiryDate: expiryDateStr,
    }).catch((err) => console.error(`Failed to send seller sub ended email for sub ${sub.id}:`, err));

    // Update status in DB if not already expired
    if (sub.status !== "EXPIRED") {
      await db.subscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
      }).catch(() => {});
    }

    await db.systemSettings.upsert({
      where: { key: notifyKey },
      create: { key: notifyKey, value: now.toISOString() },
      update: { value: now.toISOString() },
    });
    expiredCount++;
  }

  return { reminderCount, expiredCount };
}

/**
 * Checks for user meal subscriptions ending in the next 3 days or already expired.
 */
export async function checkExpiringMealSubscriptions() {
  const now = new Date();
  const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // 1. Ending Soon (within next 3 days)
  const endingSoonMealSubs = await db.userMealSubscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        gte: now,
        lte: threeDaysAhead,
      },
    },
    include: {
      user: true,
      plan: true,
    },
  });

  let reminderCount = 0;
  for (const sub of endingSoonMealSubs) {
    const notifyKey = `NOTIFIED_MEAL_SUB_ENDING_${sub.id}`;
    const alreadyNotified = await db.systemSettings.findUnique({ where: { key: notifyKey } });
    if (alreadyNotified) continue;

    if (!sub.user?.email || !sub.endDate) continue;

    const diffMs = new Date(sub.endDate).getTime() - now.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

    const expiryDateStr = new Date(sub.endDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    await sendUserMealSubscriptionExpiringSoonEmail({
      customerName: sub.user.name || "Subscriber",
      customerEmail: sub.user.email,
      planName: sub.plan?.name || "Meal Plan",
      daysRemaining,
      expiryDate: expiryDateStr,
    }).catch((err) => console.error(`Failed to send meal sub expiring soon email for sub ${sub.id}:`, err));

    await db.systemSettings.upsert({
      where: { key: notifyKey },
      create: { key: notifyKey, value: now.toISOString() },
      update: { value: now.toISOString() },
    });
    reminderCount++;
  }

  // 2. Already Expired
  const expiredMealSubs = await db.userMealSubscription.findMany({
    where: {
      status: { notIn: ["CANCELLED"] },
      endDate: {
        lt: now,
      },
    },
    include: {
      user: true,
      plan: true,
    },
  });

  let expiredCount = 0;
  for (const sub of expiredMealSubs) {
    const notifyKey = `NOTIFIED_MEAL_SUB_ENDED_${sub.id}`;
    const alreadyNotified = await db.systemSettings.findUnique({ where: { key: notifyKey } });
    if (alreadyNotified) continue;

    if (!sub.user?.email || !sub.endDate) continue;

    const expiryDateStr = new Date(sub.endDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    await sendUserMealSubscriptionExpiredEmail({
      customerName: sub.user.name || "Subscriber",
      customerEmail: sub.user.email,
      planName: sub.plan?.name || "Meal Plan",
      expiryDate: expiryDateStr,
    }).catch((err) => console.error(`Failed to send meal sub expired email for sub ${sub.id}:`, err));

    if (sub.status !== "EXPIRED") {
      await db.userMealSubscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED", isPaused: false },
      }).catch(() => {});
    }

    await db.systemSettings.upsert({
      where: { key: notifyKey },
      create: { key: notifyKey, value: now.toISOString() },
      update: { value: now.toISOString() },
    });
    expiredCount++;
  }

  return { reminderCount, expiredCount };
}

/**
 * Sends a coupon expiry performance report to the seller.
 */
export async function sendCouponExpiryReport(couponId: string, reason?: string) {
  const coupon = await db.coupon.findUnique({
    where: { id: couponId },
  });

  if (!coupon || !coupon.appliesToSellerId) return false;

  const notifyKey = `NOTIFIED_COUPON_EXPIRED_${coupon.id}`;
  const alreadyNotified = await db.systemSettings.findUnique({ where: { key: notifyKey } });
  if (alreadyNotified) return false;

  const seller = await db.sellerProfile.findUnique({
    where: { id: coupon.appliesToSellerId },
    include: { user: true },
  });

  if (!seller?.user?.email) return false;

  // Query orders placed with this coupon
  const orders = await db.order.findMany({
    where: {
      OR: [
        { appliedCouponId: coupon.id },
        { appliedCouponId: coupon.code },
      ],
    },
    select: {
      totalAmount: true,
    },
  });

  const usageCount = orders.length > 0 ? orders.length : Math.max(0, coupon.currentUsersCount || 0);
  const totalSalesAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Compute discount amount
  let totalDiscountGiven = 0;
  if (coupon.discountPercentage && coupon.discountPercentage > 0 && orders.length > 0) {
    // totalAmount was (base - discount) -> discount = totalAmount * pct / (100 - pct)
    const pct = coupon.discountPercentage;
    totalDiscountGiven = orders.reduce((sum, o) => {
      const disc = Math.round((o.totalAmount * pct) / Math.max(1, 100 - pct));
      return sum + (coupon.maxDiscountAmount ? Math.min(disc, coupon.maxDiscountAmount) : disc);
    }, 0);
  } else if (coupon.discountAmount && coupon.discountAmount > 0) {
    totalDiscountGiven = usageCount * coupon.discountAmount;
  } else if (orders.length > 0) {
    totalDiscountGiven = Math.round(totalSalesAmount * 0.1); // estimated 10% fallback
  }

  const expiryReason = reason || (coupon.maxUsers && coupon.currentUsersCount >= coupon.maxUsers
    ? `Reached maximum usage limit of ${coupon.maxUsers} users`
    : `Reached validity end date`);

  await sendCouponExpiredEmail({
    sellerName: seller.user.name,
    sellerEmail: seller.user.email,
    couponCode: coupon.code,
    expiryReason,
    usageCount,
    totalDiscountGiven,
    totalSalesAmount,
  }).catch((err) => console.error(`Failed to send coupon report email for coupon ${coupon.code}:`, err));

  await db.systemSettings.upsert({
    where: { key: notifyKey },
    create: { key: notifyKey, value: nowIso() },
    update: { value: nowIso() },
  });

  return true;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Checks for seller coupons that have expired (due to date or usage count) and sends reports.
 */
export async function checkExpiringSellerCoupons() {
  const now = new Date();

  // Find coupons whose validUntil date has passed or currentUsersCount >= maxUsers
  const expiredCoupons = await db.coupon.findMany({
    where: {
      appliesToSellerId: { not: null },
      OR: [
        { validUntil: { lt: now } },
        {
          AND: [
            { maxUsers: { not: null, gt: 0 } },
            // Prisma doesn't support comparing two columns directly in where, so filter in code
          ],
        },
      ],
    },
  });

  let reportCount = 0;
  for (const coupon of expiredCoupons) {
    const isDateExpired = coupon.validUntil && new Date(coupon.validUntil) < now;
    const isLimitReached = coupon.maxUsers && coupon.maxUsers > 0 && (coupon.currentUsersCount || 0) >= coupon.maxUsers;

    if (isDateExpired || isLimitReached) {
      const reason = isLimitReached
        ? `Reached maximum usage limit of ${coupon.maxUsers} uses`
        : `Reached configured expiration date (${new Date(coupon.validUntil!).toLocaleDateString("en-IN")})`;

      const sent = await sendCouponExpiryReport(coupon.id, reason);
      if (sent) {
        reportCount++;
        if (coupon.isActive) {
          await db.coupon.update({
            where: { id: coupon.id },
            data: { isActive: false },
          }).catch(() => {});
        }
      }
    }
  }

  return { reportCount };
}

/**
 * Master runner to execute all automated email checks.
 */
export async function runAllNotificationChecks() {
  const sellerSubs = await checkExpiringSellerSubscriptions();
  const mealSubs = await checkExpiringMealSubscriptions();
  const coupons = await checkExpiringSellerCoupons();

  return {
    success: true,
    sellerSubscriptions: sellerSubs,
    mealSubscriptions: mealSubs,
    coupons,
    timestamp: new Date().toISOString(),
  };
}

// ==============================================================================
// ⏱️ IN-PROCESS SELF-SCHEDULING (NO EXTERNAL CRON REQUIRED)
// ==============================================================================
let lastRunTimestamp = 0;
const THROTTLE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Opportunistically triggers notification checks in the background (fire-and-forget),
 * throttled to at most once per hour. Safe to call on any user/seller request.
 */
export function triggerOpportunisticNotificationChecks() {
  const now = Date.now();
  if (now - lastRunTimestamp < THROTTLE_INTERVAL_MS) {
    return;
  }
  lastRunTimestamp = now;

  // Run asynchronously without blocking the calling request
  setTimeout(() => {
    runAllNotificationChecks().catch((err) => {
      console.error("[AutoNotifications] In-process notification check failed:", err);
    });
  }, 100).unref();
}

// Automatically start background timer when the backend process is running (e.g. via PM2 / node)
if (typeof setInterval !== "undefined") {
  // 1. Initial run 30 seconds after server boot
  setTimeout(() => {
    triggerOpportunisticNotificationChecks();
  }, 30 * 1000).unref();

  // 2. Continuous hourly timer in the Node.js event loop
  setInterval(() => {
    triggerOpportunisticNotificationChecks();
  }, THROTTLE_INTERVAL_MS).unref();
}

