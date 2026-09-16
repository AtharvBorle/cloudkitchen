"use client";

export interface SellerRegistrationDraft {
  // Step 1: Account
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  sellerRole: string;

  // Step 2: Business
  businessName: string;
  sellerType: "FOOD" | "PROPERTY" | "BOTH";
  categories: string[];
  foodType: "BOTH" | "PURE_VEG" | "NON_VEG";
  address: string;
  city?: string;
  pincode?: string;
  locationCoordinates?: { lat: number; lng: number };
  isLocationPinned?: boolean;

  // Step 3: Legal Documents & Banking
  identityProofFileName?: string;
  identityProofDataUrl?: string;
  fssaiLicenseFileName?: string;
  fssaiLicenseDataUrl?: string;
  utilityBillFileName?: string;
  utilityBillDataUrl?: string;
  bankAccountNumber?: string;
  ifscCode?: string;

  // Step 4: Media Photos (Data URLs)
  kitchenPhotos: (string | null)[];
  cuisinePhotos: (string | null)[];
  roomPhotos: (string | null)[];
}

const STORAGE_KEY = "neo_seller_registration_draft";

export const DEFAULT_SELLER_DRAFT: SellerRegistrationDraft = {
  ownerName: "",
  email: "",
  phone: "",
  password: "",
  sellerRole: "Owner",

  businessName: "",
  sellerType: "FOOD",
  categories: ["North Indian", "Biryani"],
  foodType: "BOTH",
  address: "",
  city: "Pune",
  pincode: "411038",
  locationCoordinates: { lat: 18.5204, lng: 73.8567 },
  isLocationPinned: true,

  identityProofFileName: "",
  identityProofDataUrl: "",
  fssaiLicenseFileName: "",
  fssaiLicenseDataUrl: "",
  utilityBillFileName: "",
  utilityBillDataUrl: "",
  bankAccountNumber: "",
  ifscCode: "",

  kitchenPhotos: [null, null, null, null],
  cuisinePhotos: [null, null, null, null],
  roomPhotos: [null, null],
};

export function getSellerDraft(): SellerRegistrationDraft {
  if (typeof window === "undefined") {
    return DEFAULT_SELLER_DRAFT;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SELLER_DRAFT;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SELLER_DRAFT,
      ...parsed,
      categories: Array.isArray(parsed.categories) ? parsed.categories : DEFAULT_SELLER_DRAFT.categories,
      kitchenPhotos: Array.isArray(parsed.kitchenPhotos) ? parsed.kitchenPhotos : DEFAULT_SELLER_DRAFT.kitchenPhotos,
      cuisinePhotos: Array.isArray(parsed.cuisinePhotos) ? parsed.cuisinePhotos : DEFAULT_SELLER_DRAFT.cuisinePhotos,
      roomPhotos: Array.isArray(parsed.roomPhotos) ? parsed.roomPhotos : DEFAULT_SELLER_DRAFT.roomPhotos,
    };
  } catch (err) {
    console.warn("Failed to read seller registration draft from sessionStorage:", err);
    return DEFAULT_SELLER_DRAFT;
  }
}

export function saveSellerDraft(partial: Partial<SellerRegistrationDraft>): SellerRegistrationDraft {
  if (typeof window === "undefined") return DEFAULT_SELLER_DRAFT;
  try {
    const current = getSellerDraft();
    const updated = { ...current, ...partial };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Failed to save seller registration draft to sessionStorage:", err);
    return getSellerDraft();
  }
}

export function clearSellerDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear seller registration draft:", err);
  }
}

/**
 * Converts a Base64 Data URL string to a browser File object for multipart form submissions.
 */
export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  if (!dataUrl || !dataUrl.includes(",")) return null;
  try {
    const parts = dataUrl.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (e) {
    console.error("Error converting data URL to file:", e);
    return null;
  }
}

/**
 * Reads a File as a base64 Data URL.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
