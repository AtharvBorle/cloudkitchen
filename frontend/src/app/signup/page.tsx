"use client";

import React from "react";
import SignUpLeftComponent from "@/components/sign-up/SignUpLeftComponent";
import SignUpRightComponent from "@/components/sign-up/SignUpRightComponent";

export default function SignUpPage() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "row",
        backgroundColor: "#FFF9F4",
        overflowX: "hidden",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="signup-page-split"
    >
      {/* 1. Left Visual Hero Component (approx 45% - 48% width) */}
      <div
        style={{
          flex: "1 1 48%",
          minWidth: "480px",
          minHeight: "100vh",
          position: "relative",
        }}
        className="signup-left-pane"
      >
        <SignUpLeftComponent />
      </div>

      {/* 2. Right Form Container (760px x 900px layout) */}
      <div
        style={{
          flex: "1 1 52%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
        className="signup-right-pane"
      >
        <SignUpRightComponent />
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .signup-page-split {
            flex-direction: column !important;
          }
          .signup-left-pane {
            width: 100% !important;
            min-width: 100% !important;
            min-height: 480px !important;
          }
          .signup-right-pane {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
