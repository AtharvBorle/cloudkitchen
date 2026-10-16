/**
 * ==============================================================================
 * 📱 Neo Cloud Bites - Centralized SMS Service (Way2Smart Gateway)
 * ==============================================================================
 * Handles transactional OTP delivery via the approved Way2Smart DLT gateway.
 * Safe & non-blocking fallback if credentials are not configured.
 */

const SMS_GATEWAY_URL =
  process.env.SMS_GATEWAY_URL ||
  process.env.SMS_API_URL ||
  "https://platform.way2smart.in/index.php/sms/urlsms";

const SMS_SENDER = process.env.SMS_SENDER || "NEOPCE";
const SMS_API_KEY = process.env.SMS_API_KEY || "1bfe52-6fc3a4-51fd27-26016f-75bb39";
const SMS_DLT_ENTITY_ID = process.env.SMS_DLT_ENTITY_ID || "1701177338694666324";
const SMS_DLT_TEMPLATE_ID = process.env.SMS_DLT_TEMPLATE_ID || "1707178377588111415";
const SMS_APP_HASH = process.env.SMS_APP_HASH || "g98us9GoAaG";

/**
 * Builds the exact approved DLT template message for OTP verification.
 * Template format:
 * Dear Customer your Otp for login is {154205} . This code will expire in 10 minutes . - Neopace Team g98us9GoAaG
 */
export function buildOtpMessage(otp: string): string {
  const customTemplate = process.env.SMS_TEMPLATE;
  if (customTemplate) {
    if (customTemplate.includes("{154205}")) {
      return customTemplate.replace("{154205}", `{${otp}}`);
    }
    if (customTemplate.includes("{##OTP##}")) {
      return customTemplate.replace("{##OTP##}", `{${otp}}`);
    }
    if (customTemplate.includes("{#OTP#}")) {
      return customTemplate.replace("{#OTP#}", `{${otp}}`);
    }
    if (customTemplate.includes("{#var#}")) {
      return customTemplate.replace("{#var#}", `{${otp}}`);
    }
    if (customTemplate.includes("{OTP}")) {
      return customTemplate.replace("{OTP}", `{${otp}}`);
    }
    if (customTemplate.includes("[OTP]")) {
      return customTemplate.replace("[OTP]", `{${otp}}`);
    }
    return customTemplate.replace(/\{\d+\}/, `{${otp}}`);
  }

  // Exact DLT registered template
  return `Dear Customer your Otp for login is {${otp}} . This code will expire in 10 minutes . - Neopace Team ${SMS_APP_HASH}`;
}

export interface SendSmsResult {
  success: boolean;
  code?: number | string;
  status?: string;
  error?: string;
  data?: any;
}

/**
 * Sends an OTP SMS to a 10-digit Indian mobile number via Way2Smart.
 */
export async function sendOtpSms(mobileNumber: string, otp: string): Promise<SendSmsResult> {
  try {
    const rawDigits = String(mobileNumber || "").replace(/\D/g, "");
    const cleanNumber = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;

    if (cleanNumber.length !== 10) {
      console.warn(`[SmsService] ⚠️ Invalid mobile number: "${mobileNumber}". Must be 10 digits.`);
      return { success: false, error: "Invalid mobile number. Must be 10 digits." };
    }

    if (!SMS_API_KEY || SMS_API_KEY.includes("YOUR_")) {
      console.warn(`[SmsService] ⚠️ SMS_API_KEY not configured. Skipping SMS to ${cleanNumber}. (OTP: ${otp})`);
      return { success: false, error: "SMS gateway credentials not configured." };
    }

    const message = buildOtpMessage(otp);

    const queryParams = new URLSearchParams({
      sender: SMS_SENDER,
      numbers: cleanNumber,
      message: message,
      messagetype: "TXT",
      reponse: "Y",
      apikey: SMS_API_KEY,
      dltentityid: SMS_DLT_ENTITY_ID,
      dlttempid: SMS_DLT_TEMPLATE_ID,
    });

    const url = `${SMS_GATEWAY_URL}?${queryParams.toString()}`;

    console.log(`[SmsService] 📤 Dispatching OTP SMS to ${cleanNumber} (Template ID: ${SMS_DLT_TEMPLATE_ID})...`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const data: any = await response.json().catch(() => null);

    if (response.ok && (data?.status === "success" || data?.code === 200 || data?.code === "200")) {
      console.log(`[SmsService] ✅ OTP SMS delivered successfully to ${cleanNumber}. Response:`, JSON.stringify(data));
      return { success: true, code: data?.code, status: data?.status, data };
    }

    console.warn(`[SmsService] ⚠️ SMS Gateway returned non-success response:`, data || response.statusText);
    return {
      success: false,
      code: data?.code || response.status,
      status: data?.status || "error",
      error: data?.status || data?.message || "SMS delivery failed",
    };
  } catch (err: any) {
    console.error(`[SmsService] ❌ Failed to send SMS to ${mobileNumber}:`, err.message || err);
    return { success: false, error: err.message || "Failed to reach SMS gateway" };
  }
}
