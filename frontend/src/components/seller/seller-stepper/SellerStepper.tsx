"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import styles from "./SellerStepper.module.css";

export interface StepItem {
  id: number;
  label: string;
  href: string;
}

export interface SellerStepperProps {
  currentStep?: number;
  steps?: StepItem[];
  onStepClick?: (stepId: number) => void;
}

const DEFAULT_STEPS: StepItem[] = [
  { id: 1, label: "Account", href: "/seller/account-information" },
  { id: 2, label: "Business", href: "/seller/business-information" },
  { id: 3, label: "Legal", href: "/seller/legal-documents" },
  { id: 4, label: "Media", href: "/seller/media-gallery" },
  { id: 5, label: "Confirm", href: "/seller/confirm-registration" },
];

export const SellerStepper: React.FC<SellerStepperProps> = ({
  currentStep = 2,
  steps = DEFAULT_STEPS,
  onStepClick,
}) => {
  return (
    <div
      className={styles.stepperContainer}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 14,
        padding: "32px 0 24px 0",
        width: "100%",
        maxWidth: 700,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;

        return (
          <React.Fragment key={step.id}>
            <Link
              href={step.href}
              className={styles.stepItem}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: 0,
                whiteSpace: "nowrap",
                textDecoration: "none",
              }}
              onClick={() => onStepClick?.(step.id)}
            >
              <div
                className={`${styles.stepBadge} ${
                  isCompleted
                    ? styles.completed
                    : isActive
                    ? styles.active
                    : ""
                }`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  border: isCompleted || isActive
                    ? "1.5px solid #F97316"
                    : "1.5px solid #cbd5e1",
                  backgroundColor: isCompleted || isActive
                    ? "#F97316"
                    : "#ffffff",
                  color: isCompleted || isActive ? "#ffffff" : "#64748b",
                  flexShrink: 0,
                }}
              >
                {isCompleted ? (
                  <Check style={{ width: 14, height: 14, strokeWidth: 3, color: "#ffffff" }} />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`${styles.stepLabel} ${
                  isActive
                    ? styles.active
                    : isCompleted
                    ? styles.completed
                    : ""
                }`}
                style={{
                  fontSize: "0.88rem",
                  fontWeight: isActive || isCompleted ? 600 : 500,
                  color: isActive
                    ? "#F97316"
                    : isCompleted
                    ? "#334155"
                    : "#64748b",
                }}
              >
                {step.label}
              </span>
            </Link>

            {index < steps.length - 1 && (
              <div
                className={styles.stepDivider}
                style={{
                  height: 1,
                  width: 44,
                  backgroundColor: "#e2e8f0",
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default SellerStepper;
