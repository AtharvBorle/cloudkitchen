export interface SellerRegistrationDraft {
  account: {
    ownerName: string;
    email: string;
    phone: string;
    password: string;
    sellerRole: string;
  };
  business: {
    businessName: string;
    sellerType: string;
    categories: string[];
    foodType: string;
    address: string;
    locationCoordinates?: { lat: number; lng: number };
    isLocationPinned?: boolean;
  };
  documents: {
    identityProofFile: string;
    fssaiLicenseFile: string;
    utilityBillFile: string;
    bankAccountNumber: string;
    ifscCode: string;
  };
  media: {
    kitchenPhotos: (string | null)[];
    cuisinePhotos: (string | null)[];
    roomPhotos: (string | null)[];
    photosCount: number;
    previewThumbnails: (string | null)[];
  };
}

export const DEFAULT_REGISTRATION_DRAFT: SellerRegistrationDraft = {
  account: {
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    sellerRole: "Owner",
  },
  business: {
    businessName: "",
    sellerType: "FOOD",
    categories: ["North Indian", "Biryani"],
    foodType: "BOTH",
    address: "",
    locationCoordinates: { lat: 12.9121, lng: 77.6446 },
    isLocationPinned: true,
  },
  documents: {
    identityProofFile: "",
    fssaiLicenseFile: "",
    utilityBillFile: "",
    bankAccountNumber: "",
    ifscCode: "",
  },
  media: {
    kitchenPhotos: [null, null, null, null],
    cuisinePhotos: [null, null, null, null],
    roomPhotos: [null, null],
    photosCount: 0,
    previewThumbnails: [null, null, null],
  },
};

const STORAGE_KEY = "seller_registration_draft";

let inMemoryDraft: SellerRegistrationDraft = { ...DEFAULT_REGISTRATION_DRAFT };

export function getSellerRegistrationDraft(): SellerRegistrationDraft {
  if (typeof window === "undefined") {
    return inMemoryDraft;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return inMemoryDraft;
    const parsed = JSON.parse(raw);
    return {
      account: { ...DEFAULT_REGISTRATION_DRAFT.account, ...(parsed.account || {}) },
      business: { ...DEFAULT_REGISTRATION_DRAFT.business, ...(parsed.business || {}) },
      documents: { ...DEFAULT_REGISTRATION_DRAFT.documents, ...(parsed.documents || {}) },
      media: { ...DEFAULT_REGISTRATION_DRAFT.media, ...(parsed.media || {}) },
    };
  } catch {
    return inMemoryDraft;
  }
}

export function saveSellerRegistrationDraft(partial: Partial<SellerRegistrationDraft>): void {
  const current = getSellerRegistrationDraft();
  const updated: SellerRegistrationDraft = {
    account: partial.account ? { ...current.account, ...partial.account } : current.account,
    business: partial.business ? { ...current.business, ...partial.business } : current.business,
    documents: partial.documents ? { ...current.documents, ...partial.documents } : current.documents,
    media: partial.media ? { ...current.media, ...partial.media } : current.media,
  };
  inMemoryDraft = updated;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to persist registration draft to localStorage", err);
    }
  }
}

export function clearSellerRegistrationDraft(): void {
  inMemoryDraft = { ...DEFAULT_REGISTRATION_DRAFT };
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}
