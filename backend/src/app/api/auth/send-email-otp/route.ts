import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generate6DigitOtp, setOtp, isMasterOtpEnabled, MASTER_OTP } from "@/lib/otpStore";
import { sendVerificationEmailOtp } from "@/lib/emailService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, purpose = "seller_onboarding", name } = body;

    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (purpose === "seller_onboarding" || purpose === "signup" || purpose === "register") {
      const existingUser = await db.user.findFirst({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "An account with this email address already exists. Please sign in or use a different email.",
          },
          { status: 409 }
        );
      }
    }

    const masterMode = isMasterOtpEnabled();
    const otp = masterMode ? MASTER_OTP : generate6DigitOtp();
    setOtp(cleanEmail, otp, purpose);

    if (masterMode) {
      console.log(`[send-email-otp] Master OTP mode active (ALLOW_MASTER_OTP=true). Suppressing real email to <${cleanEmail}>.`);
      return NextResponse.json(
        {
          success: true,
          message: `Verification code ready. Master OTP mode active (Code: ${MASTER_OTP}).`,
          email: cleanEmail,
          deliveryStatus: "SKIPPED_MASTER_OTP",
          masterOtpActive: true,
          otp: MASTER_OTP,
        },
        { status: 200 }
      );
    }

    // Send real email via SMTP when master OTP is disabled
    const emailRes = await sendVerificationEmailOtp({
      email: cleanEmail,
      otp,
      userName: name || "Partner",
      purpose,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Verification code has been sent to ${cleanEmail}. Valid for 10 minutes.`,
        email: cleanEmail,
        deliveryStatus: emailRes.success ? "DELIVERED" : "QUEUED",
        masterOtpActive: false,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[send-email-otp] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }
}
