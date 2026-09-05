"use client";

import React, { useState } from "react";
import { Mail, Phone, Lock, ChevronDown, ArrowRight } from "lucide-react";
import styles from "./AccountInformation.module.css";

export interface AccountStepData {
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  sellerRole: string;
}

export type AccountInformationData = AccountStepData;

export interface AccountInformationProps {
  initialData?: Partial<AccountStepData>;
  onContinue?: (data: AccountStepData) => void;
}

export const AccountInformation: React.FC<AccountInformationProps> = ({
  initialData,
  onContinue,
}) => {
  const [formData, setFormData] = useState<AccountStepData>({
    ownerName: initialData?.ownerName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    password: initialData?.password || "",
    sellerRole: initialData?.sellerRole || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onContinue) {
      onContinue(formData);
    }
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerGroup}>
        <h2 className={styles.title}>Owner Account Information</h2>
        <p className={styles.subtitle}>
          Set up your primary login and ownership contact credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Owner Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="ownerName">
            Owner Name <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="ownerName"
              name="ownerName"
              type="text"
              required
              placeholder="e.g. John Doe"
              value={formData.ownerName}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>

        {/* Email Address */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="email">
            Email Address <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <Mail className={styles.inputIcon} />
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${styles.inputWithIcon}`}
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="phone">
            Phone Number <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <Phone className={styles.inputIcon} />
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={handleChange}
              className={`${styles.input} ${styles.inputWithIcon}`}
            />
          </div>
        </div>

        {/* Password */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="password">
            Password <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} />
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${styles.inputWithIcon}`}
            />
          </div>
          <span className={styles.helperText}>
            Must be at least 8 characters with letters & numbers.
          </span>
        </div>

        {/* Seller Role */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="sellerRole">
            Seller Role <span className={styles.required}>*</span>
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="sellerRole"
              name="sellerRole"
              required
              value={formData.sellerRole}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="" disabled>
                Select your role (Owner / Manager)
              </option>
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="PARTNER">Partner</option>
            </select>
            <ChevronDown className={styles.chevronIcon} />
          </div>
        </div>

        {/* Continue Button */}
        <div className={styles.buttonWrapper}>
          <button type="submit" className={styles.continueButton}>
            <span>Continue</span>
            <ArrowRight className={styles.btnIcon} />
          </button>
        </div>
      </form>
    </div>
  );
};

export const AccountStep = AccountInformation;
export default AccountInformation;
