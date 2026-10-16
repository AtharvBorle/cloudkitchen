/**
 * ==============================================================================
 * Centralized Meal Slots Configuration & Helpers
 * ==============================================================================
 * Exactly 6 standardized predefined meal slots for the entire platform:
 * 1. Breakfast (Morning breakfast / Nasta)
 * 2. Morning Meal (Morning meal)
 * 3. Lunch (Afternoon meal)
 * 4. Evening Snack (Evening snacks)
 * 5. Dinner (Night meal)
 * 6. Late-Night Snack (Late-night snacks)
 *
 * By default, slots do NOT have any delivery timing given.
 * Sellers/users must configure delivery timings first before creating subscriptions.
 */

export interface MealSlotDefinition {
  id: string;             // Canonical stable ID: "breakfast", "morning_meal", etc.
  name: string;           // Display Name: "Breakfast", "Morning Meal", etc.
  subtitle: string;       // Subtitle: "Morning breakfast / Nasta", etc.
  description: string;    // Description
  defaultTimeRange: string; // Empty "" by default until configured by seller/user
  startHour?: number;      // 24-hr clock hour when slot window begins
  startMinute?: number;
  endHour?: number;        // 24-hr clock hour when slot window ends
  endMinute?: number;
  order: number;          // Sort order (1 to 6)
}

export const PREDEFINED_MEAL_SLOTS: MealSlotDefinition[] = [
  {
    id: "breakfast",
    name: "Breakfast",
    subtitle: "Morning breakfast / Nasta",
    description: "Start the day with fresh morning breakfast and wholesome nasta dishes.",
    defaultTimeRange: "07:30 AM - 09:30 AM",
    startHour: 7,
    startMinute: 30,
    endHour: 9,
    endMinute: 30,
    order: 1,
  },
  {
    id: "morning_meal",
    name: "Morning Meal",
    subtitle: "Morning meal",
    description: "Hearty pre-lunch morning meal designed for early workers and students.",
    defaultTimeRange: "10:30 AM - 11:30 AM",
    startHour: 10,
    startMinute: 30,
    endHour: 11,
    endMinute: 30,
    order: 2,
  },
  {
    id: "lunch",
    name: "Lunch",
    subtitle: "Afternoon meal",
    description: "Complete nutritious afternoon meal thali, mains, and freshly prepared sides.",
    defaultTimeRange: "12:30 PM - 02:30 PM",
    startHour: 12,
    startMinute: 30,
    endHour: 14,
    endMinute: 30,
    order: 3,
  },
  {
    id: "evening_snack",
    name: "Evening Snack",
    subtitle: "Evening snacks",
    description: "Warm evening refreshments, savory chai accompaniments, and snacks.",
    defaultTimeRange: "04:30 PM - 06:30 PM",
    startHour: 16,
    startMinute: 30,
    endHour: 18,
    endMinute: 30,
    order: 4,
  },
  {
    id: "dinner",
    name: "Dinner",
    subtitle: "Night meal",
    description: "Freshly prepared wholesome evening dinner thali and comfort meals.",
    defaultTimeRange: "07:30 PM - 10:00 PM",
    startHour: 19,
    startMinute: 30,
    endHour: 22,
    endMinute: 0,
    order: 5,
  },
  {
    id: "late_night_snack",
    name: "Late-Night Snack",
    subtitle: "Late-night snacks",
    description: "Convenient late-night bites and comfort food for night owls.",
    defaultTimeRange: "10:30 PM - 12:30 AM",
    startHour: 22,
    startMinute: 30,
    endHour: 24,
    endMinute: 30,
    order: 6,
  },
];

export const MEAL_SLOT_IDS = PREDEFINED_MEAL_SLOTS.map((s) => s.id);

export const MEAL_SLOTS_MAP = new Map<string, MealSlotDefinition>(
  PREDEFINED_MEAL_SLOTS.map((s) => [s.id, s])
);

/**
 * Normalizes any legacy string (e.g. "Breakfast", "Mid-Morning Meal", "Mid-Morning Snack")
 * into one of the 6 canonical slot IDs. Returns null if unrecognizable.
 */
export function normalizeMealSlotId(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.split(":")[0].trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

  // Direct match
  if (MEAL_SLOTS_MAP.has(cleaned)) return cleaned;

  // Compatibility & aliases
  if (cleaned === "mid_morning_meal" || cleaned === "morning_meal") return "morning_meal";
  if (cleaned.includes("breakfast") || cleaned.includes("nasta")) return "breakfast";
  if (cleaned.includes("mid_morning") || cleaned.includes("morning_meal") || cleaned.includes("morning_snack")) return "morning_meal";
  if (cleaned.includes("lunch") || cleaned.includes("afternoon")) return "lunch";
  if (cleaned.includes("evening") || cleaned.includes("tea_snack") || cleaned.includes("evening_snack")) return "evening_snack";
  if (cleaned.includes("dinner") || cleaned.includes("night_meal")) return "dinner";
  if (cleaned.includes("late_night") || cleaned.includes("midnight")) return "late_night_snack";

  return null;
}

/**
 * Normalizes an array of slot IDs or legacy strings into a unique, sorted list of valid slot IDs.
 */
export function normalizeMealSlotIds(inputs: (string | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const item of inputs) {
    if (!item) continue;
    const normalized = normalizeMealSlotId(item);
    if (normalized) set.add(normalized);
  }
  return PREDEFINED_MEAL_SLOTS.filter((s) => set.has(s.id)).map((s) => s.id);
}

/**
 * Returns the definition for a slot ID with fallback.
 */
export function getMealSlotDetails(slotId: string): MealSlotDefinition {
  const norm = normalizeMealSlotId(slotId) || "breakfast";
  return MEAL_SLOTS_MAP.get(norm) || PREDEFINED_MEAL_SLOTS[0];
}

/**
 * Formats a list of slot IDs into a human-readable string (e.g. "Breakfast, Lunch, Dinner").
 */
export function formatMealSlotsDisplay(slotIds: string[]): string {
  const valid = normalizeMealSlotIds(slotIds);
  if (valid.length === 0) return "Standard Delivery Window";
  return valid.map((id) => getMealSlotDetails(id).name).join(", ");
}

/**
 * Extracts only the time range portion from a string (e.g. "Breakfast: 07:30 PM – 09:30 PM" -> "07:30 PM – 09:30 PM").
 * Never corrupts or splits the hours/minutes inside the time range.
 */
export function extractTimeRangeString(str?: string | null): string {
  if (!str || typeof str !== "string") return "";
  let s = str.trim();
  if (!s) return "";

  // 1. If there are no digits at all in the string, it CANNOT be a time range
  // Any slot name (e.g. "Morning Meal", "Evening Snack", "Late-Night Snack") is discarded immediately
  if (!/\d/.test(s)) {
    return "";
  }

  // 2. If wrapped in parentheses "(07:30 PM – 09:30 PM)"
  if (s.includes("(") && s.includes(")")) {
    s = s.substring(s.indexOf("(") + 1, s.lastIndexOf(")")).trim();
  }

  // 3. If it has a prefix with a colon e.g. "Breakfast: 07:30 PM – 09:30 PM"
  // The prefix is a slot name or ID (e.g. "Breakfast", "Morning Meal", "morning_meal").
  // It does NOT contain digits.
  const colonIdx = s.indexOf(":");
  if (colonIdx !== -1) {
    const before = s.substring(0, colonIdx).trim();
    // Only strip before colon if 'before' does NOT contain digits (e.g. not "07:30")
    if (!/\d/.test(before)) {
      s = s.substring(colonIdx + 1).trim();
    }
  }

  s = s.replace(/^[:\s\-–—]+|[:\s\-–—]+$/g, "").trim();

  // 4. Must contain digits to be a valid time range
  if (!/\d/.test(s)) {
    return "";
  }

  // 5. If what remains is just a slot ID or slot name without time
  if (MEAL_SLOTS_MAP.has(s.toLowerCase()) || normalizeMealSlotId(s) === s.toLowerCase()) {
    return "";
  }

  return s;
}

/**
 * Returns the configured delivery timing for a slot.
 * Falls back to the standardized slot time window if custom time is not set.
 */
export function getSlotDeliveryTime(slotId: string, customTime?: string): string {
  const norm = normalizeMealSlotId(slotId) || "breakfast";

  if (customTime) {
    const extracted = extractTimeRangeString(customTime);
    if (extracted) {
      return extracted;
    }
  }

  const def = MEAL_SLOTS_MAP.get(norm);
  if (def?.defaultTimeRange) {
    const extracted = extractTimeRangeString(def.defaultTimeRange);
    if (extracted) return extracted;
  }

  if (def && typeof def.startHour === "number" && typeof def.endHour === "number") {
    const formatTime = (h: number, m: number = 0) => {
      const ampm = h >= 12 && h < 24 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const mStr = String(m).padStart(2, "0");
      return `${String(h12).padStart(2, "0")}:${mStr} ${ampm}`;
    };
    return `${formatTime(def.startHour, def.startMinute || 0)} - ${formatTime(def.endHour, def.endMinute || 0)}`;
  }

  return "";
}

export interface FormattedMealTiming {
  slotId: string;
  name: string;
  timeRange: string;
  fullDisplay: string;
  icon: string;
}

/**
 * Parses and formats any meal timing string into a clean, human-friendly display
 * showing ONLY the timing configured by the seller, with no arbitrary defaults or emojis.
 */
export function formatMealTimingDisplay(timing: string | null | undefined): FormattedMealTiming {
  if (!timing || typeof timing !== "string") {
    const defaultTime = getSlotDeliveryTime("lunch");
    return {
      slotId: "lunch",
      name: "Lunch",
      timeRange: defaultTime,
      fullDisplay: defaultTime ? `Lunch (${defaultTime})` : "Lunch",
      icon: "",
    };
  }

  const raw = timing.trim();
  const normId = normalizeMealSlotId(raw) || "lunch";
  const def = getMealSlotDetails(normId);

  const timeRange = getSlotDeliveryTime(normId, raw);
  const name = def.name;

  return {
    slotId: normId,
    name,
    timeRange,
    fullDisplay: timeRange ? `${name} (${timeRange})` : name,
    icon: "",
  };
}
