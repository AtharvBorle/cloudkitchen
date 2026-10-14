/**
 * ==============================================================================
 * 🍱 Centralized Meal Slots Configuration & Helpers (Frontend)
 * ==============================================================================
 * Exactly 7 standardized predefined meal slots for the entire platform.
 * Sellers cannot create custom timing categories; all subscriptions and deliveries
 * reference these centralized slots.
 */

export interface MealSlotDefinition {
  id: string;             // Canonical stable ID: "breakfast", "mid_morning_meal", etc.
  name: string;           // Display Name: "Breakfast", "Mid-Morning Meal", etc.
  subtitle: string;       // Subtitle: "Morning breakfast / Nasta", etc.
  description: string;    // Description
  defaultTimeRange: string; // "7:30 AM – 9:30 AM"
  startHour: number;      // 24-hr clock hour when slot window begins
  startMinute: number;
  endHour: number;        // 24-hr clock hour when slot window ends
  endMinute: number;
  order: number;          // Sort order (1 to 7)
}

export const PREDEFINED_MEAL_SLOTS: MealSlotDefinition[] = [
  {
    id: "breakfast",
    name: "Breakfast",
    subtitle: "Morning breakfast / Nasta",
    description: "Start the day with fresh morning breakfast and wholesome nasta dishes.",
    defaultTimeRange: "7:30 AM – 9:30 AM",
    startHour: 7,
    startMinute: 30,
    endHour: 9,
    endMinute: 30,
    order: 1,
  },
  {
    id: "mid_morning_meal",
    name: "Mid-Morning Meal",
    subtitle: "Morning meal",
    description: "Hearty pre-lunch morning meal designed for early workers and students.",
    defaultTimeRange: "10:30 AM – 11:30 AM",
    startHour: 10,
    startMinute: 30,
    endHour: 11,
    endMinute: 30,
    order: 2,
  },
  {
    id: "mid_morning_snack",
    name: "Mid-Morning Snack",
    subtitle: "Morning Nasta",
    description: "Light mid-morning refreshments and healthy energy boosters.",
    defaultTimeRange: "11:30 AM – 12:30 PM",
    startHour: 11,
    startMinute: 30,
    endHour: 12,
    endMinute: 30,
    order: 3,
  },
  {
    id: "lunch",
    name: "Lunch",
    subtitle: "Afternoon meal",
    description: "Complete nutritious afternoon meal thali, mains, and freshly prepared sides.",
    defaultTimeRange: "12:30 PM – 2:30 PM",
    startHour: 12,
    startMinute: 30,
    endHour: 14,
    endMinute: 30,
    order: 4,
  },
  {
    id: "evening_snack",
    name: "Evening Snack",
    subtitle: "Evening snacks",
    description: "Warm evening refreshments, savory chai accompaniments, and snacks.",
    defaultTimeRange: "4:30 PM – 6:30 PM",
    startHour: 16,
    startMinute: 30,
    endHour: 18,
    endMinute: 30,
    order: 5,
  },
  {
    id: "dinner",
    name: "Dinner",
    subtitle: "Night meal",
    description: "Freshly prepared wholesome evening dinner thali and comfort meals.",
    defaultTimeRange: "7:30 PM – 10:00 PM",
    startHour: 19,
    startMinute: 30,
    endHour: 22,
    endMinute: 0,
    order: 6,
  },
  {
    id: "late_night_snack",
    name: "Late-Night Snack",
    subtitle: "Late-night snacks",
    description: "Convenient late-night bites and comfort food for night owls.",
    defaultTimeRange: "10:30 PM – 12:30 AM",
    startHour: 22,
    startMinute: 30,
    endHour: 24, // 00:30 next day
    endMinute: 30,
    order: 7,
  },
];

export const MEAL_SLOT_IDS = PREDEFINED_MEAL_SLOTS.map((s) => s.id);

export const MEAL_SLOTS_MAP = new Map<string, MealSlotDefinition>(
  PREDEFINED_MEAL_SLOTS.map((s) => [s.id, s])
);

/**
 * Normalizes any legacy string (e.g. "Breakfast: 7:30 AM – 9:30 AM", "Lunch", "Evening Snacks")
 * into one of the 7 canonical slot IDs. Returns null if unrecognizable.
 */
export function normalizeMealSlotId(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.split(":")[0].trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

  // Direct match
  if (MEAL_SLOTS_MAP.has(cleaned)) return cleaned;

  // Fuzzy mapping for legacy timings
  if (cleaned.includes("breakfast") || cleaned.includes("nasta")) return "breakfast";
  if (cleaned.includes("mid_morning_meal") || cleaned.includes("morning_meal")) return "mid_morning_meal";
  if (cleaned.includes("mid_morning_snack") || cleaned.includes("morning_nasta") || cleaned.includes("morning_snack")) return "mid_morning_snack";
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
