/**
 * Address Validation & Duplicate Detection Utilities
 * Handles typo-tolerance, abbreviations normalization, phonetic / Levenshtein distance,
 * and multi-level similarity comparisons.
 */

// Common address abbreviation and common typo synonym dictionary
const ABBREVIATIONS_MAP: Record<string, string> = {
  rd: "road",
  st: "street",
  str: "street",
  ave: "avenue",
  av: "avenue",
  apt: "apartment",
  apts: "apartment",
  appartment: "apartment",
  appartments: "apartment",
  bldg: "building",
  bld: "building",
  buildng: "building",
  flr: "floor",
  fl: "floor",
  opp: "opposite",
  opposite: "opposite",
  nr: "near",
  soc: "society",
  sociaty: "society",
  hsg: "housing",
  pk: "park",
  pvt: "private",
  ltd: "limited",
  llp: "llp",
  sec: "sector",
  ph: "phase",
  kothrudh: "kothrud",
  khotrud: "kothrud",
  kotrud: "kothrud",
  khothrud: "kothrud",
  hinjewadi: "hinjawadi",
  hinjewadii: "hinjawadi",
  aund: "aundh",
  aundhh: "aundh",
  banerr: "baner",
  viman: "viman",
  vimannagar: "viman nagar",
  nagar: "nagar",
  ngr: "nagar",
  flyover: "flyover",
  flyovr: "flyover",
};

/**
 * Calculates standard Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const m = a.length;
  const n = b.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[m][n];
}

/**
 * Calculates normalized similarity score between two strings (0.0 to 1.0)
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeAddressText(s1);
  const norm2 = normalizeAddressText(s2);
  if (!norm1 && !norm2) return 1;
  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1;

  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(norm1, norm2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Cleans, lowercases, and expands abbreviations in address text
 */
export function normalizeAddressText(text: string): string {
  if (!text) return "";
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned
    .split(" ")
    .map((w) => ABBREVIATIONS_MAP[w] || w)
    .filter(Boolean);

  return words.join(" ");
}

/**
 * Checks if two token lists have high fuzzy overlap (handling typos in individual words)
 */
export function areAddressTokensSimilar(tokens1: string[], tokens2: string[]): boolean {
  if (tokens1.length === 0 || tokens2.length === 0) return false;

  let matchCount = 0;
  for (const t1 of tokens1) {
    const isMatched = tokens2.some((t2) => {
      if (t1 === t2) return true;
      if (t1.length >= 3 && t2.length >= 3) {
        const dist = levenshteinDistance(t1, t2);
        return dist <= 1 || calculateStringSimilarity(t1, t2) >= 0.75;
      }
      return false;
    });
    if (isMatched) matchCount++;
  }

  const score = (2 * matchCount) / (tokens1.length + tokens2.length);
  return score >= 0.65;
}

export interface AddressComparable {
  id?: string;
  houseNumber?: string;
  street?: string;
  pincode?: string;
  landmark?: string | null;
  type?: string;
}

/**
 * Evaluates if two addresses represent the same physical destination
 */
export function isSameAddress(
  a: AddressComparable,
  b: AddressComparable
): boolean {
  const normA_Pin = (a.pincode || "").replace(/\D/g, "");
  const normB_Pin = (b.pincode || "").replace(/\D/g, "");

  // If both have 6-digit pincodes and they differ, they are in different postal zones
  if (normA_Pin.length === 6 && normB_Pin.length === 6 && normA_Pin !== normB_Pin) {
    return false;
  }

  const normA_House = normalizeAddressText(a.houseNumber || "");
  const normB_House = normalizeAddressText(b.houseNumber || "");
  const normA_Street = normalizeAddressText(a.street || "");
  const normB_Street = normalizeAddressText(b.street || "");

  // 1. Exact house & street match
  if (normA_House && normA_Street && normA_House === normB_House && normA_Street === normB_Street) {
    return true;
  }

  // 2. Full combined string without spaces
  const fullA = `${normA_House} ${normA_Street}`.trim();
  const fullB = `${normB_House} ${normB_Street}`.trim();

  if (fullA.length >= 6 && fullA.replace(/\s/g, "") === fullB.replace(/\s/g, "")) {
    return true;
  }

  // 3. String similarity on full address lines (handles typos like kothrudh vs kothrud)
  const similarity = calculateStringSimilarity(fullA, fullB);
  if (similarity >= 0.75) {
    return true;
  }

  // 4. Token-level fuzzy comparison
  const tokensA = fullA.split(" ").filter((t) => t.length > 0);
  const tokensB = fullB.split(" ").filter((t) => t.length > 0);
  if (areAddressTokensSimilar(tokensA, tokensB)) {
    // If house numbers match or house similarity is high
    const houseSim = calculateStringSimilarity(normA_House, normB_House);
    if (houseSim >= 0.7 || tokensA.length >= 4) {
      return true;
    }
  }

  // 5. Cross-field swap check (house in street field, street in house field)
  if (
    calculateStringSimilarity(normA_House, normB_Street) >= 0.8 &&
    calculateStringSimilarity(normA_Street, normB_House) >= 0.8
  ) {
    return true;
  }

  return false;
}

/**
 * Searches a list of saved addresses for duplicates matching candidate address
 */
export function findDuplicateAddress<T extends AddressComparable>(
  candidate: AddressComparable,
  savedAddresses: T[],
  ignoreId: string | null = null
): { isDuplicate: boolean; matchedItem: T | null; message: string | null } {
  const trimmedHouse = (candidate.houseNumber || "").trim();
  const trimmedStreet = (candidate.street || "").trim();
  const cleanPin = (candidate.pincode || "").replace(/\D/g, "").slice(0, 6);

  if (!trimmedHouse || !trimmedStreet || cleanPin.length !== 6) {
    return { isDuplicate: false, matchedItem: null, message: null };
  }

  for (const item of savedAddresses) {
    if (ignoreId && item.id === ignoreId) continue;
    if (isSameAddress(candidate, item)) {
      const formattedExisting = `${item.houseNumber}, ${item.street} - ${item.pincode}`;
      return {
        isDuplicate: true,
        matchedItem: item,
        message: `This address matches your saved address "${formattedExisting}". Please modify the details or use your existing address.`,
      };
    }
  }

  return { isDuplicate: false, matchedItem: null, message: null };
}

/**
 * Finds all duplicate address IDs from an existing address list
 */
export function findDuplicateAddressIds<T extends AddressComparable>(addresses: T[]): Set<string> {
  const dupSet = new Set<string>();
  for (let i = 0; i < addresses.length; i++) {
    for (let j = i + 1; j < addresses.length; j++) {
      if (isSameAddress(addresses[i], addresses[j])) {
        if (addresses[j].id) {
          dupSet.add(addresses[j].id as string);
        }
      }
    }
  }
  return dupSet;
}
