"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SellerLayout,
  MediaGallery,
  MediaGalleryData,
} from "@/components/seller";
import { getSellerDraft, saveSellerDraft, hydrateSellerDraftAsync } from "@/lib/seller-registration-store";

function MediaGalleryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromReview = searchParams?.get("from") === "review";

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

    // Also hydrate async in case IndexedDB has persistent media
    hydrateSellerDraftAsync().then((hydrated) => {
      if (hydrated.kitchenPhotos?.some(Boolean) || hydrated.cuisinePhotos?.some(Boolean)) {
        setInitialMedia({
          kitchenPhotos: hydrated.kitchenPhotos || [null, null, null, null],
          cuisinePhotos: hydrated.cuisinePhotos || [null, null, null, null],
          roomPhotos: hydrated.roomPhotos || [null, null],
        });
      }
    });
  }, []);

  const handleContinue = (data: MediaGalleryData) => {
    saveSellerDraft({
      kitchenPhotos: data.kitchenPhotos,
      cuisinePhotos: data.cuisinePhotos,
      roomPhotos: data.roomPhotos,
    });
    if (isFromReview) {
      router.push("/seller/confirm-registration");
    } else {
      router.push("/seller/confirm-registration");
    }
  };

  const handleBack = () => {
    if (isFromReview) {
      router.push("/seller/confirm-registration");
    } else {
      router.push("/seller/legal-documents");
    }
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

export default function MediaGalleryPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>}>
      <MediaGalleryContent />
    </Suspense>
  );
}
