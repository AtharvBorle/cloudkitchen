import crypto from "crypto";
import { getMealSlotDetails, normalizeMealSlotId, PREDEFINED_MEAL_SLOTS, MealSlotDefinition } from "./meal-slots";

/**
 * ==============================================================================
 * 🔑 Meal Subscription Delivery OTP & Window Helpers
 * ==============================================================================
 * Generates and validates deterministic 6-digit OTPs for daily meal deliveries.
 * Calculates exact delivery window boundaries and overdue status using IST.
 */

export interface DeliveryWindowTiming {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  startMinutes: number;
  endMinutes: number;
  startFormatted: string;
  endFormatted: string;
}

/**
 * Current time in Indian Standard Time (Asia/Kolkata).
 */
export function getNowInIST(): {
  hours: number;
  minutes: number;
  currentMinutes: number;
  dateStr: string;
} {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    const hours = parseInt(getPart("hour"), 10) || now.getHours();
    const minutes = parseInt(getPart("minute"), 10) || now.getMinutes();
    return {
      hours,
      minutes,
      currentMinutes: hours * 60 + minutes,
      dateStr: `${year}-${month}-${day}`,
    };
  } catch {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return {
      hours,
      minutes,
      currentMinutes: hours * 60 + minutes,
      dateStr: now.toISOString().split("T")[0],
    };
  }
}

/**
 * Parses time strings like "07:30 AM – 09:30 AM", "8:00 AM - 9:00 AM", "8-9 AM", "12:30 PM – 2:30 PM".
 * Falls back to slot definition start/end hours.
 */
export function parseSlotTimeWindow(
  timeStr: string | null | undefined,
  slotDef: MealSlotDefinition
): DeliveryWindowTiming {
  const defaultStartH = slotDef.startHour ?? 8;
  const defaultStartM = slotDef.startMinute ?? 0;
  const defaultEndH = slotDef.endHour ?? (defaultStartH + 1);
  const defaultEndM = slotDef.endMinute ?? 0;

  const formatTime = (h: number, m: number) => {
    const ampm = h >= 12 && h < 24 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  if (!timeStr || !timeStr.trim()) {
    return {
      startHour: defaultStartH,
      startMinute: defaultStartM,
      endHour: defaultEndH,
      endMinute: defaultEndM,
      startMinutes: defaultStartH * 60 + defaultStartM,
      endMinutes: defaultEndH * 60 + defaultEndM,
      startFormatted: formatTime(defaultStartH, defaultStartM),
      endFormatted: formatTime(defaultEndH, defaultEndM),
    };
  }

  try {
    const clean = timeStr.replace(/–|—|to/gi, "-").trim();
    const parts = clean.split("-").map((s) => s.trim());
    if (parts.length >= 2) {
      const parsePart = (str: string, fallbackAmPm?: string) => {
        const match = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (!match) return null;
        let h = parseInt(match[1], 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        const ampm = (match[3] || fallbackAmPm || "").toLowerCase();

        if (ampm === "pm" && h < 12) h += 12;
        if (ampm === "am" && h === 12) h = 0;
        return { h, m, ampm };
      };

      const endParsed = parsePart(parts[1]);
      const startParsed = parsePart(parts[0], endParsed?.ampm);

      if (startParsed && endParsed) {
        return {
          startHour: startParsed.h,
          startMinute: startParsed.m,
          endHour: endParsed.h,
          endMinute: endParsed.m,
          startMinutes: startParsed.h * 60 + startParsed.m,
          endMinutes: endParsed.h * 60 + endParsed.m,
          startFormatted: formatTime(startParsed.h, startParsed.m),
          endFormatted: formatTime(endParsed.h, endParsed.m),
        };
      }
    }
  } catch {}

  return {
    startHour: defaultStartH,
    startMinute: defaultStartM,
    endHour: defaultEndH,
    endMinute: defaultEndM,
    startMinutes: defaultStartH * 60 + defaultStartM,
    endMinutes: defaultEndH * 60 + defaultEndM,
    startFormatted: formatTime(defaultStartH, defaultStartM),
    endFormatted: formatTime(defaultEndH, defaultEndM),
  };
}

/**
 * Calculates delivery status in relation to the meal slot's delivery window.
 */
export function getMealDeliveryTimingStatus(
  scheduledDate: string,
  timeRange: string | null | undefined,
  slotDef: MealSlotDefinition,
  deliveryStatus: string
): {
  isOverdue: boolean;
  isOtpActive: boolean;
  overdueMinutes: number;
  timingStatus: "UPCOMING" | "IN_WINDOW" | "OVERDUE" | "DELIVERED" | "SKIPPED_PAUSED";
  window: DeliveryWindowTiming;
} {
  const window = parseSlotTimeWindow(timeRange, slotDef);
  const ist = getNowInIST();
  const isDelivered = deliveryStatus === "DELIVERED";
  const isPaused = deliveryStatus === "SKIPPED_PAUSED" || deliveryStatus === "CANCELLED";

  if (isDelivered) {
    return {
      isOverdue: false,
      isOtpActive: false,
      overdueMinutes: 0,
      timingStatus: "DELIVERED",
      window,
    };
  }

  if (isPaused) {
    return {
      isOverdue: false,
      isOtpActive: false,
      overdueMinutes: 0,
      timingStatus: "SKIPPED_PAUSED",
      window,
    };
  }

  // If scheduled in the past
  if (scheduledDate < ist.dateStr) {
    return {
      isOverdue: true,
      isOtpActive: true,
      overdueMinutes: 1440,
      timingStatus: "OVERDUE",
      window,
    };
  }

  // If scheduled in future
  if (scheduledDate > ist.dateStr) {
    return {
      isOverdue: false,
      isOtpActive: false,
      overdueMinutes: 0,
      timingStatus: "UPCOMING",
      window,
    };
  }

  // Today
  if (ist.currentMinutes < window.startMinutes) {
    return {
      isOverdue: false,
      isOtpActive: false,
      overdueMinutes: 0,
      timingStatus: "UPCOMING",
      window,
    };
  }

  if (ist.currentMinutes <= window.endMinutes) {
    return {
      isOverdue: false,
      isOtpActive: true,
      overdueMinutes: 0,
      timingStatus: "IN_WINDOW",
      window,
    };
  }

  // Passed window end time and still not delivered
  const overdueMins = Math.max(0, ist.currentMinutes - window.endMinutes);
  return {
    isOverdue: true,
    isOtpActive: true,
    overdueMinutes: overdueMins,
    timingStatus: "OVERDUE",
    window,
  };
}

/**
 * Generates a stable, cryptographically hashed 6-digit OTP for a specific meal delivery occurrence.
 */
export function getMealDeliveryOtp(
  subscriptionId: string,
  scheduledDate: string,
  slotId: string
): string {
  const normalizedSlot = normalizeMealSlotId(slotId) || "breakfast";
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "neo-cloud-meal-delivery-secret-2026";
  const seed = `${subscriptionId.trim()}:${scheduledDate.trim()}:${normalizedSlot.trim()}`;
  const hash = crypto.createHmac("sha256", secret).update(seed).digest("hex");
  const num = (parseInt(hash.substring(0, 8), 16) % 900000) + 100000;
  return num.toString();
}

/**
 * Validates an entered delivery OTP against the expected OTP (or fallback master OTP '123456').
 */
export function verifyMealDeliveryOtp(
  enteredOtp: string | undefined | null,
  subscriptionId: string,
  scheduledDate: string,
  slotId: string
): boolean {
  if (!enteredOtp) return false;
  const clean = String(enteredOtp).trim();
  const expected = getMealDeliveryOtp(subscriptionId, scheduledDate, slotId);
  if (clean === expected) return true;
  if (clean === "123456") return true;
  return false;
}
