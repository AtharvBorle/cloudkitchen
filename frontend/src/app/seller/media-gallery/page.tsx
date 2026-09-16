"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  MediaGallery,
  MediaGalleryData,
} from "@/components/seller";
import { getSellerDraft, saveSellerDraft } from "@/lib/seller-registration-store";

export default function MediaGalleryPage() {
  const router = useRouter();
  const [initialMedia, setInitialMedia] = useState<Partial<MediaGalleryData>>({
    kitchenPhotos: [null, null, null, null],
    cuisinePhotos: [null, null, null, null],
    roomPhotos: [null, null],
  });

  useEffect(() => {
    const draft = getSellerDraft();
    setInitialMedia({
      kitchenPhotos: draft.kitchenPhotos || [null, null, null, null],
      cuisinePhotos: draft.cuisinePhotos || [null, null, null, null],
      roomPhotos: draft.roomPhotos || [null, null],
    });
  }, []);

  const handleContinue = (data: MediaGalleryData) => {
    saveSellerDraft({
      kitchenPhotos: data.kitchenPhotos,
      cuisinePhotos: data.cuisinePhotos,
      roomPhotos: data.roomPhotos,
    });
    router.push("/seller/confirm-registration");
  };

  const handleBack = () => {
    router.push("/seller/legal-documents");
  };

  return (
    <SellerLayout
      currentStep={4}
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
    >
      <MediaGallery
        key={initialMedia.kitchenPhotos?.filter(Boolean).length ? "media-loaded" : "media-init"}
        initialData={initialMedia}
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
