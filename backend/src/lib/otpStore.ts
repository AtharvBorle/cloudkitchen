import crypto from "crypto";

/**
 * ==============================================================================
 * 🔐 Cryptographically Secure In-Memory OTP Store & Validator
 * ==============================================================================
 * Manages secure OTP generation, time-to-live (10 minutes), attempt limiting,
 * and constant-time comparison to prevent timing attacks.
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

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const MASTER_OTP = "123456";

function normalizeKey(identifier: string, purpose: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes("@")) {
    return `${purpose}:${trimmed}`;
  }
  const digits = identifier.replace(/\D/g, "");
  const cleanId = digits.length >= 10 ? digits.slice(-10) : trimmed;
  return `${purpose}:${cleanId}`;
}

export function generate6DigitOtp(): string {
  // Use cryptographically secure pseudorandom integer generation
  return crypto.randomInt(100000, 1000000).toString();
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

let dbMasterOtpOverride: boolean | null = null;

export function setMasterOtpDbOverride(enabled: boolean | null): void {
  dbMasterOtpOverride = enabled;
}

export function isMasterOtpEnabled(): boolean {
  if (dbMasterOtpOverride !== null) {
    return dbMasterOtpOverride;
  }
  const raw = (
    process.env.ALLOW_MASTER_OTP ||
    process.env.ALLOW_MASTER_OTP_IN_PRODUCTION ||
    process.env.MASTER_OTP_ENABLED ||
    process.env.ENABLE_MASTER_OTP ||
    process.env.MASTER_OTP ||
    ""
  ).trim().replace(/^['"]|['"]$/g, "").toLowerCase();

  return (
    raw === "true" ||
    raw === "1" ||
    raw === "yes" ||
    raw === "enabled" ||
    raw === "on"
  );
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyOtp(identifier: string, inputOtp: string, purpose: string = "login"): boolean {
  const trimmed = String(inputOtp || "").trim();
  if (!trimmed || trimmed.length !== 6) return false;

  const allowMaster = isMasterOtpEnabled();

  // 1. When ALLOW_MASTER_OTP is true:
  if (allowMaster) {
    return timingSafeStringEqual(trimmed, MASTER_OTP);
  }

  // 2. When ALLOW_MASTER_OTP is false:
  // Master OTP is strictly rejected. Only the real OTP sent via SMS/Email matches.
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

  const isValid = timingSafeStringEqual(entry.otp, trimmed);
  if (isValid) {
    otpCache.delete(key);
  }
  return isValid;
}

export function consumeOtp(identifier: string, purpose: string = "login"): void {
  const key = normalizeKey(identifier, purpose);
  otpCache.delete(key);
}
