"use client";

import {
  getSellerDraft,
  saveSellerDraft,
  clearSellerDraft,
  SellerRegistrationDraft as LibSellerRegistrationDraft,
  DEFAULT_SELLER_DRAFT,
} from "@/lib/seller-registration-store";

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
    locationCoordinates: { lat: 18.5204, lng: 73.8567 },
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

export function getSellerRegistrationDraft(): SellerRegistrationDraft {
  const flat = getSellerDraft();
  const allMedia = [
    ...(flat.kitchenPhotos || []),
    ...(flat.cuisinePhotos || []),
    ...(flat.roomPhotos || []),
  ].filter(Boolean) as string[];

  return {
    account: {
      ownerName: flat.ownerName || "",
      email: flat.email || "",
      phone: flat.phone || "",
      password: flat.password || "",
      sellerRole: flat.sellerRole || "Owner",
    },
    business: {
      businessName: flat.businessName || "",
      sellerType: flat.sellerType || "FOOD",
      categories: flat.categories || ["North Indian", "Biryani"],
      foodType: flat.foodType || "BOTH",
      address: flat.address || "",
      locationCoordinates: flat.locationCoordinates,
      isLocationPinned: flat.isLocationPinned,
    },
    documents: {
      identityProofFile: flat.identityProofFileName || "",
      fssaiLicenseFile: flat.fssaiLicenseFileName || "",
      utilityBillFile: flat.utilityBillFileName || "",
      bankAccountNumber: flat.bankAccountNumber || "",
      ifscCode: flat.ifscCode || "",
    },
    media: {
      kitchenPhotos: flat.kitchenPhotos || [null, null, null, null],
      cuisinePhotos: flat.cuisinePhotos || [null, null, null, null],
      roomPhotos: flat.roomPhotos || [null, null],
      photosCount: allMedia.length,
      previewThumbnails: allMedia.slice(0, 3),
    },
  };
}

export function saveSellerRegistrationDraft(partial: Partial<SellerRegistrationDraft>): void {
  const flatUpdates: Partial<LibSellerRegistrationDraft> = {};

  if (partial.account) {
    if (partial.account.ownerName !== undefined) flatUpdates.ownerName = partial.account.ownerName;
    if (partial.account.email !== undefined) flatUpdates.email = partial.account.email;
    if (partial.account.phone !== undefined) flatUpdates.phone = partial.account.phone;
    if (partial.account.password !== undefined) flatUpdates.password = partial.account.password;
    if (partial.account.sellerRole !== undefined) flatUpdates.sellerRole = partial.account.sellerRole;
  }

  if (partial.business) {
    if (partial.business.businessName !== undefined) flatUpdates.businessName = partial.business.businessName;
    if (partial.business.sellerType !== undefined) flatUpdates.sellerType = partial.business.sellerType as any;
    if (partial.business.categories !== undefined) flatUpdates.categories = partial.business.categories;
    if (partial.business.foodType !== undefined) flatUpdates.foodType = partial.business.foodType as any;
    if (partial.business.address !== undefined) flatUpdates.address = partial.business.address;
    if (partial.business.locationCoordinates !== undefined) flatUpdates.locationCoordinates = partial.business.locationCoordinates;
    if (partial.business.isLocationPinned !== undefined) flatUpdates.isLocationPinned = partial.business.isLocationPinned;
  }

  if (partial.documents) {
    if (partial.documents.identityProofFile !== undefined) flatUpdates.identityProofFileName = partial.documents.identityProofFile;
    if (partial.documents.fssaiLicenseFile !== undefined) flatUpdates.fssaiLicenseFileName = partial.documents.fssaiLicenseFile;
    if (partial.documents.utilityBillFile !== undefined) flatUpdates.utilityBillFileName = partial.documents.utilityBillFile;
    if (partial.documents.bankAccountNumber !== undefined) flatUpdates.bankAccountNumber = partial.documents.bankAccountNumber;
    if (partial.documents.ifscCode !== undefined) flatUpdates.ifscCode = partial.documents.ifscCode;
  }

  if (partial.media) {
    if (partial.media.kitchenPhotos !== undefined) flatUpdates.kitchenPhotos = partial.media.kitchenPhotos;
    if (partial.media.cuisinePhotos !== undefined) flatUpdates.cuisinePhotos = partial.media.cuisinePhotos;
    if (partial.media.roomPhotos !== undefined) flatUpdates.roomPhotos = partial.media.roomPhotos;
  }

  saveSellerDraft(flatUpdates);
}

export function clearSellerRegistrationDraft(): void {
  clearSellerDraft();
}
