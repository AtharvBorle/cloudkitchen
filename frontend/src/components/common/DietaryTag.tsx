"use client";

import React from "react";

export interface DietaryTagProps {
  itemType?: string | null;
  isVeg?: boolean;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const DietaryTag: React.FC<DietaryTagProps> = ({
  itemType,
  isVeg,
  size = "sm",
  showLabel = true,
  style,
  className,
}) => {
  let isNonVeg = false;
  let isVegan = false;
  let isJain = false;

  if (typeof isVeg === "boolean") {
    isNonVeg = !isVeg;
  } else if (itemType) {
    const raw = String(itemType).split(",").map((s) => s.trim().toUpperCase());
    isNonVeg = raw.includes("NON_VEG") || raw.includes("NON-VEG") || raw.includes("NON VEG");
    isVegan = raw.includes("VEGAN");
    isJain = raw.includes("JAIN");
  }

  const dotSize = size === "xs" ? "6px" : size === "sm" ? "7.5px" : "9px";
  const fontSize = size === "xs" ? "0.65rem" : size === "sm" ? "0.72rem" : "0.8rem";
  const padding = size === "xs" ? "1.5px 5px" : size === "sm" ? "2.5px 7px" : "3.5px 9px";

  if (isNonVeg) {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4.5px",
          backgroundColor: "#FFF5F5",
          color: "#E11D48",
          border: "1.2px solid #FDA4AF",
          borderRadius: "6px",
          padding: padding,
          fontSize: fontSize,
          fontWeight: "700",
          boxShadow: "0 1px 4px rgba(225, 29, 72, 0.08)",
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          userSelect: "none",
          ...style,
        }}
        title="Non-Vegetarian"
      >
        <span
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: "#E11D48",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        {showLabel && "Non-Veg"}
      </span>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        flexWrap: "nowrap",
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4.5px",
          backgroundColor: "#F0FDF4",
          color: "#16A34A",
          border: "1.2px solid #86EFAC",
          borderRadius: "6px",
          padding: padding,
          fontSize: fontSize,
          fontWeight: "700",
          boxShadow: "0 1px 4px rgba(22, 163, 74, 0.08)",
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
        title="Vegetarian"
      >
        <span
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: "#16A34A",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        {showLabel && "Veg"}
      </span>

      {isVegan && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "#ECFDF5",
            color: "#059669",
            border: "1.2px solid #A7F3D0",
            borderRadius: "6px",
            padding: padding,
            fontSize: fontSize,
            fontWeight: "700",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
          title="Vegan"
        >
          Vegan 🌿
        </span>
      )}

      {isJain && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "#FEFCE8",
            color: "#CA8A04",
            border: "1.2px solid #FDE047",
            borderRadius: "6px",
            padding: padding,
            fontSize: fontSize,
            fontWeight: "700",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
          title="Jain"
        >
          Jain 🙏
        </span>
      )}
    </div>
  );
};

export default DietaryTag;
