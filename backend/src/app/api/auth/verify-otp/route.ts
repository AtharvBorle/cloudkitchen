import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOtp, consumeOtp, isMasterOtpEnabled, setMasterOtpDbOverride } from "@/lib/otpStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, email, otp, purpose = "signup" } = body;

    try {
      const dbSetting = await db.systemSettings.findFirst({
        where: { key: { in: ["ALLOW_MASTER_OTP", "MASTER_OTP", "ENABLE_MASTER_OTP"] } }
      });
      if (dbSetting) {
        const val = (dbSetting.value || "").trim().replace(/^['"]|['"]$/g, "").toLowerCase();
        setMasterOtpDbOverride(val === "true" || val === "1" || val === "yes");
      }
    } catch {
      // fallback to env
    }

    const trimmedOtp = String(otp || "").trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 6-digit verification code." },
        { status: 400 }
      );
    }

    // Email verification flow
    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
        return NextResponse.json(
          { success: false, message: "Please provide a valid email address." },
          { status: 400 }
        );
      }

      const isValid = verifyOtp(cleanEmail, trimmedOtp, purpose);

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            message: isMasterOtpEnabled()
              ? "Invalid verification code. Master OTP mode is enabled; please use 123456."
              : "Invalid or expired verification code. Please check and try again.",
          },
          { status: 400 }
        );
      }

      consumeOtp(cleanEmail, purpose);

      return NextResponse.json(
        {
          success: true,
          verified: true,
          message: "Email address verified successfully.",
          email: cleanEmail,
        },
        { status: 200 }
      );
    }

    // Phone verification flow
    const rawDigits = String(phone || "").replace(/\D/g, "");
    const cleanNumber = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;

    if (cleanNumber.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const isValid = verifyOtp(cleanNumber, trimmedOtp, purpose);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: isMasterOtpEnabled()
            ? "Invalid verification code. Master OTP mode is enabled; please use 123456."
            : "Invalid or expired verification code. Please check and try again.",
        },
        { status: 400 }
      );
    }

    consumeOtp(cleanNumber, purpose);

    return NextResponse.json(
      {
        success: true,
        verified: true,
        message: "Mobile number verified successfully.",
        phone: cleanNumber,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[verify-otp] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to verify OTP." },
      { status: 500 }
    );
  }
}
