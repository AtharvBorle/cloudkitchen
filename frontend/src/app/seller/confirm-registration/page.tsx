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
  SellerRegistrationDraft,
} from "@/lib/seller-registration-store";
import { fetchApi } from "@/lib/fetch-api";

export default function ConfirmRegistrationPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SellerRegistrationDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const currentDraft = getSellerDraft();
    setDraft(currentDraft);
  }, []);

  const handleSubmit = async () => {
    if (!draft) return;
    setErrorMessage(null);

    // Validation
    if (!draft.ownerName || !draft.email || !draft.password) {
      setErrorMessage("Please complete your account information (name, email, password).");
      return;
    }
    if (!draft.businessName || !draft.address) {
      setErrorMessage("Please complete your business details (business name and address).");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Account info
      formData.append("name", draft.ownerName.trim());
      formData.append("email", draft.email.trim().toLowerCase());
      formData.append("phone", draft.phone ? draft.phone.trim() : "");
      formData.append("password", draft.password);
      formData.append("role", "SELLER");
      formData.append("sellerRole", draft.sellerRole || "Owner");

      // Business info
      formData.append("businessName", draft.businessName.trim());
      formData.append("sellerType", draft.sellerType || "FOOD");
      formData.append("businessCategory", draft.sellerType || "FOOD");
      formData.append("foodType", draft.foodType || "BOTH");
      formData.append("addressArea", draft.address.trim());
      formData.append("addressFlat", "");
      formData.append("city", draft.city || "Pune");
      formData.append("pincode", draft.pincode || "411038");

      // Legal & Banking
      formData.append("bankAccountNumber", draft.bankAccountNumber || "");
      formData.append("ifscCode", draft.ifscCode || "");

      // Files
      if (draft.identityProofDataUrl) {
        const file = dataUrlToFile(draft.identityProofDataUrl, draft.identityProofFileName || "identity_proof.jpg");
        if (file) formData.append("adhaarFile", file);
      }
      if (draft.fssaiLicenseDataUrl) {
        const file = dataUrlToFile(draft.fssaiLicenseDataUrl, draft.fssaiLicenseFileName || "fssai_license.jpg");
        if (file) formData.append("fssaiFile", file);
      }
      if (draft.utilityBillDataUrl) {
        const file = dataUrlToFile(draft.utilityBillDataUrl, draft.utilityBillFileName || "utility_bill.jpg");
        if (file) formData.append("lightBillFile", file);
      }

      // Photos
      draft.kitchenPhotos?.forEach((dataUrl, idx) => {
        if (dataUrl) {
          const file = dataUrlToFile(dataUrl, `kitchen_photo_${idx + 1}.jpg`);
          if (file) formData.append(`kitchenImage_${idx}`, file);
        }
      });

      draft.cuisinePhotos?.forEach((dataUrl, idx) => {
        if (dataUrl) {
          const file = dataUrlToFile(dataUrl, `cuisine_photo_${idx + 1}.jpg`);
          if (file) formData.append(`cuisineImage_${idx}`, file);
        }
      });

      draft.roomPhotos?.forEach((dataUrl, idx) => {
        if (dataUrl) {
          const file = dataUrlToFile(dataUrl, `room_photo_${idx + 1}.jpg`);
          if (file) formData.append(`roomImage_${idx}`, file);
        }
      });

      const res = await fetchApi("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const trackingId =
          data?.sellerProfile?.trackingId ||
          data?.data?.sellerProfile?.trackingId ||
          data?.trackingId ||
          "";

        // Auto-login the seller
        try {
          await signIn("credentials", {
            redirect: false,
            email: draft.email.trim().toLowerCase(),
            password: draft.password,
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
        setErrorMessage(data?.message || data?.error || "Registration failed. Please verify your details and try again.");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "A network error occurred during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/seller/media-gallery");
  };

  return (
    <SellerLayout
      currentStep={5}
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
    >
      <ConfirmRegistration
        draft={draft || undefined}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
