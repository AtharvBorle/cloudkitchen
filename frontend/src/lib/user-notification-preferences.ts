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
  promoOffers: true,
  newMenu: true,
  deliveryAlerts: true,
};

const STORAGE_KEY_SUMMARY = "customer_notifications_summary";
const STORAGE_KEY_PUSH = "customer_push_notifications";
const STORAGE_KEY_EMAIL = "customer_email_notifications";
const STORAGE_KEY_SMS = "customer_sms_notifications";

export const NOTIFICATION_PREFERENCES_EVENT = "customer-notifications-updated";

function parseCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function writeCookie(name: string, value: string, days = 365): void {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function safeGetStorage(key: string): any {
  if (typeof window === "undefined") return null;
  try {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal) return JSON.parse(fromLocal);
  } catch {}

  try {
    const fromSession = sessionStorage.getItem(key);
    if (fromSession) return JSON.parse(fromSession);
  } catch {}

  try {
    const fromCookie = parseCookieValue(key);
    if (fromCookie) return JSON.parse(fromCookie);
  } catch {}

  return null;
}

function safeSetStorage(key: string, data: any): void {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(data);
  try {
    localStorage.setItem(key, serialized);
  } catch {}

  try {
    sessionStorage.setItem(key, serialized);
  } catch {}

  try {
    writeCookie(key, serialized);
  } catch {}
}

const extractBool = (...vals: any[]): boolean | undefined => {
  for (const v of vals) {
    if (typeof v === "boolean") return v;
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return undefined;
};

export function getNotificationsSummaryPreferences(): NotificationsSummaryPreferences {
  return { ...DEFAULT_NOTIFICATIONS_SUMMARY };
}

/**
 * Save user's notification summary preferences to localStorage, sessionStorage & cookies and broadcast change event.
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
    safeSetStorage(STORAGE_KEY_SUMMARY, next);

    // Also sync to push notification storage mapping
    const existingPush = safeGetStorage(STORAGE_KEY_PUSH) || {};
    const pushMapping: Record<string, boolean> = {
      ...existingPush,
      "order-updates": next.orderUpdates,
      "promotional-offers": next.promoOffers,
      "new-arrivals": next.newMenu,
      "delivery-alerts": next.deliveryAlerts,
    };
    safeSetStorage(STORAGE_KEY_PUSH, pushMapping);

    try {
      window.dispatchEvent(
        new CustomEvent(NOTIFICATION_PREFERENCES_EVENT, {
          detail: { type: "summary", data: next },
        })
      );
    } catch {}
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

  const parsed = safeGetStorage(key);
  if (!parsed) {
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

  return { ...defaultValues, ...parsed };
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
    const existing = safeGetStorage(key) || {};
    const merged = { ...existing, ...updates };
    safeSetStorage(key, merged);

    // If push, sync back to summary
    if (category === "push") {
      const summaryUpdates: Partial<NotificationsSummaryPreferences> = {};
      if (typeof merged["order-updates"] === "boolean") summaryUpdates.orderUpdates = merged["order-updates"];
      if (typeof merged["promotional-offers"] === "boolean") summaryUpdates.promoOffers = merged["promotional-offers"];
      if (typeof merged["new-arrivals"] === "boolean") summaryUpdates.newMenu = merged["new-arrivals"];
      if (typeof merged["delivery-alerts"] === "boolean") summaryUpdates.deliveryAlerts = merged["delivery-alerts"];

      const currentSummary = getNotificationsSummaryPreferences();
      const nextSummary = { ...currentSummary, ...summaryUpdates };
      safeSetStorage(STORAGE_KEY_SUMMARY, nextSummary);
    }

    try {
      window.dispatchEvent(
        new CustomEvent(NOTIFICATION_PREFERENCES_EVENT, {
          detail: { type: category, data: merged },
        })
      );
    } catch {}
    return merged;
  }

  return updates;
}
