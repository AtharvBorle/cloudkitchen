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
  "dairy-free",
  "dairy free",
  "tofu",
  "soy milk",
  "almond milk",
  "oat milk",
  "vegan cheese",
  "mock meat",
  "soya chaap",
  "smoothie bowl",
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
  "prawns",
  "honey",
  "mayonnaise",
  "mayo",
  "buttermilk",
  "whey",
  "makkhan",
  "makhan",
  "beef",
  "pork",
  "seafood",
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
  "jain dal",
  "jain paneer",
  "jain sabji",
  "jain meal",
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
  "eggs",
  "fish",
  "meat",
  "prawn",
  "prawns",
  "seafood",
  "pork",
  "beef",
  "kanda",
  "lasun",
  "pyaz",
  "lahsun",
  "batata",
  "scallion",
  "scallions",
  "chives",
  "leek",
  "leeks",
  "shallot",
  "shallots",
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
      rawType === "VEGAN"
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
      text.includes("satvik") ||
      text.includes("swaminarayan")
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
    if (rawFoodType === "PURE_VEG" || rawFoodType === "VEGAN" || rawFoodType === "JAIN") return false;
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
    if (rawFoodType === "NON_VEG" || rawFoodType === "NON-VEG") {
      return kitchenDishes.length > 0 && kitchenDishes.some((d) => isDishMatchingDiet(d, "vegan"));
    }
    if (rawFoodType === "VEGAN") return true;
    if (
      text.includes("vegan") ||
      text.includes("plant-based") ||
      text.includes("plant based") ||
      text.includes("dairy-free") ||
      text.includes("dairy free")
    ) {
      return true;
    }
    return kitchenDishes.length > 0 && kitchenDishes.some((d) => isDishMatchingDiet(d, "vegan"));
  }

  if (norm === "jain") {
    if (rawFoodType === "NON_VEG" || rawFoodType === "NON-VEG") {
      return false;
    }
    if (rawFoodType === "JAIN") return true;
    if (
      text.includes("jain") ||
      text.includes("satvik") ||
      text.includes("swaminarayan") ||
      text.includes("no onion no garlic")
    ) {
      return true;
    }
    return kitchenDishes.length > 0 && kitchenDishes.some((d) => isDishMatchingDiet(d, "jain"));
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

export const FOOD_TAG_KEYWORDS: Record<string, string[]> = {
  pizza: ["pizza", "pizzas", "margherita", "italian", "calzone", "crust", "cheese pizza", "pan pizza", "pasta"],
  "lemon-rice": ["lemon rice", "lemon", "rice", "bhaat", "chawal", "pulao", "curd rice", "south indian", "fried rice", "jeera rice", "dal khichdi", "khichdi"],
  "lemon rice": ["lemon rice", "lemon", "rice", "bhaat", "chawal", "pulao", "curd rice", "south indian", "fried rice", "jeera rice", "dal khichdi", "khichdi"],
  burger: ["burger", "burgers", "hamburger", "cheeseburger", "veg burger", "crispy burger", "patty", "sandwich", "sandwiches", "fries", "fast food", "wrap", "roll", "snack"],
  thali: ["thali", "thalis", "meal", "meals", "homemeal", "mess", "lunch", "dinner", "tiffin", "roti", "chapati", "dal", "sabzi", "sabji", "poli", "bhaat", "maharashtrian", "gujarati", "punjabi thali", "deluxe thali", "special thali", "veg thali", "non veg thali"],
  biryani: ["biryani", "biryanis", "dum biryani", "hyderabadi", "chicken biryani", "veg biryani", "pulao", "rice", "mughlai"],
  cake: ["cake", "cakes", "pastry", "pastries", "dessert", "desserts", "bakery", "sweet", "brownie", "mousse", "cupcake", "chocolate cake", "biscuit", "pie"],
  healthy: ["healthy", "salad", "salads", "bowl", "bowls", "organic", "diet", "sprouts", "fruit", "fruits", "juice", "juices", "smoothie", "vegan", "keto", "oats", "greens", "avocado"],
};

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
  const q = query.toLowerCase().trim();

  // 1. Direct standard search query matches
  if (
    matchesSearchQuery(dish.name, q) ||
    matchesSearchQuery(dish.categoryName, q) ||
    matchesSearchQuery(dish.description, q) ||
    matchesSearchQuery(dish.sellerName, q)
  ) {
    return true;
  }

  // 2. Tag / category semantic alias expansion
  const normKey = q.replace(/[^a-z0-9]/g, "");
  for (const [tagKey, keywords] of Object.entries(FOOD_TAG_KEYWORDS)) {
    const cleanTagKey = tagKey.replace(/[^a-z0-9]/g, "");
    if (cleanTagKey === normKey || keywords.some((kw) => kw.replace(/[^a-z0-9]/g, "") === normKey)) {
      const dishText = `${dish.name || ""} ${dish.categoryName || ""} ${dish.description || ""}`.toLowerCase();
      if (keywords.some((kw) => dishText.includes(kw) || matchesSearchQuery(dishText, kw))) {
        return true;
      }
    }
  }

  return false;
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
  const q = query.toLowerCase().trim();

  // 1. Check direct kitchen metadata
  if (
    matchesSearchQuery(kitchen.name, q) ||
    matchesSearchQuery(kitchen.category, q) ||
    matchesSearchQuery(kitchen.foodType, q) ||
    matchesSearchQuery(kitchen.locality, q)
  ) {
    return true;
  }

  // 2. Semantic aliases against kitchen metadata
  const normKey = q.replace(/[^a-z0-9]/g, "");
  for (const [tagKey, keywords] of Object.entries(FOOD_TAG_KEYWORDS)) {
    const cleanTagKey = tagKey.replace(/[^a-z0-9]/g, "");
    if (cleanTagKey === normKey || keywords.some((kw) => kw.replace(/[^a-z0-9]/g, "") === normKey)) {
      const kText = `${kitchen.name || ""} ${kitchen.category || ""} ${kitchen.foodType || ""}`.toLowerCase();
      if (keywords.some((kw) => kText.includes(kw) || matchesSearchQuery(kText, kw))) {
        return true;
      }
    }
  }

  // 3. Check child dishes (matching by sellerId, trackingId, cross-ID, or sellerName)
  if (foodItems && foodItems.length > 0) {
    const kitchenDishes = foodItems.filter((f) => {
      const matchId = kitchen.id && f.sellerId && String(f.sellerId).toLowerCase() === String(kitchen.id).toLowerCase();
      const matchTracking = kitchen.trackingId && f.sellerTrackingId && String(f.sellerTrackingId).toLowerCase() === String(kitchen.trackingId).toLowerCase();
      const matchCrossId =
        (kitchen.id && f.sellerTrackingId && String(f.sellerTrackingId).toLowerCase() === String(kitchen.id).toLowerCase()) ||
        (kitchen.trackingId && f.sellerId && String(f.sellerId).toLowerCase() === String(kitchen.trackingId).toLowerCase());
      const matchName = kitchen.name && f.sellerName && kitchen.name.toLowerCase().trim() === f.sellerName.toLowerCase().trim();
      return matchId || matchTracking || matchCrossId || matchName;
    });

    if (kitchenDishes.length > 0) {
      return kitchenDishes.some((d) => matchesDishSearch(q, d));
    }
  }

  return false;
}

