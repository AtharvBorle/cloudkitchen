"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import styles from "./PasswordInput.module.css";

export interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
  matchValue?: string;
  isConfirm?: boolean;
  showLeftIcon?: boolean;
  showCounter?: boolean;
  showHelperText?: boolean;
  helperText?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  size?: "default" | "compact";
  className?: string;
  inputClassName?: string;
  containerStyle?: React.CSSProperties;
  inputWrapperStyle?: React.CSSProperties;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  autoComplete?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value = "",
  onChange,
  label,
  required = false,
  placeholder = "••••••••",
  minLength = 8,
  matchValue,
  isConfirm = false,
  showLeftIcon = false,
  showCounter = true,
  showHelperText = true,
  helperText,
  name = "password",
  id = "password",
  disabled = false,
  size = "default",
  className = "",
  inputClassName = "",
  containerStyle,
  inputWrapperStyle,
  onBlur,
  autoFocus = false,
  autoComplete = "current-password",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const len = value.length;

  let isComplete = false;
  let isIncomplete = false;
  let isMismatch = false;

  if (isConfirm) {
    if (len > 0) {
      if (matchValue !== undefined && value === matchValue && len >= minLength) {
        isComplete = true;
      } else {
        isMismatch = true;
      }
    }
  } else {
    isComplete = len >= minLength;
    isIncomplete = len > 0 && len < minLength;
  }

  const isError = (touched && len === 0 && required) || isIncomplete || isMismatch;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched(true);
    onChange(e.target.value);
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
    <div className={`${styles.passwordContainer} ${className}`} style={containerStyle}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        className={`${styles.inputWrapper} ${wrapperStateClass}`}
        style={inputWrapperStyle}
      >
        {showLeftIcon && (
          <div className={styles.leftIconWrapper}>
            <Lock size={16} />
          </div>
        )}

        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleInputBlur}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={`${styles.passwordField} ${
            showLeftIcon ? styles.withLeftIcon : ""
          } ${size === "compact" ? styles.compactField : ""} ${inputClassName}`}
        />

        <div className={styles.actionsGroup}>
          {isComplete && (
            <div className={styles.statusIconBox}>
              <CheckCircle2 size={16} className={styles.validCheckIcon} />
            </div>
          )}
          {(isIncomplete || isMismatch) && (
            <div className={styles.statusIconBox}>
              <AlertCircle size={16} className={styles.invalidAlertIcon} />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={styles.toggleBtn}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {showHelperText && (
        <>
          {isConfirm ? (
            isComplete ? (
              <div className={styles.helperTextSuccess}>
                <CheckCircle2 size={13} />
                <span>Passwords match</span>
              </div>
            ) : isMismatch ? (
              <div className={styles.helperTextError}>
                <AlertCircle size={13} />
                <span>
                  {len < minLength
                    ? `Must be at least ${minLength} characters`
                    : "Passwords do not match"}
                </span>
              </div>
            ) : touched && len === 0 && required ? (
              <div className={styles.helperTextError}>
                <AlertCircle size={13} />
                <span>Confirm password is required</span>
              </div>
            ) : helperText ? (
              <span style={{ fontSize: "0.76rem", color: "#94a3b8", marginTop: "2px" }}>
                {helperText}
              </span>
            ) : null
          ) : isComplete ? (
            <div className={styles.helperTextSuccess}>
              <CheckCircle2 size={13} />
              <span>Password meets length requirement</span>
              {showCounter && (
                <span className={`${styles.digitCounter} ${styles.digitCounterComplete}`}>
                  {len}/{minLength}+
                </span>
              )}
            </div>
          ) : isIncomplete ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>
                Must be at least {minLength} characters ({minLength - len} more needed)
              </span>
              {showCounter && (
                <span className={`${styles.digitCounter} ${styles.digitCounterIncomplete}`}>
                  {len}/{minLength}
                </span>
              )}
            </div>
          ) : touched && len === 0 && required ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>Password is required</span>
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

export default PasswordInput;
