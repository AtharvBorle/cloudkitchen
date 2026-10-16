import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generate6DigitOtp, setOtp } from "@/lib/otpStore";
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
    }

    const otp = generate6DigitOtp();
    setOtp(cleanNumber, otp, purpose);

    // Dispatch SMS via Way2Smart
    const smsRes = await sendOtpSms(cleanNumber, otp);

    return NextResponse.json(
      {
        success: true,
        message: `OTP has been sent to +91 ${cleanNumber}. Valid for 10 minutes.`,
        phone: cleanNumber,
        deliveryStatus: smsRes.success ? "DELIVERED" : "QUEUED",
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
