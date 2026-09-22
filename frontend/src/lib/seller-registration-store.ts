"use client";

export interface SellerRegistrationDraft {
  // Step 1: Account
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  sellerRole: string; // Hidden default "Owner"

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
const IDB_DB_NAME = "NeoSellerDB";
const IDB_STORE_NAME = "registration_draft";

export const DEFAULT_SELLER_DRAFT: SellerRegistrationDraft = {
  ownerName: "",
  email: "",
  phone: "",
  password: "",
  sellerRole: "Owner",

  businessName: "",
  sellerType: "FOOD",
  categories: [],
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

// Global memory cache attached to window to survive React re-mounts and Next.js route transitions
function getGlobalMemoryDraft(): SellerRegistrationDraft {
  if (typeof window !== "undefined") {
    if (!(window as any).__NEO_SELLER_DRAFT__) {
      (window as any).__NEO_SELLER_DRAFT__ = { ...DEFAULT_SELLER_DRAFT };
    }
    return (window as any).__NEO_SELLER_DRAFT__;
  }
  return { ...DEFAULT_SELLER_DRAFT };
}

function setGlobalMemoryDraft(draft: SellerRegistrationDraft): void {
  if (typeof window !== "undefined") {
    (window as any).__NEO_SELLER_DRAFT__ = draft;
  }
}

// IndexedDB persistence helper (unlimited quota, supports large blobs/images)
function openIDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function saveToIDB(data: SellerRegistrationDraft): void {
  openIDB().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE_NAME, "readwrite");
      tx.objectStore(IDB_STORE_NAME).put(data, "draft");
    } catch (e) {
      console.warn("IDB write warning:", e);
    }
  });
}

export function getSellerDraft(): SellerRegistrationDraft {
  if (typeof window === "undefined") {
    return DEFAULT_SELLER_DRAFT;
  }

  const memory = getGlobalMemoryDraft();
  // If memory already has values populated, prefer memory
  if (memory.ownerName || memory.businessName || memory.kitchenPhotos?.some(Boolean)) {
    return memory;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged: SellerRegistrationDraft = {
        ...DEFAULT_SELLER_DRAFT,
        ...parsed,
        categories: Array.isArray(parsed.categories) ? parsed.categories : DEFAULT_SELLER_DRAFT.categories,
        kitchenPhotos: Array.isArray(parsed.kitchenPhotos) ? parsed.kitchenPhotos : DEFAULT_SELLER_DRAFT.kitchenPhotos,
        cuisinePhotos: Array.isArray(parsed.cuisinePhotos) ? parsed.cuisinePhotos : DEFAULT_SELLER_DRAFT.cuisinePhotos,
        roomPhotos: Array.isArray(parsed.roomPhotos) ? parsed.roomPhotos : DEFAULT_SELLER_DRAFT.roomPhotos,
        locationCoordinates: parsed.locationCoordinates || DEFAULT_SELLER_DRAFT.locationCoordinates,
      };
      setGlobalMemoryDraft(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Failed to read seller draft from storage:", err);
  }

  return memory;
}

export async function hydrateSellerDraftAsync(): Promise<SellerRegistrationDraft> {
  const current = getSellerDraft();
  if (current.kitchenPhotos?.some(Boolean)) return current;

  const db = await openIDB();
  if (!db) return current;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_NAME, "readonly");
      const req = tx.objectStore(IDB_STORE_NAME).get("draft");
      req.onsuccess = () => {
        if (req.result) {
          const merged: SellerRegistrationDraft = {
            ...DEFAULT_SELLER_DRAFT,
            ...req.result,
          };
          setGlobalMemoryDraft(merged);
          resolve(merged);
        } else {
          resolve(current);
        }
      };
      req.onerror = () => resolve(current);
    } catch {
      resolve(current);
    }
  });
}

export function saveSellerDraft(partial: Partial<SellerRegistrationDraft>): SellerRegistrationDraft {
  const current = getSellerDraft();
  const updated: SellerRegistrationDraft = {
    ...current,
    ...partial,
  };

  // 1. Update global in-memory singleton immediately (synchronous & reliable)
  setGlobalMemoryDraft(updated);

  // 2. Persist in IndexedDB for heavy image data
  saveToIDB(updated);

  // 3. Persist in sessionStorage & localStorage safely
  if (typeof window !== "undefined") {
    try {
      const serialized = JSON.stringify(updated);
      sessionStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Storage quota reached: save lightweight metadata-only draft (in-memory & IndexedDB preserve data URLs)
      try {
        const lightweight = {
          ...updated,
          identityProofDataUrl: undefined,
          fssaiLicenseDataUrl: undefined,
          utilityBillDataUrl: undefined,
          kitchenPhotos: updated.kitchenPhotos?.map(() => null) || [null, null, null, null],
          cuisinePhotos: updated.cuisinePhotos?.map(() => null) || [null, null, null, null],
          roomPhotos: updated.roomPhotos?.map(() => null) || [null, null],
        };
        const lightSerialized = JSON.stringify(lightweight);
        try { sessionStorage.setItem(STORAGE_KEY, lightSerialized); } catch {}
        try { localStorage.setItem(STORAGE_KEY, lightSerialized); } catch {}
      } catch {}
    }
  }

  return updated;
}

export function clearSellerDraft(): void {
  const reset = { ...DEFAULT_SELLER_DRAFT };
  setGlobalMemoryDraft(reset);
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("Failed to clear seller draft from storage:", err);
    }
    openIDB().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(IDB_STORE_NAME, "readwrite");
        tx.objectStore(IDB_STORE_NAME).delete("draft");
      } catch {}
    });
  }
}

/**
 * Compresses an image file (e.g. from camera / gallery) to max 1600px dimension and ~150-250KB JPEG
 * so it never exceeds browser storage quotas and uploads rapidly.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<{ dataUrl: string; file: File }> {
  if (file.type === "application/pdf") {
    const dataUrl = await readFileAsDataUrl(file);
    return { dataUrl, file };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl: rawDataUrl, file });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        const compressedFile =
          dataUrlToFile(compressedDataUrl, file.name.replace(/\.[^/.]+$/, ".jpg")) || file;

        resolve({ dataUrl: compressedDataUrl, file: compressedFile });
      };

      img.onerror = () => {
        resolve({ dataUrl: rawDataUrl, file });
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      readFileAsDataUrl(file).then((dataUrl) => resolve({ dataUrl, file }));
    };

    reader.readAsDataURL(file);
  });
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
