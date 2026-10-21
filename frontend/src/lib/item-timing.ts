/**
 * Shared Item Timing & Operating Hours Utilities
 * Supports 12-hour AM/PM format, dynamic day-of-week scheduling,
 * start/end time validation, and real-time availability evaluation.
 */

export interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export const DAYS_OF_WEEK = [
  { key: "Monday", short: "Mon", label: "Monday" },
  { key: "Tuesday", short: "Tue", label: "Tuesday" },
  { key: "Wednesday", short: "Wed", label: "Wednesday" },
  { key: "Thursday", short: "Thu", label: "Thursday" },
  { key: "Friday", short: "Fri", label: "Friday" },
  { key: "Saturday", short: "Sat", label: "Saturday" },
  { key: "Sunday", short: "Sun", label: "Sunday" },
] as const;

export const TIME_SLOTS_12H: string[] = [
  "12:00 AM", "12:30 AM",
  "01:00 AM", "01:30 AM",
  "02:00 AM", "02:30 AM",
  "03:00 AM", "03:30 AM",
  "04:00 AM", "04:30 AM",
  "05:00 AM", "05:30 AM",
  "06:00 AM", "06:30 AM",
  "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM",
  "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM",
  "10:00 PM", "10:30 PM",
  "11:00 PM", "11:30 PM",
  "11:59 PM"
];

export const DEFAULT_ITEM_SCHEDULE: DaySchedule[] = [
  { day: "Monday", isOpen: true, openTime: "09:00 AM", closeTime: "10:00 PM" },
  { day: "Tuesday", isOpen: true, openTime: "09:00 AM", closeTime: "10:00 PM" },
  { day: "Wednesday", isOpen: true, openTime: "09:00 AM", closeTime: "10:00 PM" },
  { day: "Thursday", isOpen: true, openTime: "09:00 AM", closeTime: "10:00 PM" },
  { day: "Friday", isOpen: true, openTime: "09:00 AM", closeTime: "10:00 PM" },
  { day: "Saturday", isOpen: true, openTime: "09:00 AM", closeTime: "10:00 PM" },
  { day: "Sunday", isOpen: true, openTime: "09:00 AM", closeTime: "10:00 PM" },
];

/**
 * Converts a 12-hour ("09:00 AM") or 24-hour ("09:00") time string to minutes from midnight (0 - 1439).
 */
export function timeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr || typeof timeStr !== "string") return null;
  const clean = timeStr.trim();
  if (!clean) return null;

  // Match 12h format e.g. "09:30 AM" or "9:30am"
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = parseInt(match12[2], 10);
    const modifier = match12[3] ? match12[3].toUpperCase() : null;

    if (modifier) {
      if (modifier === "PM" && hour < 12) hour += 12;
      if (modifier === "AM" && hour === 12) hour = 0;
    }
    return hour * 60 + minute;
  }

  return null;
}

/**
 * Converts minutes from midnight into 12-hour format string (e.g. 540 -> "09:00 AM").
 */
export function minutesToTime12H(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  let hour = Math.floor(norm / 60);
  const min = norm % 60;
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;

  const hStr = hour < 10 ? `0${hour}` : `${hour}`;
  const mStr = min < 10 ? `0${min}` : `${min}`;
  return `${hStr}:${mStr} ${ampm}`;
}

/**
 * Returns the list of valid end times given a start time.
 * Every option returned is strictly after the start time.
 */
export function getValidEndTimes(openTime: string): string[] {
  const startMinutes = timeToMinutes(openTime) ?? 0;
  const valid = TIME_SLOTS_12H.filter((slot) => {
    const slotMin = timeToMinutes(slot) ?? 0;
    return slotMin > startMinutes;
  });
  // If start time is 11:30 PM, make sure 11:59 PM is available
  if (valid.length === 0) {
    return ["11:59 PM"];
  }
  return valid;
}

/**
 * Returns a valid end time if currentEndTime is <= openTime.
 * Defaults to 1 hour after openTime or the first valid slot.
 */
export function ensureValidEndTime(openTime: string, currentEndTime: string): string {
  const startMin = timeToMinutes(openTime) ?? 540;
  const endMin = timeToMinutes(currentEndTime);

  if (endMin !== null && endMin > startMin) {
    return currentEndTime;
  }

  // Pick a slot ~1-2 hours after start, or the next available slot
  const validSlots = getValidEndTimes(openTime);
  const targetMin = startMin + 60;
  const idealSlot = validSlots.find((s) => (timeToMinutes(s) ?? 0) >= targetMin);
  return idealSlot || validSlots[0] || "11:59 PM";
}

/**
 * Safely parses operationalHours from database (JSON object map or array).
 */
export function parseOperationalHours(raw: any): DaySchedule[] {
  if (!raw) return DEFAULT_ITEM_SCHEDULE.map((s) => ({ ...s }));

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return DEFAULT_ITEM_SCHEDULE.map((s) => ({ ...s }));
    }
  }

  // Format A: Array of DaySchedule
  if (Array.isArray(parsed) && parsed.length > 0) {
    const map = new Map<string, any>();
    for (const item of parsed) {
      if (item && item.day) map.set(item.day.toLowerCase(), item);
    }

    return DAYS_OF_WEEK.map((d) => {
      const match = map.get(d.key.toLowerCase()) || map.get(d.short.toLowerCase());
      if (match) {
        return {
          day: d.key,
          isOpen: match.isOpen !== false,
          openTime: match.openTime || "09:00 AM",
          closeTime: match.closeTime || "10:00 PM",
        };
      }
      return {
        day: d.key,
        isOpen: true,
        openTime: "09:00 AM",
        closeTime: "10:00 PM",
      };
    });
  }

  // Format B: Map keyed by Day name (e.g. { Monday: { isOpen, openTime, closeTime } })
  if (typeof parsed === "object" && parsed !== null) {
    return DAYS_OF_WEEK.map((d) => {
      const match =
        parsed[d.key] ||
        parsed[d.short] ||
        parsed[d.key.toLowerCase()] ||
        parsed[d.short.toLowerCase()];

      if (match) {
        return {
          day: d.key,
          isOpen: match.isOpen !== false,
          openTime: match.openTime || "09:00 AM",
          closeTime: match.closeTime || "10:00 PM",
        };
      }
      return {
        day: d.key,
        isOpen: true,
        openTime: "09:00 AM",
        closeTime: "10:00 PM",
      };
    });
  }

  return DEFAULT_ITEM_SCHEDULE.map((s) => ({ ...s }));
}

/**
 * Serializes DaySchedule[] for DB storage.
 */
export function serializeSchedules(schedules: DaySchedule[]) {
  const map: Record<string, { isOpen: boolean; openTime: string; closeTime: string }> = {};
  const openDaysShort: string[] = [];

  let fallbackOpen = "09:00 AM";
  let fallbackClose = "10:00 PM";
  let foundFirstOpen = false;

  for (const s of schedules) {
    const matched = DAYS_OF_WEEK.find((d) => d.key.toLowerCase() === s.day.toLowerCase()) || {
      key: s.day,
      short: s.day.substring(0, 3),
    };

    map[matched.key] = {
      isOpen: s.isOpen,
      openTime: s.openTime,
      closeTime: s.closeTime,
    };

    if (s.isOpen) {
      openDaysShort.push(matched.short);
      if (!foundFirstOpen) {
        fallbackOpen = s.openTime;
        fallbackClose = s.closeTime;
        foundFirstOpen = true;
      }
    }
  }

  return {
    operationalHours: JSON.stringify(map),
    availableDays: openDaysShort.length > 0 ? openDaysShort.join(",") : "None",
    openTime: fallbackOpen,
    closeTime: fallbackClose,
  };
}

/**
 * Returns current day name and minutes in India Standard Time (Asia/Kolkata).
 */
export function getNowInIST(date: Date = new Date()): {
  dayName: string;
  dayShort: string;
  currentMinutes: number;
} {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    let weekday = "Monday";
    let hour = 0;
    let minute = 0;
    for (const p of parts) {
      if (p.type === "weekday") weekday = p.value;
      if (p.type === "hour") hour = parseInt(p.value, 10);
      if (p.type === "minute") minute = parseInt(p.value, 10);
    }
    const shortMap: Record<string, string> = {
      Sunday: "Sun",
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
    };
    return {
      dayName: weekday,
      dayShort: shortMap[weekday] || weekday.substring(0, 3),
      currentMinutes: hour * 60 + minute,
    };
  } catch {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const shorts = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayIdx = date.getDay();
    return {
      dayName: days[dayIdx],
      dayShort: shorts[dayIdx],
      currentMinutes: date.getHours() * 60 + date.getMinutes(),
    };
  }
}

export interface AvailabilityResult {
  isAvailable: boolean;
  reason?: string;
  todaySchedule?: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

/**
 * Real-time availability checker for food items.
 * Evaluates stock, active toggle, day of week, and 12-hour start/close times.
 */
export function isItemAvailableNow(item: any, referenceDate: Date = new Date()): AvailabilityResult {
  if (!item) return { isAvailable: false, reason: "Item not found" };

  // Explicit item active flag
  if (item.isAvailable === false) {
    return { isAvailable: false, reason: "Currently unavailable" };
  }

  // Stock check
  if (item.stockQuantity !== undefined && item.stockQuantity !== null && item.stockQuantity !== -1) {
    if (item.stockQuantity <= 0) {
      return { isAvailable: false, reason: "Out of stock" };
    }
  }

  const { dayName, dayShort, currentMinutes } = getNowInIST(referenceDate);

  // 1. Evaluate operationalHours if present
  if (item.operationalHours) {
    try {
      const schedules = parseOperationalHours(item.operationalHours);
      const todaySched = schedules.find(
        (s) =>
          s.day.toLowerCase() === dayName.toLowerCase() ||
          s.day.toLowerCase() === dayShort.toLowerCase()
      );

      if (todaySched) {
        if (!todaySched.isOpen) {
          return {
            isAvailable: false,
            reason: `Closed on ${dayName}`,
            todaySchedule: todaySched,
          };
        }

        const openMin = timeToMinutes(todaySched.openTime);
        const closeMin = timeToMinutes(todaySched.closeTime);

        if (openMin !== null && closeMin !== null) {
          if (openMin < closeMin) {
            if (currentMinutes < openMin) {
              return {
                isAvailable: false,
                reason: `Opens at ${todaySched.openTime}`,
                todaySchedule: todaySched,
              };
            }
            if (currentMinutes > closeMin) {
              return {
                isAvailable: false,
                reason: `Closed at ${todaySched.closeTime}`,
                todaySchedule: todaySched,
              };
            }
          } else if (openMin > closeMin) {
            // Overnight schedule (e.g. 10:00 PM to 02:00 AM)
            if (currentMinutes < openMin && currentMinutes > closeMin) {
              return {
                isAvailable: false,
                reason: `Opens at ${todaySched.openTime}`,
                todaySchedule: todaySched,
              };
            }
          }
        }

        return { isAvailable: true, todaySchedule: todaySched };
      }
    } catch (e) {
      console.error("Error evaluating item operationalHours:", e);
    }
  }

  // 2. Fallback: check availableDays string (e.g. "Mon,Tue,Wed,Thu,Fri")
  if (item.availableDays && typeof item.availableDays === "string") {
    const rawDays = item.availableDays.toLowerCase();
    const isDayAllowed =
      rawDays.includes(dayShort.toLowerCase()) || rawDays.includes(dayName.toLowerCase());

    if (!isDayAllowed) {
      return { isAvailable: false, reason: `Available on ${item.availableDays}` };
    }
  }

  // 3. Fallback: check global openTime / closeTime
  if (item.openTime && item.closeTime) {
    const openMin = timeToMinutes(item.openTime);
    const closeMin = timeToMinutes(item.closeTime);

    if (openMin !== null && closeMin !== null) {
      if (openMin < closeMin) {
        if (currentMinutes < openMin) {
          return { isAvailable: false, reason: `Opens at ${item.openTime}` };
        }
        if (currentMinutes > closeMin) {
          return { isAvailable: false, reason: `Closed at ${item.closeTime}` };
        }
      } else if (openMin > closeMin) {
        if (currentMinutes < openMin && currentMinutes > closeMin) {
          return { isAvailable: false, reason: `Opens at ${item.openTime}` };
        }
      }
    }
  }

  return { isAvailable: true };
}
