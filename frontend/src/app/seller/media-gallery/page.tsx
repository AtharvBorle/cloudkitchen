"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  MediaGallery,
  MediaGalleryData,
} from "@/components/seller";
import {
  getSellerRegistrationDraft,
  saveSellerRegistrationDraft,
} from "@/utils/sellerRegistrationDraft";

export default function MediaGalleryPage() {
  const router = useRouter();
  const [mediaData, setMediaData] = useState<MediaGalleryData>(() => {
    const draft = getSellerRegistrationDraft().media;
    return {
      kitchenPhotos: draft.kitchenPhotos,
      cuisinePhotos: draft.cuisinePhotos,
      roomPhotos: draft.roomPhotos,
    };
  });

  useEffect(() => {
    const draft = getSellerRegistrationDraft().media;
    setMediaData({
      kitchenPhotos: draft.kitchenPhotos,
      cuisinePhotos: draft.cuisinePhotos,
      roomPhotos: draft.roomPhotos,
    });
  }, []);

  const handleContinue = (data: MediaGalleryData) => {
    const allPhotos = [
      ...data.kitchenPhotos.filter(Boolean),
      ...data.cuisinePhotos.filter(Boolean),
      ...data.roomPhotos.filter(Boolean),
    ];
    const previewThumbnails = [
      data.kitchenPhotos[0] || data.cuisinePhotos[0] || data.roomPhotos[0] || null,
      data.kitchenPhotos[1] || data.cuisinePhotos[1] || data.roomPhotos[1] || null,
      data.kitchenPhotos[2] || data.cuisinePhotos[2] || data.roomPhotos[2] || null,
    ];

    saveSellerRegistrationDraft({
      media: {
        ...data,
        photosCount: allPhotos.length,
        previewThumbnails,
      },
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
        initialData={mediaData}
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
