"use client";

import React, { useState } from "react";
import { ChevronDown, ArrowRight, Eye, EyeOff } from "lucide-react";
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
  const [formData, setFormData] = React.useState<AccountStepData>({
    ownerName: initialData?.ownerName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    password: initialData?.password || "",
    sellerRole: initialData?.sellerRole || "Owner",
  });
  const [showPassword, setShowPassword] = React.useState(false);

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
      {/* Desktop Header Group */}
      <div className={styles.headerGroup}>
        <h2 className={styles.title}>Owner Account Information</h2>
        <p className={styles.subtitle}>
          Set up your primary login and ownership contact credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Owner Full Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="ownerName">
            Owner full name <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="ownerName"
              name="ownerName"
              type="text"
              required
              placeholder="Rahul Sharma"
              value={formData.ownerName}
              onChange={handleChange}
              className={styles.input}
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="email">
            Email <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="rahul@neocloud.com"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="phone">
            Phone <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              className={styles.input}
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Password */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="password">
            Password <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className={styles.togglePasswordBtn}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <span className={styles.helperText}>
            Must be at least 8 characters
          </span>
        </div>

        {/* Seller Role */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="sellerRole">
            Seller role <span className={styles.required}>*</span>
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
              <option value="Owner">Owner</option>
              <option value="Manager">Manager</option>
              <option value="Partner">Partner</option>
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
