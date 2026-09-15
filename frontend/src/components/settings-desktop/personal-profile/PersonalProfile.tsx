"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Pencil, Check, X } from "lucide-react";
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
  const [liveData, setLiveData] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    pincode?: string;
  }>({});

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

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
                city: user.city,
                pincode: user.pincode,
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
  const city = liveData.city || "Mumbai";
  const pincode = liveData.pincode || "400001";

  const handleOpenEdit = () => {
    if (onEdit) {
      onEdit();
      return;
    }
    if (!session?.user) {
      router.push("/login?callbackUrl=/settings-desktop");
      return;
    }
    setEditName(fullName);
    setEditPhone(phone.replace("+91 ", ""));
    setEditCity(city);
    setEditPincode(pincode);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchApi("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          city: editCity.trim(),
          pincode: editPincode.trim(),
        }),
      });

      if (res.ok) {
        setLiveData((prev) => ({
          ...prev,
          name: editName.trim(),
          phone: editPhone.trim(),
          city: editCity.trim(),
          pincode: editPincode.trim(),
        }));
        setIsEditing(false);
        setFeedbackMsg("Profile updated successfully!");
        setTimeout(() => setFeedbackMsg(null), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.cardContainer}>
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          style={{
            backgroundColor: "#DEF7EC",
            color: "#03543F",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "0.88rem",
            fontWeight: 600,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Check size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <User size={18} strokeWidth={2.4} />
          </div>
          <h2 className={styles.cardTitle}>Personal Profile</h2>
        </div>

        {!isEditing && (
          <button
            type="button"
            className={styles.editBtn}
            onClick={handleOpenEdit}
            aria-label="Edit Details"
          >
            <Pencil size={13} strokeWidth={2.4} />
            <span>Edit Details</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>FULL NAME</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #CBD5E1",
                  fontSize: "0.9rem",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>PHONE NUMBER</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                required
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #CBD5E1",
                  fontSize: "0.9rem",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>CITY</label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #CBD5E1",
                  fontSize: "0.9rem",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>PINCODE</label>
              <input
                type="text"
                value={editPincode}
                onChange={(e) => setEditPincode(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #CBD5E1",
                  fontSize: "0.9rem",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={saving}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#FF5500",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Check size={15} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Fields */
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
            <span className={styles.fieldLabel}>CITY / REGION</span>
            <p className={styles.fieldValue}>{city}</p>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>PINCODE</span>
            <p className={styles.fieldValue}>{pincode}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalProfile;
