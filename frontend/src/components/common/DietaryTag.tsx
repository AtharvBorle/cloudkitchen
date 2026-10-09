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

  if (itemType) {
    const raw = String(itemType).split(",").map((s) => s.trim().toUpperCase());
    isNonVeg = raw.includes("NON_VEG") || raw.includes("NON-VEG") || raw.includes("NON VEG");
    isVegan = raw.includes("VEGAN");
    isJain = raw.includes("JAIN");
  } else if (typeof isVeg === "boolean") {
    isNonVeg = !isVeg;
  }

  const dotSize = size === "xs" ? "6px" : size === "sm" ? "7px" : "8px";
  const fontSize = size === "xs" ? "0.68rem" : size === "sm" ? "0.74rem" : "0.82rem";
  const padding = size === "xs" ? "2px 7px" : size === "sm" ? "3px 8px" : "4px 10px";
  const borderRadius = "6px";

  if (isNonVeg) {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4.5px",
          backgroundColor: "#FEECEB",
          color: "#991B1B",
          borderRadius: borderRadius,
          padding: padding,
          fontSize: fontSize,
          fontWeight: "700",
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
            backgroundColor: "#B91C1C",
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
        gap: "6px",
        flexWrap: "nowrap",
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4.5px",
          backgroundColor: "#EAF7EE",
          color: "#1E5E3A",
          borderRadius: borderRadius,
          padding: padding,
          fontSize: fontSize,
          fontWeight: "700",
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
            backgroundColor: "#1E5E3A",
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
            backgroundColor: "#EAF7EE",
            color: "#1E5E3A",
            borderRadius: borderRadius,
            padding: padding,
            fontSize: fontSize,
            fontWeight: "700",
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
          title="Vegan"
        >
          Vegan
        </span>
      )}

      {isJain && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "#EAF7EE",
            color: "#1E5E3A",
            borderRadius: borderRadius,
            padding: padding,
            fontSize: fontSize,
            fontWeight: "700",
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
          title="Jain"
        >
          Jain
        </span>
      )}
    </div>
  );
};

export default DietaryTag;
