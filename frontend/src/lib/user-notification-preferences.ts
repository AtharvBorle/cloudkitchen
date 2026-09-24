/**
 * Client-side persistent notification preferences storage and synchronization.
 */

export interface NotificationsSummaryPreferences {
  orderUpdates: boolean;
  promoOffers: boolean;
  newMenu: boolean;
  deliveryAlerts: boolean;
}

export const DEFAULT_NOTIFICATIONS_SUMMARY: NotificationsSummaryPreferences = {
  orderUpdates: true,
  promoOffers: false,
  newMenu: true,
  deliveryAlerts: true,
};

const STORAGE_KEY_SUMMARY = "customer_notifications_summary";
const STORAGE_KEY_PUSH = "customer_push_notifications";
const STORAGE_KEY_EMAIL = "customer_email_notifications";
const STORAGE_KEY_SMS = "customer_sms_notifications";

export const NOTIFICATION_PREFERENCES_EVENT = "customer-notifications-updated";

/**
 * Load user's notification summary preferences from localStorage with fallback to defaults.
 */
export function getNotificationsSummaryPreferences(): NotificationsSummaryPreferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_NOTIFICATIONS_SUMMARY };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUMMARY);
    if (!raw) {
      return { ...DEFAULT_NOTIFICATIONS_SUMMARY };
    }
    const parsed = JSON.parse(raw);
    return {
      orderUpdates: typeof parsed.orderUpdates === "boolean" ? parsed.orderUpdates : DEFAULT_NOTIFICATIONS_SUMMARY.orderUpdates,
      promoOffers: typeof parsed.promoOffers === "boolean" ? parsed.promoOffers : DEFAULT_NOTIFICATIONS_SUMMARY.promoOffers,
      newMenu: typeof parsed.newMenu === "boolean" ? parsed.newMenu : DEFAULT_NOTIFICATIONS_SUMMARY.newMenu,
      deliveryAlerts: typeof parsed.deliveryAlerts === "boolean" ? parsed.deliveryAlerts : DEFAULT_NOTIFICATIONS_SUMMARY.deliveryAlerts,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATIONS_SUMMARY };
  }
}

/**
 * Save user's notification summary preferences to localStorage and broadcast change event.
 */
export function saveNotificationsSummaryPreferences(
  prefs: Partial<NotificationsSummaryPreferences>
): NotificationsSummaryPreferences {
  const current = getNotificationsSummaryPreferences();
  const next: NotificationsSummaryPreferences = {
    ...current,
    ...prefs,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_SUMMARY, JSON.stringify(next));

      // Also sync to push notification storage mapping
      const pushMapping: Record<string, boolean> = {
        "order-updates": next.orderUpdates,
        "promotional-offers": next.promoOffers,
        "new-arrivals": next.newMenu,
        "delivery-alerts": next.deliveryAlerts,
      };
      const existingPushRaw = localStorage.getItem(STORAGE_KEY_PUSH);
      const existingPush = existingPushRaw ? JSON.parse(existingPushRaw) : {};
      localStorage.setItem(STORAGE_KEY_PUSH, JSON.stringify({ ...existingPush, ...pushMapping }));

      window.dispatchEvent(
        new CustomEvent(NOTIFICATION_PREFERENCES_EVENT, {
          detail: { type: "summary", data: next },
        })
      );
    } catch (e) {
      console.error("Failed to save notification preferences to localStorage:", e);
    }
  }

  return next;
}

/**
 * Load generic toggle preferences (e.g. push, email, sms).
 */
export function getGenericNotificationPreferences(
  category: "push" | "email" | "sms",
  defaultValues: Record<string, boolean>
): Record<string, boolean> {
  if (typeof window === "undefined") {
    return { ...defaultValues };
  }
  const key =
    category === "push"
      ? STORAGE_KEY_PUSH
      : category === "email"
      ? STORAGE_KEY_EMAIL
      : STORAGE_KEY_SMS;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // If push, check if summary has values
      if (category === "push") {
        const summary = getNotificationsSummaryPreferences();
        return {
          ...defaultValues,
          "order-updates": summary.orderUpdates,
          "promotional-offers": summary.promoOffers,
          "new-arrivals": summary.newMenu,
          "delivery-alerts": summary.deliveryAlerts,
        };
      }
      return { ...defaultValues };
    }
    const parsed = JSON.parse(raw);
    return { ...defaultValues, ...parsed };
  } catch {
    return { ...defaultValues };
  }
}

/**
 * Save generic toggle preferences (e.g. push, email, sms).
 */
export function saveGenericNotificationPreferences(
  category: "push" | "email" | "sms",
  updates: Record<string, boolean>
): Record<string, boolean> {
  const key =
    category === "push"
      ? STORAGE_KEY_PUSH
      : category === "email"
      ? STORAGE_KEY_EMAIL
      : STORAGE_KEY_SMS;

  if (typeof window !== "undefined") {
    try {
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const merged = { ...existing, ...updates };
      localStorage.setItem(key, JSON.stringify(merged));

      // If push, sync back to summary
      if (category === "push") {
        const summaryUpdates: Partial<NotificationsSummaryPreferences> = {};
        if (typeof merged["order-updates"] === "boolean") summaryUpdates.orderUpdates = merged["order-updates"];
        if (typeof merged["promotional-offers"] === "boolean") summaryUpdates.promoOffers = merged["promotional-offers"];
        if (typeof merged["new-arrivals"] === "boolean") summaryUpdates.newMenu = merged["new-arrivals"];
        if (typeof merged["delivery-alerts"] === "boolean") summaryUpdates.deliveryAlerts = merged["delivery-alerts"];

        const currentSummary = getNotificationsSummaryPreferences();
        const nextSummary = { ...currentSummary, ...summaryUpdates };
        localStorage.setItem(STORAGE_KEY_SUMMARY, JSON.stringify(nextSummary));
      }

      window.dispatchEvent(
        new CustomEvent(NOTIFICATION_PREFERENCES_EVENT, {
          detail: { type: category, data: merged },
        })
      );
      return merged;
    } catch (e) {
      console.error(`Failed to save ${category} notification preferences:`, e);
    }
  }

  return updates;
}
