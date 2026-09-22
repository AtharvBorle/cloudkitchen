"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import styles from "./PhoneInput.module.css";

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  size?: "default" | "compact";
  showFlag?: boolean;
  showCounter?: boolean;
  showHelperText?: boolean;
  helperText?: string;
  rightAction?: React.ReactNode;
  containerStyle?: React.CSSProperties;
  inputWrapperStyle?: React.CSSProperties;
  className?: string;
  inputClassName?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  autoComplete?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value = "",
  onChange,
  label,
  required = false,
  placeholder = "98765 43210",
  name = "phone",
  id = "phone",
  disabled = false,
  size = "default",
  showFlag = true,
  showCounter = true,
  showHelperText = true,
  helperText,
  rightAction,
  containerStyle,
  inputWrapperStyle,
  className = "",
  inputClassName = "",
  onBlur,
  autoFocus = false,
  autoComplete = "tel-national",
}) => {
  const [touched, setTouched] = useState(false);

  // Extract clean 10 digits
  const rawDigits = (value || "").replace(/\+91/g, "").replace(/\D/g, "").slice(0, 10);
  const digitsCount = rawDigits.length;
  const isComplete = digitsCount === 10;
  const isIncomplete = digitsCount > 0 && digitsCount < 10;
  const isError = (touched && digitsCount === 0 && required) || isIncomplete;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setTouched(true);
    onChange(digitsOnly);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const wrapperStateClass = isComplete
    ? styles.inputSuccess
    : isError
    ? styles.inputError
    : "";

  return (
    <div className={`${styles.phoneContainer} ${className}`} style={containerStyle}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        className={`${styles.inputWrapper} ${wrapperStateClass}`}
        style={inputWrapperStyle}
      >
        <div
          className={`${styles.countryCodePrefix} ${
            size === "compact" ? styles.compactPrefix : ""
          }`}
        >
          {showFlag && <span className={styles.flagIcon}>🇮🇳</span>}
          <span>+91</span>
        </div>

        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          required={required}
          disabled={disabled}
          maxLength={10}
          placeholder={placeholder}
          value={rawDigits}
          onChange={handleChange}
          onBlur={handleInputBlur}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={`${styles.phoneField} ${
            size === "compact" ? styles.compactField : ""
          } ${inputClassName}`}
        />

        {rightAction ? (
          <div className={styles.actionWrapper}>
            {isComplete && (
              <div className={styles.statusIconBoxWithAction}>
                <CheckCircle2 size={16} className={styles.validCheckIcon} />
              </div>
            )}
            {isIncomplete && (
              <div className={styles.statusIconBoxWithAction}>
                <AlertCircle size={16} className={styles.invalidAlertIcon} />
              </div>
            )}
            {rightAction}
          </div>
        ) : (
          <>
            {isComplete && (
              <div className={styles.statusIconBox}>
                <CheckCircle2
                  size={size === "compact" ? 16 : 18}
                  className={styles.validCheckIcon}
                />
              </div>
            )}
            {isIncomplete && (
              <div className={styles.statusIconBox}>
                <AlertCircle
                  size={size === "compact" ? 16 : 18}
                  className={styles.invalidAlertIcon}
                />
              </div>
            )}
          </>
        )}
      </div>

      {showHelperText && (
        <>
          {isComplete ? (
            <div className={styles.helperTextSuccess}>
              <CheckCircle2 size={13} />
              <span>Valid 10-digit Indian mobile number</span>
              {showCounter && (
                <span className={`${styles.digitCounter} ${styles.digitCounterComplete}`}>
                  10/10
                </span>
              )}
            </div>
          ) : isIncomplete ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>Enter 10 digits ({10 - digitsCount} more needed)</span>
              {showCounter && (
                <span
                  className={`${styles.digitCounter} ${styles.digitCounterIncomplete}`}
                >
                  {digitsCount}/10
                </span>
              )}
            </div>
          ) : touched && digitsCount === 0 && required ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>Mobile number is required</span>
            </div>
          ) : helperText ? (
            <span style={{ fontSize: "0.76rem", color: "#94a3b8", marginTop: "2px" }}>
              {helperText}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
};

export default PhoneInput;
