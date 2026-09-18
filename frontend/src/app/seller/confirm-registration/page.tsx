"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  SellerLayout,
  ConfirmRegistration,
} from "@/components/seller";
import {
  getSellerDraft,
  clearSellerDraft,
  dataUrlToFile,
  hydrateSellerDraftAsync,
  SellerRegistrationDraft,
} from "@/lib/seller-registration-store";
import { fetchApi } from "@/lib/fetch-api";
import { discardExistingSession } from "@/lib/logout";

export default function ConfirmRegistrationPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SellerRegistrationDraft>(() => getSellerDraft());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const currentDraft = getSellerDraft();
    setDraft(currentDraft);

    hydrateSellerDraftAsync().then((hydrated) => {
      setDraft((prev) => ({
        ...prev,
        ...hydrated,
        kitchenPhotos: hydrated.kitchenPhotos?.some(Boolean) ? hydrated.kitchenPhotos : prev.kitchenPhotos,
        cuisinePhotos: hydrated.cuisinePhotos?.some(Boolean) ? hydrated.cuisinePhotos : prev.cuisinePhotos,
        roomPhotos: hydrated.roomPhotos?.some(Boolean) ? hydrated.roomPhotos : prev.roomPhotos,
      }));
    });
  }, []);

  const handleSubmit = async () => {
    const activeDraft = getSellerDraft() || draft;
    if (!activeDraft) return;
    setErrorMessage(null);

    // Validation
    if (!activeDraft.ownerName || !activeDraft.email || !activeDraft.password) {
      setErrorMessage("Please complete your account information (name, email, password).");
      return;
    }
    if (!activeDraft.businessName || !activeDraft.address) {
      setErrorMessage("Please complete your business details (business name and address).");
      return;
    }

    const sellerType = activeDraft.sellerType || "FOOD";
    const isFood = sellerType === "FOOD" || sellerType === "BOTH";
    const isProperty = sellerType === "PROPERTY" || sellerType === "BOTH";

    const kitchenPhotosCount = activeDraft.kitchenPhotos?.filter(Boolean).length || 0;
    const cuisinePhotosCount = activeDraft.cuisinePhotos?.filter(Boolean).length || 0;
    const roomPhotosCount = activeDraft.roomPhotos?.filter(Boolean).length || 0;

    if (isFood && (kitchenPhotosCount < 3 || cuisinePhotosCount < 3)) {
      setErrorMessage("Please upload at least 3 Kitchen Photos and 3 Cuisine Photos in the Media section before submitting.");
      return;
    }
    if (isProperty && roomPhotosCount < 2) {
      setErrorMessage("Please upload at least 2 Room Photos in the Media section before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Account info
      formData.append("name", activeDraft.ownerName.trim());
      formData.append("ownerName", activeDraft.ownerName.trim());
      formData.append("email", activeDraft.email.trim().toLowerCase());
      const cleanPhone = activeDraft.phone ? activeDraft.phone.replace(/\D/g, "").slice(-10) : "";
      formData.append("phone", cleanPhone);
      formData.append("password", activeDraft.password);
      formData.append("role", "SELLER");
      formData.append("sellerRole", activeDraft.sellerRole || "Owner");

      // Business info
      formData.append("businessName", activeDraft.businessName.trim());
      formData.append("sellerType", activeDraft.sellerType || "FOOD");
      formData.append("businessCategory", activeDraft.sellerType || "FOOD");
      formData.append("foodType", activeDraft.foodType || "BOTH");
      formData.append("addressArea", activeDraft.address.trim());
      formData.append("address", activeDraft.address.trim());
      formData.append("addressFlat", "");
      formData.append("city", activeDraft.city || "Pune");
      formData.append("pincode", activeDraft.pincode || "411038");
      if (activeDraft.locationCoordinates?.lat !== undefined && activeDraft.locationCoordinates?.lat !== null) {
        formData.append("latitude", String(activeDraft.locationCoordinates.lat));
        formData.append("lat", String(activeDraft.locationCoordinates.lat));
      }
      if (activeDraft.locationCoordinates?.lng !== undefined && activeDraft.locationCoordinates?.lng !== null) {
        formData.append("longitude", String(activeDraft.locationCoordinates.lng));
        formData.append("lng", String(activeDraft.locationCoordinates.lng));
      }
      if (activeDraft.isLocationPinned !== undefined) {
        formData.append("isLocationPinned", String(activeDraft.isLocationPinned));
      }

      // Legal & Banking
      formData.append("bankAccountNumber", activeDraft.bankAccountNumber || "");
      formData.append("ifscCode", activeDraft.ifscCode || "");

      // Attach document files (single canonical key each to prevent duplicate payloads)
      if (activeDraft.identityProofDataUrl && activeDraft.identityProofDataUrl.startsWith("data:")) {
        const file = dataUrlToFile(activeDraft.identityProofDataUrl, activeDraft.identityProofFileName || "identity_proof.jpg");
        if (file) {
          formData.append("adhaarFile", file);
        }
      }
      if (activeDraft.fssaiLicenseDataUrl && activeDraft.fssaiLicenseDataUrl.startsWith("data:")) {
        const file = dataUrlToFile(activeDraft.fssaiLicenseDataUrl, activeDraft.fssaiLicenseFileName || "fssai_license.jpg");
        if (file) {
          formData.append("fssaiFile", file);
        }
      }
      if (activeDraft.utilityBillDataUrl && activeDraft.utilityBillDataUrl.startsWith("data:")) {
        const file = dataUrlToFile(activeDraft.utilityBillDataUrl, activeDraft.utilityBillFileName || "utility_bill.jpg");
        if (file) {
          formData.append("lightBillFile", file);
        }
      }

      // Photos
      activeDraft.kitchenPhotos?.forEach((dataUrl, idx) => {
        if (dataUrl && dataUrl.startsWith("data:")) {
          const file = dataUrlToFile(dataUrl, `kitchen_photo_${idx + 1}.jpg`);
          if (file) {
            formData.append(`kitchenImage_${idx}`, file);
          }
        }
      });

      activeDraft.cuisinePhotos?.forEach((dataUrl, idx) => {
        if (dataUrl && dataUrl.startsWith("data:")) {
          const file = dataUrlToFile(dataUrl, `cuisine_photo_${idx + 1}.jpg`);
          if (file) {
            formData.append(`cuisineImage_${idx}`, file);
          }
        }
      });

      activeDraft.roomPhotos?.forEach((dataUrl, idx) => {
        if (dataUrl && dataUrl.startsWith("data:")) {
          const file = dataUrlToFile(dataUrl, `room_photo_${idx + 1}.jpg`);
          if (file) {
            formData.append(`roomImage_${idx}`, file);
          }
        }
      });

      const res = await fetchApi("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (res.ok) {
        const trackingId =
          data?.sellerProfile?.trackingId ||
          data?.data?.sellerProfile?.trackingId ||
          data?.trackingId ||
          "";

        // Auto-login the seller
        try {
          await discardExistingSession();
          await signIn("credentials", {
            redirect: false,
            email: activeDraft.email.trim().toLowerCase(),
            password: activeDraft.password,
            loginType: "SELLER",
          });
        } catch (loginErr) {
          console.warn("Auto-login error after registration:", loginErr);
        }

        clearSellerDraft();
        const nextUrl = trackingId
          ? `/seller/registration-submitted?trackingId=${encodeURIComponent(trackingId)}`
          : "/seller/registration-submitted";
        router.push(nextUrl);
      } else {
        if (res.status === 409) {
          setErrorMessage("An account with this email address already exists. Please sign in to your existing account.");
        } else {
          setErrorMessage(data?.message || data?.error || "Registration could not be completed. Please check your details and try again.");
        }
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "A network error occurred during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/seller/media-gallery?from=review");
  };

  return (
    <SellerLayout
      currentStep={5}
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
    >
      <ConfirmRegistration
        draft={draft}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
