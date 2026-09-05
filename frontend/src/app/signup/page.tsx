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
        justifyContent: "center",
        alignItems: "stretch",
        backgroundColor: "#FFF9F4",
        overflowX: "hidden",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="signup-page-split"
    >
      {/* 1. Left Visual Hero Component (680px width) */}
      <div
        style={{
          flex: "0 0 680px",
          width: "680px",
          maxWidth: "680px",
          minHeight: "900px",
          position: "relative",
        }}
        className="signup-left-pane"
      >
        <SignUpLeftComponent />
      </div>

      {/* 2. Right Form Container (760px layout) */}
      <div
        style={{
          flex: "0 0 760px",
          width: "760px",
          maxWidth: "760px",
          minHeight: "900px",
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
        @media (max-width: 1440px) {
          .signup-left-pane {
            flex: 1 1 48% !important;
            width: 48% !important;
            max-width: 680px !important;
          }
          .signup-right-pane {
            flex: 1 1 52% !important;
            width: 52% !important;
            max-width: 760px !important;
          }
        }
        @media (max-width: 1024px) {
          .signup-page-split {
            flex-direction: column !important;
          }
          .signup-left-pane {
            flex: none !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 520px !important;
          }
          .signup-right-pane {
            flex: none !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
