/**
 * ==============================================================================
 * 🔐 In-Memory OTP Store & Validator
 * ==============================================================================
 * Manages OTP generation, time-to-live (10 minutes), rate limiting, and verification.
 */

interface StoredOtp {
  otp: string;
  expiresAt: number; // timestamp in ms
  attempts: number;
}

const otpCache = new Map<string, StoredOtp>();

// Cleanup expired OTPs every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of otpCache.entries()) {
      if (value.expiresAt <= now) {
        otpCache.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();
}

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes (matches DLT message)
export const MASTER_OTP = "123456";

function normalizeKey(identifier: string, purpose: string): string {
  const digits = identifier.replace(/\D/g, "");
  const cleanId = digits.length >= 10 ? digits.slice(-10) : identifier.trim().toLowerCase();
  return `${purpose}:${cleanId}`;
}

export function generate6DigitOtp(): string {
  // Generate random 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function setOtp(identifier: string, otp: string, purpose: string = "login"): void {
  const key = normalizeKey(identifier, purpose);
  otpCache.set(key, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
}

export function getStoredOtp(identifier: string, purpose: string = "login"): string | null {
  const key = normalizeKey(identifier, purpose);
  const entry = otpCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    otpCache.delete(key);
    return null;
  }
  return entry.otp;
}

export function verifyOtp(identifier: string, inputOtp: string, purpose: string = "login"): boolean {
  const trimmed = String(inputOtp || "").trim();
  if (!trimmed) return false;

  // Master OTP allowed for development and testing
  const allowMaster = process.env.ALLOW_MASTER_OTP !== "false";
  if (allowMaster && trimmed === MASTER_OTP) {
    return true;
  }

  const key = normalizeKey(identifier, purpose);
  const entry = otpCache.get(key);
  if (!entry) return false;

  if (entry.expiresAt <= Date.now()) {
    otpCache.delete(key);
    return false;
  }

  entry.attempts += 1;
  if (entry.attempts > 5) {
    otpCache.delete(key);
    return false;
  }

  return entry.otp === trimmed;
}

export function consumeOtp(identifier: string, purpose: string = "login"): void {
  const key = normalizeKey(identifier, purpose);
  otpCache.delete(key);
}
