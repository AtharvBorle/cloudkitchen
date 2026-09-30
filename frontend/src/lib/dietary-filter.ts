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

  const raw = String(dish.itemType || "")
    .toUpperCase()
    .replace(/[\s-]/g, "_");
  const tokens = raw.split(",").map((s) => s.trim());

  const isNonVeg =
    tokens.some((t) => t === "NON_VEG" || t === "NONVEG" || t === "NON_VEGETARIAN") ||
    raw.includes("NON_VEG");

  const isVegan =
    tokens.some((t) => t === "VEGAN" || t === "PLANT_BASED") ||
    raw.includes("VEGAN");

  const isJain =
    tokens.some((t) => t === "JAIN" || t === "SATVIK") ||
    raw.includes("JAIN") ||
    raw.includes("SATVIK");

  const isVeg =
    tokens.some((t) => t === "VEG" || t === "PURE_VEG" || t === "VEGETARIAN") ||
    raw.includes("VEG") ||
    raw.includes("PURE_VEG") ||
    isVegan ||
    isJain;

  const text = `${dish.name || ""} ${dish.description || ""} ${dish.categoryName || ""}`.toLowerCase();

  if (norm === "veg") {
    if (isNonVeg) return false;
    if (isVeg || isVegan || isJain) return true;
    const containsNonVegStrict = NON_VEG_STRICT_WORDS.some((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      return regex.test(text);
    });
    return !containsNonVegStrict;
  }

  if (norm === "non_veg") {
    if (isNonVeg) return true;
    if (isVeg || isVegan || isJain) return false;
    return NON_VEG_STRICT_WORDS.some((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      return regex.test(text);
    });
  }

  if (norm === "vegan") {
    if (isNonVeg) return false;
    if (isVegan) return true;
    const hasDairy = NON_VEGAN_WORDS.some((w) => {
      const regex = new RegExp(`\\b${w}\\b`, "i");
      return regex.test(text);
    });
    if (hasDairy) return false;
    return (
      VEGAN_POSITIVE_WORDS.some((w) => text.includes(w)) ||
      text.includes("vegan") ||
      text.includes("plant-based") ||
      text.includes("plant based")
    );
  }

  if (norm === "jain") {
    if (isNonVeg) return false;
    if (isJain) return true;
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

  const rawFoodType = (kitchen.foodType || "").toUpperCase().replace(/[\s-]/g, "_").trim();
  const kitchenText = `${kitchen.name || ""} ${kitchen.category || ""}`.toLowerCase();

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
    if (rawFoodType === "BOTH") {
      return kitchenDishes.length === 0 || kitchenDishes.some((d) => isDishMatchingDiet(d, "veg"));
    }
    if (rawFoodType === "NON_VEG") {
      return kitchenDishes.length > 0 && kitchenDishes.some((d) => isDishMatchingDiet(d, "veg"));
    }
    return kitchenDishes.length === 0 || kitchenDishes.some((d) => isDishMatchingDiet(d, "veg"));
  }

  if (norm === "non_veg") {
    if (rawFoodType === "PURE_VEG" || rawFoodType === "VEGAN" || rawFoodType === "JAIN") return false;
    if (rawFoodType === "NON_VEG" || rawFoodType === "BOTH") {
      return kitchenDishes.length === 0 || kitchenDishes.some((d) => isDishMatchingDiet(d, "non_veg"));
    }
    if (
      kitchenText.includes("non-veg") ||
      kitchenText.includes("non veg") ||
      kitchenText.includes("biryani") ||
      kitchenText.includes("chicken") ||
      kitchenText.includes("meat") ||
      kitchenText.includes("fish")
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
      kitchenText.includes("vegan") ||
      kitchenText.includes("plant-based") ||
      kitchenText.includes("plant based") ||
      kitchenText.includes("dairy-free") ||
      kitchenText.includes("dairy free")
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
      kitchenText.includes("jain") ||
      kitchenText.includes("satvik") ||
      kitchenText.includes("swaminarayan") ||
      kitchenText.includes("no onion no garlic")
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

  // 3. Compact match (all spaces and symbols stripped, e.g. "7/12" vs "712")
  const compactTarget = normTarget.replace(/\s+/g, "");
  const compactQuery = normQuery.replace(/\s+/g, "");
  if (compactTarget.includes(compactQuery)) return true;

  // 4. Stemmed match (strip trailing 's')
  const stem = (str: string) => str.replace(/\bs\b/g, "").replace(/s\b/g, "");
  const stemmedTarget = stem(normTarget);
  const stemmedQuery = stem(normQuery);
  if (stemmedTarget.includes(stemmedQuery)) return true;

  return false;
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface CategoryRule {
  categoryNames: string[];
  namePatterns: RegExp[];
  descriptionPatterns?: RegExp[];
}

export const CATEGORY_RULES: Record<string, CategoryRule> = {
  burger: {
    categoryNames: ["burger", "burgers"],
    namePatterns: [/\b(burger|burgers|cheeseburger|hamburger|whopper|slider|sliders)\b/i],
  },
  cake: {
    categoryNames: ["cake", "cakes", "pastry", "pastries", "bakery", "cupcake", "cupcakes"],
    namePatterns: [/\b(cake|cakes|pastry|pastries|cupcake|cupcakes|brownie|brownies|black forest|red velvet|cheesecake|mousse|lava cake|truffle cake)\b/i],
  },
  pastry: {
    categoryNames: ["pastry", "pastries", "cake", "cakes", "bakery", "cupcake", "cupcakes"],
    namePatterns: [/\b(pastry|pastries|cake|cakes|cupcake|cupcakes|brownie|brownies|black forest|red velvet|cheesecake|lava cake)\b/i],
  },
  pizza: {
    categoryNames: ["pizza", "pizzas", "calzone"],
    namePatterns: [/\b(pizza|pizzas|margherita|calzone)\b/i],
  },
  shake: {
    categoryNames: ["shake", "shakes", "milkshake", "milkshakes", "smoothie", "smoothies", "thickshake", "thickshakes"],
    namePatterns: [/\b(shake|shakes|milkshake|milkshakes|smoothie|smoothies|thickshake|thick shake|cold coffee|frappe|lassi|mastani)\b/i],
  },
  biryani: {
    categoryNames: ["biryani", "biryanis", "pulao"],
    namePatterns: [/\b(biryani|biryanis|pulao|dum biryani|hyderabadi biryani|murgh biryani)\b/i],
  },
  meal: {
    categoryNames: ["meal", "meals", "thali", "thalis", "tiffin", "combo meal", "combo meals"],
    namePatterns: [/\b(meal|meals|thali|thalis|tiffin|combo meal|mini meal|executive meal|deluxe meal|dal fry meal|paneer meal|chicken meal|veg meal|non veg meal)\b/i],
  },
  mess: {
    categoryNames: ["mess", "daily mess", "student mess", "tiffin service"],
    namePatterns: [/\b(mess|daily mess|monthly mess|tiffin service|dabba)\b/i],
  },
  thali: {
    categoryNames: ["thali", "thalis", "full meal", "mini meal", "thali meal", "deluxe thali"],
    namePatterns: [/\b(thali|thalis|deluxe thali|special thali|gujarati thali|punjabi thali|maharashtrian thali|rajasthani thali|veg thali|non veg thali|jain thali|mini meal|executive meal)\b/i, /\bthali\b/i],
    descriptionPatterns: [/\b(thali|thalis|full meal|mini meal|complete meal|chapati.*dal|roti.*sabzi|rice.*dal.*sabzi)\b/i],
  },
  dalrice: {
    categoryNames: ["dalrice", "dal rice", "dal-rice", "khichdi", "dal khichdi"],
    namePatterns: [/\b(dal\s*rice|dalrice|dal\s*khichdi|varan\s*bhat|dal\s*fry\s*rice|dal\s*tadka\s*rice|khichdi)\b/i],
  },
  "dal rice": {
    categoryNames: ["dalrice", "dal rice", "dal-rice", "khichdi", "dal khichdi"],
    namePatterns: [/\b(dal\s*rice|dalrice|dal\s*khichdi|varan\s*bhat|dal\s*fry\s*rice|dal\s*tadka\s*rice|khichdi)\b/i],
  },
  dosa: {
    categoryNames: ["dosa", "dosas"],
    namePatterns: [/\b(dosa|dosas|masala dosa|plain dosa|mysore dosa|rava dosa|set dosa|uttapam|uttapams)\b/i],
  },
  idli: {
    categoryNames: ["idli", "idlis", "idly"],
    namePatterns: [/\b(idli|idlis|idly|rava idli|steamed idli|medu vada|vada sambar|sambar vada)\b/i],
  },
  pohe: {
    categoryNames: ["pohe", "poha"],
    namePatterns: [/\b(pohe|poha|kanda pohe|kanda poha|batata pohe|batata poha|indori poha|dadpe pohe)\b/i],
  },
  poha: {
    categoryNames: ["pohe", "poha"],
    namePatterns: [/\b(pohe|poha|kanda pohe|kanda poha|batata pohe|batata poha|indori poha|dadpe pohe)\b/i],
  },
  sabudana: {
    categoryNames: ["sabudana"],
    namePatterns: [/\b(sabudana|sabudana khichdi|sabudana vada|sabudana usal)\b/i],
  },
  shira: {
    categoryNames: ["shira", "sheera", "halwa"],
    namePatterns: [/\b(shira|sheera|suji halwa|sooji halwa|moong dal halwa|gajar halwa|halwa|prasad)\b/i],
  },
  sheera: {
    categoryNames: ["shira", "sheera", "halwa"],
    namePatterns: [/\b(shira|sheera|suji halwa|sooji halwa|moong dal halwa|gajar halwa|halwa|prasad)\b/i],
  },
  upma: {
    categoryNames: ["upma"],
    namePatterns: [/\b(upma|rava upma|sooji upma)\b/i],
  },
  healthy: {
    categoryNames: ["healthy", "salad", "salads", "organic", "diet", "dietary", "nutrition", "fitness", "keto", "vegan", "raw", "greens", "superfood"],
    namePatterns: [
      /\b(healthy|health|salad|salads|sprouts?|fruit\s*bowl|protein\s*bowl|green\s*salad|keto|diet|detox|organic|nutritious|superfood|smoothie|quinoa|oats|oatmeal|boiled|steamed|grilled\s*paneer|grilled\s*chicken|whole\s*wheat|multigrain|veggie\s*wrap|vegetable\s*salad|avocado|soup)\b/i,
    ],
    descriptionPatterns: [
      /\b(vegetables?|veggies?|boiled|steamed|salads?|whole\s*wheat|whole-wheat|multigrain|multi-grain|wrap|wraps|grilled\s*paneer|grilled\s*chicken|grilled|quinoa|sprouts?|sprouted|oats|oatmeal|protein|high\s*protein|avocado|fruits?|fruit\s*bowl|greens?|diet|keto|sugar\s*free|sugar-free|no\s*sugar|low\s*calorie|low\s*fat|oil\s*free|less\s*oil|superfood|satvik|organic|nutritious|raw|clean\s*eating|fiber|chia|flax|flaxseed)\b/i,
    ],
  },
  dessert: {
    categoryNames: ["dessert", "desserts", "sweet", "sweets", "bakery", "ice cream"],
    namePatterns: [/\b(dessert|desserts|sweet|sweets|halwa|shira|sheera|ice cream|kheer|gulab jamun|rasgulla|pastry|pastries|cake|cakes|brownie|brownies|waffle|waffles)\b/i],
  },
  desserts: {
    categoryNames: ["dessert", "desserts", "sweet", "sweets", "bakery", "ice cream"],
    namePatterns: [/\b(dessert|desserts|sweet|sweets|halwa|shira|sheera|ice cream|kheer|gulab jamun|rasgulla|pastry|pastries|cake|cakes|brownie|brownies|waffle|waffles)\b/i],
  },
  drinks: {
    categoryNames: ["drinks", "drink", "beverage", "beverages", "juice", "juices", "tea", "coffee"],
    namePatterns: [/\b(drink|drinks|beverage|beverages|shake|shakes|milkshake|juice|juices|chai|tea|coffee|cold coffee|lassi|lemonade|mojito|soda)\b/i],
  },
  drink: {
    categoryNames: ["drinks", "drink", "beverage", "beverages", "juice", "juices", "tea", "coffee"],
    namePatterns: [/\b(drink|drinks|beverage|beverages|shake|shakes|milkshake|juice|juices|chai|tea|coffee|cold coffee|lassi|lemonade|mojito|soda)\b/i],
  },
  beverages: {
    categoryNames: ["drinks", "drink", "beverage", "beverages", "juice", "juices", "tea", "coffee"],
    namePatterns: [/\b(drink|drinks|beverage|beverages|shake|shakes|milkshake|juice|juices|chai|tea|coffee|cold coffee|lassi|lemonade|mojito|soda)\b/i],
  },
  beverage: {
    categoryNames: ["drinks", "drink", "beverage", "beverages", "juice", "juices", "tea", "coffee"],
    namePatterns: [/\b(drink|drinks|beverage|beverages|shake|shakes|milkshake|juice|juices|chai|tea|coffee|cold coffee|lassi|lemonade|mojito|soda)\b/i],
  },
  snacks: {
    categoryNames: ["snacks", "snack", "street food", "starters"],
    namePatterns: [/\b(snack|snacks|samosa|samosas|kachori|pakoda|pakode|bhajiya|fries|french fries|nachos|chaat|pani puri|sev puri|bhel|vada pav|dabeli|pohe|poha|sabudana vada)\b/i],
  },
  snack: {
    categoryNames: ["snacks", "snack", "street food", "starters"],
    namePatterns: [/\b(snack|snacks|samosa|samosas|kachori|pakoda|pakode|bhajiya|fries|french fries|nachos|chaat|pani puri|sev puri|bhel|vada pav|dabeli|pohe|poha|sabudana vada)\b/i],
  },
  chinese: {
    categoryNames: ["chinese", "indo-chinese", "pan asian", "asian"],
    namePatterns: [/\b(noodles|hakka noodles|chowmein|chow mein|fried rice|manchurian|momos|momo|spring roll|spring rolls|chilli paneer|chilli chicken|schezwan|dimsum|dim sum)\b/i],
  },
  roll: {
    categoryNames: ["roll", "rolls", "wraps", "wrap"],
    namePatterns: [/\b(roll|rolls|wrap|wraps|frankie|frankies|kathi roll|shawarma)\b/i],
  },
  sandwich: {
    categoryNames: ["sandwich", "sandwiches"],
    namePatterns: [/\b(sandwich|sandwiches|toast|panini|grilled sandwich|club sandwich)\b/i],
  },
};

export const CATEGORY_ALIASES: Record<string, string[]> = {
  cake: ["cake", "cakes", "black forest", "pastry", "pastries", "mousse", "cupcake", "brownie", "dessert", "desserts", "sweet", "sweets", "bakery"],
  pastry: ["pastry", "pastries", "cake", "cakes", "black forest", "brownie", "dessert", "desserts", "bakery"],
  burger: ["burger", "burgers", "hamburger", "cheeseburger", "veg burger", "crispy burger"],
  meal: ["meal", "meals", "thali", "thalis", "homemeal", "tiffin", "combo meal"],
  mess: ["mess", "daily mess", "student mess", "homely mess", "tiffin", "subscription"],
  thali: ["thali", "thalis", "punjabi thali", "gujarati thali", "maharashtrian thali", "deluxe thali", "special thali", "veg thali", "non veg thali", "jain thali"],
  biryani: ["biryani", "biryanis", "dum biryani", "hyderabadi", "chicken biryani", "veg biryani", "pulao"],
  pizza: ["pizza", "pizzas", "margherita", "calzone", "pan pizza", "cheese pizza"],
  shake: ["shake", "shakes", "milkshake", "thick shake", "smoothie", "cold coffee", "oreo shake", "mango shake", "lassi"],
  dalrice: ["dalrice", "dal rice", "dal-rice", "dal khichdi", "varan bhat", "dal fry rice", "khichdi"],
  "dal rice": ["dalrice", "dal rice", "dal-rice", "dal khichdi", "varan bhat", "dal fry rice", "khichdi"],
  dosa: ["dosa", "dosas", "masala dosa", "plain dosa", "mysore dosa", "paper dosa", "set dosa", "onion dosa", "rava dosa", "south indian", "uttapam"],
  idli: ["idli", "idlis", "idly", "rava idli", "steamed idli", "button idli", "south indian", "vada", "medu vada"],
  pohe: ["pohe", "poha", "kanda poha", "batata poha", "indori poha"],
  poha: ["pohe", "poha", "kanda poha", "batata poha", "indori poha"],
  sabudana: ["sabudana", "sabudana khichdi", "sabudana vada", "sabudana usal"],
  shira: ["shira", "sheera", "suji halwa", "sooji halwa", "halwa"],
  sheera: ["shira", "sheera", "suji halwa", "sooji halwa", "halwa"],
  upma: ["upma", "rava upma", "sooji upma"],
  healthy: ["healthy", "salad", "salads", "bowl", "organic", "diet", "sprouts", "vegetables", "vegetable", "veggies", "boiled", "steamed", "whole wheat", "wrap", "grilled paneer", "quinoa", "protein", "smoothie", "avocado", "keto"],
  dessert: ["dessert", "desserts", "sweet", "sweets", "cake", "pastry", "shira", "halwa", "brownie", "ice cream", "kheer", "gulab jamun"],
  desserts: ["dessert", "desserts", "sweet", "sweets", "cake", "pastry", "shira", "halwa", "brownie", "ice cream", "kheer", "gulab jamun"],
  drinks: ["drinks", "drink", "beverages", "beverage", "tea", "chai", "coffee", "juice", "juices", "shake", "shakes", "milkshake", "smoothie", "cold coffee", "lassi"],
  drink: ["drinks", "drink", "beverages", "beverage", "tea", "chai", "coffee", "juice", "juices", "shake", "shakes", "milkshake", "smoothie", "cold coffee", "lassi"],
  beverages: ["drinks", "drink", "beverages", "beverage", "tea", "chai", "coffee", "juice", "juices", "shake", "shakes", "milkshake", "smoothie", "cold coffee", "lassi"],
  beverage: ["drinks", "drink", "beverages", "beverage", "tea", "chai", "coffee", "juice", "juices", "shake", "shakes", "milkshake", "smoothie", "cold coffee", "lassi"],
  snacks: ["snacks", "snack", "samosa", "kachori", "chaat", "pakoda", "bhajiya", "fries", "pohe", "poha", "sabudana"],
  snack: ["snacks", "snack", "samosa", "kachori", "chaat", "pakoda", "bhajiya", "fries", "pohe", "poha", "sabudana"],
  chinese: ["chinese", "noodles", "fried rice", "manchurian", "momos", "spring roll", "chilli paneer", "hakka noodles", "schezwan"],
  roll: ["roll", "rolls", "wrap", "wraps", "kathi roll", "paneer roll", "chicken roll", "egg roll", "frankie"],
  sandwich: ["sandwich", "sandwiches", "toast", "grilled sandwich", "club sandwich", "cheese sandwich", "panini"],
};

export const FOOD_TAG_KEYWORDS = CATEGORY_ALIASES;

/**
 * Matches a single dish against a food category filter.
 * Strict category matching:
 * 1. Checks specific category name matches (ignoring generic words like 'Food').
 * 2. Checks word-bounded title matches based on category rules.
 * 3. Checks description for healthy / category-specific keywords.
 */
export function matchesDishCategory(
  category: string | null | undefined,
  dish: {
    name?: string | null;
    categoryName?: string | null;
    description?: string | null;
  }
): boolean {
  if (!category || !category.trim()) return true;
  const cleanCat = category.trim().toLowerCase();
  if (cleanCat === "all" || cleanCat === "food") return true;

  const catNorm = normalizeSearchString(category);
  const dishCatNorm = normalizeSearchString(dish.categoryName);
  const dishName = (dish.name || "").trim();
  const dishDesc = (dish.description || "").trim();

  // 1. Exact normalized category match (dish.categoryName === category, not 'food')
  if (dishCatNorm && dishCatNorm !== "food" && dishCatNorm === catNorm) {
    return true;
  }

  // 2. Check defined category rule
  const ruleKey = Object.keys(CATEGORY_RULES).find(
    (key) =>
      key.toLowerCase() === catNorm ||
      key.toLowerCase().replace(/[^a-z0-9]/g, "") === catNorm.replace(/[^a-z0-9]/g, "")
  );

  if (ruleKey) {
    const rule = CATEGORY_RULES[ruleKey];

    // Check if dish.categoryName matches any defined categoryNames (excluding generic 'food')
    if (dishCatNorm && dishCatNorm !== "food") {
      const isCatMatch = rule.categoryNames.some(
        (cn) => cn === dishCatNorm || dishCatNorm === normalizeSearchString(cn)
      );
      if (isCatMatch) return true;
    }

    // Check if dish.name matches any regex pattern
    if (dishName && rule.namePatterns.some((pat) => pat.test(dishName))) {
      return true;
    }

    // Check if dish.description matches any description or name regex patterns
    if (dishDesc) {
      if (rule.descriptionPatterns && rule.descriptionPatterns.some((pat) => pat.test(dishDesc))) {
        return true;
      }
      if (rule.namePatterns.some((pat) => pat.test(dishDesc))) {
        return true;
      }
    }

    return false;
  }

  // 3. Fallback for custom or unlisted categories (e.g. 'Pasta', 'Keto', etc.)
  if (dishCatNorm && dishCatNorm !== "food") {
    if (dishCatNorm === catNorm || dishCatNorm.includes(catNorm)) {
      return true;
    }
  }

  if (dishName) {
    const wordPattern = new RegExp(`\\b${escapeRegex(catNorm)}\\b`, "i");
    if (wordPattern.test(dishName)) {
      return true;
    }
  }

  if (dishDesc) {
    const wordPattern = new RegExp(`\\b${escapeRegex(catNorm)}\\b`, "i");
    if (wordPattern.test(dishDesc)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a kitchen serves dishes matching the requested food category.
 * A kitchen matches a category IF AND ONLY IF it has active menu items in that category.
 */
export function matchesKitchenCategoryFilter(
  category: string | null | undefined,
  kitchen: {
    id?: string | null;
    trackingId?: string | null;
    name?: string | null;
    category?: string | null;
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
  if (!category || !category.trim()) return true;
  const cleanCat = category.trim().toLowerCase();
  if (cleanCat === "all" || cleanCat === "food") return true;

  // 1. If food items are provided, check actual dishes of this kitchen first
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
      return kitchenDishes.some((dish) => matchesDishCategory(category, dish));
    }
  }

  // 2. Fallback only if no dishes loaded for this kitchen
  if (
    kitchen.category &&
    matchesDishCategory(category, { name: kitchen.category, categoryName: kitchen.category })
  ) {
    return true;
  }

  if (kitchen.name && matchesDishCategory(category, { name: kitchen.name, categoryName: kitchen.name })) {
    return true;
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

  // 2. Check if search query matches a category rule
  const normKey = normalizeSearchString(q);
  const ruleKey = Object.keys(CATEGORY_RULES).find(
    (key) =>
      key.toLowerCase() === normKey ||
      key.toLowerCase().replace(/[^a-z0-9]/g, "") === normKey.replace(/[^a-z0-9]/g, "")
  );

  if (ruleKey) {
    return matchesDishCategory(ruleKey, dish);
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

  // 1. Direct match on kitchen name
  if (matchesSearchQuery(kitchen.name, q)) {
    return true;
  }

  // 2. Check actual child dishes of this kitchen
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

  // 3. Fallback on locality or category ONLY if no dishes exist
  if (matchesSearchQuery(kitchen.locality, q) || matchesSearchQuery(kitchen.category, q)) {
    return true;
  }

  return false;
}

