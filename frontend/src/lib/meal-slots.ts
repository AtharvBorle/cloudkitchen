/**
 * ==============================================================================
 * 🍱 Centralized Meal Slots Configuration & Helpers (Frontend)
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
    defaultTimeRange: "",
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
    defaultTimeRange: "",
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
    defaultTimeRange: "",
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
    defaultTimeRange: "",
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
    defaultTimeRange: "",
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
    defaultTimeRange: "",
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

export const DEFAULT_SLOT_TIMES: Record<string, string> = {
  breakfast: "07:30 AM – 09:30 AM",
  morning_meal: "10:30 AM – 12:00 PM",
  lunch: "12:30 PM – 02:30 PM",
  evening_snack: "04:30 PM – 06:30 PM",
  dinner: "07:30 PM – 09:30 PM",
  late_night_snack: "10:30 PM – 12:30 AM",
};

export const DEFAULT_SLOT_ICONS: Record<string, string> = {
  breakfast: "🍳",
  morning_meal: "🥐",
  lunch: "🍲",
  evening_snack: "☕",
  dinner: "🍱",
  late_night_snack: "🌙",
};

/**
 * Returns the configured delivery timing for a slot, falling back to platform defaults.
 */
export function getSlotDeliveryTime(slotId: string, customTime?: string): string {
  const norm = normalizeMealSlotId(slotId) || "breakfast";

  // If a valid custom time is passed that isn't just the slot ID
  if (customTime && customTime.trim() && !MEAL_SLOTS_MAP.has(customTime.trim().toLowerCase())) {
    if (customTime.includes(":") && (customTime.toLowerCase().includes("am") || customTime.toLowerCase().includes("pm"))) {
      const parts = customTime.split(/:\s*(?=\d)/);
      if (parts.length > 1) return parts[1].trim();
      return customTime.trim();
    }
    if (customTime.includes("(") && customTime.includes(")")) {
      const extracted = customTime.substring(customTime.indexOf("(") + 1, customTime.indexOf(")")).trim();
      if (extracted) return extracted;
    }
    return customTime.trim();
  }

  // Check localStorage cached slots config if in browser
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("neo_meal_slots_config");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const found = parsed.find((s: any) => normalizeMealSlotId(s.id) === norm);
          if (found?.defaultTimeRange && found.defaultTimeRange.trim()) {
            return found.defaultTimeRange.trim();
          }
        }
      }
    } catch {}
  }

  // Check predefined slots definition
  const def = MEAL_SLOTS_MAP.get(norm);
  if (def?.defaultTimeRange && def.defaultTimeRange.trim()) {
    return def.defaultTimeRange.trim();
  }

  return DEFAULT_SLOT_TIMES[norm] || "Standard Delivery Window";
}

export interface FormattedMealTiming {
  slotId: string;
  name: string;
  timeRange: string;
  fullDisplay: string;
  icon: string;
}

/**
 * Parses and formats any meal timing string (variable name, "slot: time", "Slot (time)", or slot ID)
 * into a structured, human-friendly display with name, time range, full display label, and icon.
 */
export function formatMealTimingDisplay(timing: string | null | undefined): FormattedMealTiming {
  if (!timing || typeof timing !== "string") {
    return {
      slotId: "lunch",
      name: "Lunch",
      timeRange: DEFAULT_SLOT_TIMES.lunch,
      fullDisplay: `Lunch (${DEFAULT_SLOT_TIMES.lunch})`,
      icon: DEFAULT_SLOT_ICONS.lunch,
    };
  }

  const raw = timing.trim();
  const normId = normalizeMealSlotId(raw) || "lunch";
  const def = getMealSlotDetails(normId);
  const icon = DEFAULT_SLOT_ICONS[normId] || "🍱";

  let extractedTime = "";

  // 1. Check if string is "Name: Time" e.g. "Lunch: 12:30 PM – 02:30 PM"
  if (raw.includes(":") && (raw.toLowerCase().includes("am") || raw.toLowerCase().includes("pm"))) {
    const colonIndex = raw.indexOf(":");
    extractedTime = raw.substring(colonIndex + 1).trim();
  }
  // 2. Check if string is "Name (Time)" e.g. "Lunch (12:30 PM – 02:30 PM)"
  else if (raw.includes("(") && raw.includes(")")) {
    extractedTime = raw.substring(raw.indexOf("(") + 1, raw.indexOf(")")).trim();
  }
  // 3. Check if raw contains AM/PM times directly
  else if (raw.toLowerCase().includes("am") || raw.toLowerCase().includes("pm")) {
    extractedTime = raw;
  }

  const timeRange = getSlotDeliveryTime(normId, extractedTime);
  const name = def.name;

  return {
    slotId: normId,
    name,
    timeRange,
    fullDisplay: `${name} (${timeRange})`,
    icon,
  };
}
