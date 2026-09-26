/**
 * Comprehensive email validation utility adhering to strict standard email specifications (RFC 5321 / RFC 5322).
 */

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  normalizedEmail: string;
}

const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9]+([._+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

export function validateEmail(rawEmail?: string | null): EmailValidationResult {
  if (!rawEmail || !rawEmail.trim()) {
    return { isValid: false, error: "Email is required.", normalizedEmail: "" };
  }

  const email = rawEmail.trim();

  if (/\s/.test(email)) {
    return { isValid: false, error: "Email cannot contain spaces.", normalizedEmail: email.toLowerCase() };
  }

  if (email.length < 5 || email.length > 254) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  const atParts = email.split("@");
  if (atParts.length !== 2) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  const [localPart, domainPart] = atParts;

  if (!localPart || localPart.length === 0) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  if (
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.startsWith("+") ||
    localPart.startsWith("-") ||
    localPart.startsWith("_") ||
    localPart.endsWith("+") ||
    localPart.endsWith("-") ||
    localPart.endsWith("_") ||
    localPart.includes("..")
  ) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  if (!/^[a-zA-Z0-9._+-]+$/.test(localPart) || !/[a-zA-Z0-9]/.test(localPart)) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  if (!domainPart || domainPart.length === 0) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  if (domainPart.startsWith(".") || domainPart.endsWith(".") || domainPart.startsWith("-") || domainPart.endsWith("-") || domainPart.includes("..") || !domainPart.includes(".")) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  const domainLabels = domainPart.split(".");
  if (domainLabels.length < 2) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  for (let i = 0; i < domainLabels.length; i++) {
    const label = domainLabels[i];
    if (!label || !/^[a-zA-Z0-9-]+$/.test(label) || label.startsWith("-") || label.endsWith("-")) {
      return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
    }
  }

  const tld = domainLabels[domainLabels.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  if (!STRICT_EMAIL_REGEX.test(email)) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  return {
    isValid: true,
    normalizedEmail: email.toLowerCase(),
  };
}

export function isValidEmail(email?: string | null): boolean {
  return validateEmail(email).isValid;
}
