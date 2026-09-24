export type DietaryOption = "all" | "veg" | "non_veg" | "non-veg" | "vegan" | "jain";

export function normalizeDietary(diet?: string | null): DietaryOption {
  if (!diet) return "all";
  const lower = diet.toLowerCase().trim();
  if (lower === "veg" || lower === "pure_veg" || lower === "pure veg") return "veg";
  if (lower === "non_veg" || lower === "non-veg" || lower === "non veg" || lower === "nonveg") return "non_veg";
  if (lower === "vegan") return "vegan";
  if (lower === "jain" || lower === "satvik") return "jain";
  return "all";
}

const NON_VEG_KEYWORDS = [
  "chicken",
  "mutton",
  "egg",
  "eggs",
  "fish",
  "prawn",
  "prawns",
  "meat",
  "beef",
  "pork",
  "seafood",
  "non-veg",
  "non_veg",
  "non veg",
  "biryani",
  "kebab",
  "tandoori chicken",
  "shawarma",
  "wings",
];

const NON_VEG_STRICT_WORDS = [
  "chicken",
  "mutton",
  "egg",
  "eggs",
  "fish",
  "prawn",
  "prawns",
  "meat",
  "beef",
  "pork",
  "seafood",
  "shawarma",
  "wings",
];

const VEGAN_POSITIVE_WORDS = [
  "vegan",
  "plant-based",
  "plant based",
  "tofu",
  "salad",
  "smoothie",
  "organic",
  "grain",
  "fruit",
  "fruits",
  "oats",
  "greens",
  "juice",
  "juices",
  "avocado",
  "almond",
  "soy",
  "coconut milk",
];

const NON_VEGAN_WORDS = [
  "paneer",
  "cheese",
  "ghee",
  "butter",
  "milk",
  "curd",
  "yogurt",
  "dahi",
  "malai",
  "cream",
  "egg",
  "eggs",
  "chicken",
  "mutton",
  "meat",
  "fish",
  "prawn",
];

const JAIN_POSITIVE_WORDS = [
  "jain",
  "satvik",
  "swaminarayan",
  "no onion no garlic",
  "no onion",
  "no garlic",
  "jain thali",
  "jain special",
  "dal khichdi",
  "jeera rice",
  "plain rice",
  "roti",
  "chapati",
  "phulka",
  "pure veg",
];

const NON_JAIN_ROOTS = [
  "onion",
  "garlic",
  "potato",
  "potatoes",
  "aloo",
  "alu",
  "carrot",
  "carrots",
  "radish",
  "mooli",
  "ginger",
  "adrak",
  "beetroot",
  "chicken",
  "mutton",
  "egg",
  "fish",
  "meat",
];

export function isDishMatchingDiet(
  dish: {
    itemType?: string | null;
    name?: string | null;
    description?: string | null;
    categoryName?: string | null;
  },
  dietary?: string | null
): boolean {
  const norm = normalizeDietary(dietary);
  if (norm === "all") return true;

  const rawType = (dish.itemType || "").toUpperCase().trim();
  const text = `${dish.name || ""} ${dish.description || ""} ${dish.categoryName || ""}`.toLowerCase();

  const containsNonVegStrict = NON_VEG_STRICT_WORDS.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(text);
  });

  if (norm === "veg") {
    if (rawType === "NON_VEG" || rawType === "NON-VEG" || containsNonVegStrict) {
      return false;
    }
    return true;
  }

  if (norm === "non_veg") {
    if (rawType === "NON_VEG" || rawType === "NON-VEG" || containsNonVegStrict) {
      return true;
    }
    return NON_VEG_KEYWORDS.some((kw) => text.includes(kw));
  }

  if (norm === "vegan") {
    if (rawType === "VEGAN") return true;
    if (containsNonVegStrict || rawType === "NON_VEG" || rawType === "NON-VEG") return false;
    const hasDairy = NON_VEGAN_WORDS.some((w) => {
      const regex = new RegExp(`\\b${w}\\b`, "i");
      return regex.test(text);
    });
    if (hasDairy) return false;
    return (
      VEGAN_POSITIVE_WORDS.some((w) => text.includes(w)) ||
      (rawType === "VEG" && (text.includes("salad") || text.includes("juice") || text.includes("fruit") || text.includes("rice") || text.includes("dal")))
    );
  }

  if (norm === "jain") {
    if (rawType === "JAIN") return true;
    if (containsNonVegStrict || rawType === "NON_VEG" || rawType === "NON-VEG") return false;
    const hasRoots = NON_JAIN_ROOTS.some((w) => {
      const regex = new RegExp(`\\b${w}\\b`, "i");
      return regex.test(text);
    });
    if (hasRoots) return false;
    return (
      JAIN_POSITIVE_WORDS.some((w) => text.includes(w)) ||
      text.includes("jain") ||
      text.includes("satvik")
    );
  }

  return true;
}

export function isKitchenMatchingDiet(
  kitchen: {
    foodType?: string | null;
    category?: string | null;
    name?: string | null;
    id?: string | null;
    trackingId?: string | null;
  },
  dietary?: string | null,
  foodItems?: Array<{
    sellerId?: string | null;
    sellerTrackingId?: string | null;
    itemType?: string | null;
    name?: string | null;
    description?: string | null;
    categoryName?: string | null;
  }>
): boolean {
  const norm = normalizeDietary(dietary);
  if (norm === "all") return true;

  const rawFoodType = (kitchen.foodType || "").toUpperCase().trim();
  const text = `${kitchen.name || ""} ${kitchen.category || ""}`.toLowerCase();

  const kitchenDishes = foodItems
    ? foodItems.filter(
        (f) =>
          (kitchen.id && f.sellerId === kitchen.id) ||
          (kitchen.trackingId && f.sellerTrackingId === kitchen.trackingId) ||
          (kitchen.id && f.sellerTrackingId === kitchen.id)
      )
    : [];

  if (norm === "veg") {
    if (rawFoodType === "PURE_VEG" || rawFoodType === "VEG") return true;
    if (rawFoodType === "BOTH") return true;
    if (rawFoodType === "NON_VEG" || rawFoodType === "NON-VEG") {
      return kitchenDishes.length > 0 && kitchenDishes.some((d) => isDishMatchingDiet(d, "veg"));
    }
    if (text.includes("veg") || text.includes("thali") || text.includes("pure veg") || text.includes("satvik")) {
      return true;
    }
    return kitchenDishes.length === 0 || kitchenDishes.some((d) => isDishMatchingDiet(d, "veg"));
  }

  if (norm === "non_veg") {
    if (rawFoodType === "PURE_VEG") return false;
    if (rawFoodType === "NON_VEG" || rawFoodType === "NON-VEG" || rawFoodType === "BOTH") return true;
    if (
      text.includes("non-veg") ||
      text.includes("non veg") ||
      text.includes("biryani") ||
      text.includes("chicken") ||
      text.includes("meat") ||
      text.includes("fish")
    ) {
      return true;
    }
    return kitchenDishes.some((d) => isDishMatchingDiet(d, "non_veg"));
  }

  if (norm === "vegan") {
    if (rawFoodType === "VEGAN") return true;
    if (
      text.includes("vegan") ||
      text.includes("plant") ||
      text.includes("healthy") ||
      text.includes("salad") ||
      text.includes("organic")
    ) {
      return true;
    }
    return kitchenDishes.some((d) => isDishMatchingDiet(d, "vegan"));
  }

  if (norm === "jain") {
    if (rawFoodType === "JAIN") return true;
    if (
      text.includes("jain") ||
      text.includes("satvik") ||
      text.includes("swaminarayan") ||
      text.includes("pure veg")
    ) {
      return true;
    }
    return kitchenDishes.some((d) => isDishMatchingDiet(d, "jain"));
  }

  return true;
}

/**
 * Normalizes text for search matching:
 * - Converts to lower case
 * - Strips apostrophes / smart quotes (Yash's -> Yashs)
 * - Converts symbols / punctuation to spaces
 * - Collapses repeated whitespace
 */
export function normalizeSearchString(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks whether a target string (e.g. Kitchen Name, Dish Name) matches a user query.
 * Matches:
 * - Direct substring matches (case-insensitive)
 * - Normalized matches (ignoring apostrophes, symbols, casing)
 * - Singular/plural / possessive variations (e.g. 'yash' matches 'yashs', 'yashs' matches 'yash', 'yash's' matches 'yash')
 * - Digit-only matches (e.g. '712' matches '7/12')
 * - Word token / multi-word prefix matching
 */
export function matchesSearchQuery(
  targetText: string | null | undefined,
  query: string | null | undefined
): boolean {
  if (!query || !query.trim()) return true;
  if (!targetText || !targetText.trim()) return false;

  const rawTarget = targetText.toLowerCase().trim();
  const rawQuery = query.toLowerCase().trim();

  // 1. Exact or direct raw substring match
  if (rawTarget.includes(rawQuery)) return true;

  // 2. Normalized match (punctuation & apostrophes stripped)
  const normTarget = normalizeSearchString(targetText);
  const normQuery = normalizeSearchString(query);

  if (!normQuery) return true;
  if (normTarget.includes(normQuery)) return true;

  // 3. Compact match (all spaces and symbols stripped, e.g. "7/12" vs "712", "cloudkitchen" vs "cloud kitchen")
  const compactTarget = normTarget.replace(/\s+/g, "");
  const compactQuery = normQuery.replace(/\s+/g, "");
  if (compactTarget.includes(compactQuery) || compactQuery.includes(compactTarget)) return true;

  // 4. Stemmed / possessive match (strip trailing 's')
  const stem = (str: string) => str.replace(/\bs\b/g, "").replace(/s\b/g, "");
  const stemmedTarget = stem(normTarget);
  const stemmedQuery = stem(normQuery);
  if (stemmedTarget.includes(stemmedQuery) || normTarget.includes(stemmedQuery)) return true;

  // 5. Multi-token word match (all query words must match a part of target words)
  const queryTokens = normQuery.split(" ").filter(Boolean);
  const targetTokens = normTarget.split(" ").filter(Boolean);

  if (queryTokens.length > 0) {
    const allTokensMatch = queryTokens.every((qToken) => {
      const qTokenStem = qToken.endsWith("s") ? qToken.slice(0, -1) : qToken;
      return targetTokens.some((tToken) => {
        const tTokenStem = tToken.endsWith("s") ? tToken.slice(0, -1) : tToken;
        return (
          tToken.includes(qToken) ||
          (qTokenStem && tToken.includes(qTokenStem)) ||
          (tTokenStem && qToken.includes(tTokenStem))
        );
      });
    });
    if (allTokensMatch) return true;
  }

  return false;
}

export function matchesDishSearch(
  query: string | null | undefined,
  dish: {
    name?: string | null;
    categoryName?: string | null;
    description?: string | null;
    sellerName?: string | null;
  }
): boolean {
  if (!query || !query.trim()) return true;
  return (
    matchesSearchQuery(dish.name, query) ||
    matchesSearchQuery(dish.categoryName, query) ||
    matchesSearchQuery(dish.description, query) ||
    matchesSearchQuery(dish.sellerName, query)
  );
}

export function matchesKitchenOrDishSearch(
  query: string | null | undefined,
  kitchen: {
    id?: string | null;
    trackingId?: string | null;
    name?: string | null;
    category?: string | null;
    foodType?: string | null;
    locality?: string | null;
  },
  foodItems?: Array<{
    sellerId?: string | null;
    sellerTrackingId?: string | null;
    sellerName?: string | null;
    name?: string | null;
    categoryName?: string | null;
    description?: string | null;
  }>
): boolean {
  if (!query || !query.trim()) return true;

  // 1. Check kitchen metadata
  if (
    matchesSearchQuery(kitchen.name, query) ||
    matchesSearchQuery(kitchen.category, query) ||
    matchesSearchQuery(kitchen.foodType, query) ||
    matchesSearchQuery(kitchen.locality, query)
  ) {
    return true;
  }

  // 2. Check child dishes
  if (foodItems && foodItems.length > 0) {
    const kitchenDishes = foodItems.filter(
      (f) =>
        (kitchen.id && f.sellerId === kitchen.id) ||
        (kitchen.trackingId && f.sellerTrackingId === kitchen.trackingId) ||
        (kitchen.id && f.sellerTrackingId === kitchen.id)
    );

    return kitchenDishes.some((d) => matchesDishSearch(query, d));
  }

  return false;
}

