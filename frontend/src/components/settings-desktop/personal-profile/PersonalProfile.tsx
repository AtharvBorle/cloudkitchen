"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Pencil } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./PersonalProfile.module.css";

export interface PersonalProfileProps {
  fullName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  onEdit?: () => void;
}

export const PersonalProfile: React.FC<PersonalProfileProps> = ({
  fullName: customFullName,
  email: customEmail,
  phone: customPhone,
  dob = "15 / 08 / 1995",
  gender = "Male",
  onEdit,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [liveData, setLiveData] = useState<{ name?: string; email?: string; phone?: string }>({});

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      if (session?.user) {
        try {
          const res = await fetchApi("/api/user/profile");
          if (res.ok) {
            const data = await res.json();
            const user = data.data || data.user || data;
            if (isMounted && user) {
              setLiveData({
                name: user.name,
                email: user.email,
                phone: user.phone,
              });
            }
          }
        } catch (err) {
          // ignore or fallback
        }
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [session]);

  const fullName = customFullName || liveData.name || session?.user?.name || "Rahul Sharma";
  const email = customEmail || liveData.email || session?.user?.email || "rahul.sharma@lumen.com";
  const phone = customPhone || liveData.phone || "+91 98765 43210";

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else if (!session?.user) {
      router.push("/login?callbackUrl=/settings-desktop");
    } else {
      const newPhone = prompt("Update your 10-digit mobile number:", phone === "+91 98765 43210" ? "" : phone);
      if (newPhone && newPhone.trim().length === 10) {
        fetchApi("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: newPhone.trim() }),
        }).then((res) => {
          if (res.ok) {
            setLiveData((prev) => ({ ...prev, phone: newPhone.trim() }));
          }
        });
      }
    }
  };

  return (
    <div className={styles.cardContainer}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <User size={18} strokeWidth={2.4} />
          </div>
          <h2 className={styles.cardTitle}>Personal Profile</h2>
        </div>

        <button
          type="button"
          className={styles.editBtn}
          onClick={handleEdit}
          aria-label="Edit Details"
        >
          <Pencil size={13} strokeWidth={2.4} />
          <span>Edit Details</span>
        </button>
      </div>

      {/* Fields */}
      <div className={styles.fieldsGrid}>
        <div className={styles.fieldItem}>
          <span className={styles.fieldLabel}>FULL NAME</span>
          <p className={styles.fieldValue}>{fullName}</p>
        </div>

        <div className={styles.fieldItem}>
          <span className={styles.fieldLabel}>EMAIL ADDRESS</span>
          <p className={styles.fieldValue}>{email}</p>
        </div>

        <div className={styles.fieldItem}>
          <span className={styles.fieldLabel}>PHONE NUMBER</span>
          <p className={styles.fieldValue}>{phone}</p>
        </div>

        <div className={styles.fieldItem}>
          <span className={styles.fieldLabel}>DATE OF BIRTH</span>
          <p className={styles.fieldValue}>{dob}</p>
        </div>

        <div className={styles.fieldItem}>
          <span className={styles.fieldLabel}>GENDER</span>
          <p className={styles.fieldValue}>{gender}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalProfile;
