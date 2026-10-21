import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generate6DigitOtp, setOtp, isMasterOtpEnabled, MASTER_OTP } from "@/lib/otpStore";
import { sendOtpSms } from "@/lib/smsService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, purpose = "login" } = body;

    const rawDigits = String(phone || "").replace(/\D/g, "");
    const cleanNumber = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;

    if (cleanNumber.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (purpose === "login") {
      const user = await db.user.findFirst({
        where: {
          OR: [
            { phone: cleanNumber },
            { phone: `+91${cleanNumber}` },
            { phone: `+91 ${cleanNumber}` },
            { phone: { contains: cleanNumber } },
          ],
          role: "USER",
        },
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "No registered customer account found with this mobile number. Please register first.",
          },
          { status: 404 }
        );
      }

      if (user.isPermanentlyDeleted) {
        return NextResponse.json(
          { success: false, message: "This account has been permanently deleted and cannot be accessed." },
          { status: 403 }
        );
      }

      if (user.isActive === false) {
        return NextResponse.json(
          { success: false, message: "Your account is currently inactive. Please contact support." },
          { status: 403 }
        );
      }
    } else if (purpose === "seller_onboarding" || purpose === "signup" || purpose === "register") {
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { phone: cleanNumber },
            { phone: `+91${cleanNumber}` },
            { phone: `+91 ${cleanNumber}` },
            { phone: { contains: cleanNumber } },
          ],
        },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "An account with this mobile number already exists. Please sign in or use a different mobile number.",
          },
          { status: 409 }
        );
      }
    }

    const masterMode = isMasterOtpEnabled();
    const otp = masterMode ? MASTER_OTP : generate6DigitOtp();
    setOtp(cleanNumber, otp, purpose);

    if (masterMode) {
      console.log(`[send-otp] Master OTP mode active (ALLOW_MASTER_OTP=true). Suppressing SMS to +91 ${cleanNumber}.`);
      return NextResponse.json(
        {
          success: true,
          message: `Verification code ready. Master OTP mode active (Code: ${MASTER_OTP}).`,
          phone: cleanNumber,
          deliveryStatus: "SKIPPED_MASTER_OTP",
          masterOtpActive: true,
          otp: MASTER_OTP,
        },
        { status: 200 }
      );
    }

    // Dispatch SMS via Way2Smart when master OTP is disabled
    const smsRes = await sendOtpSms(cleanNumber, otp);

    return NextResponse.json(
      {
        success: true,
        message: `OTP has been sent to +91 ${cleanNumber}. Valid for 10 minutes.`,
        phone: cleanNumber,
        deliveryStatus: smsRes.success ? "DELIVERED" : "QUEUED",
        masterOtpActive: false,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[send-otp] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
