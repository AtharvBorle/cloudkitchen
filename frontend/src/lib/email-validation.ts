/**
 * Comprehensive email validation utility adhering to standard email specifications (RFC 5321 / RFC 5322).
 */

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  normalizedEmail: string;
}

/**
 * Validates an email address against strict standard rules:
 * - Email field cannot be empty.
 * - No spaces allowed anywhere.
 * - Minimum length 5 characters, maximum length 254 characters.
 * - Exactly one '@' symbol.
 * - Valid text before '@' (letters, digits, dot, underscore, hyphen, plus).
 * - Special characters like # % & * ! ? ^ { } | ~ are rejected.
 * - Dot rules: cannot start with dot, cannot end with dot before '@', no consecutive dots (..).
 * - Domain rules: must contain a dot, valid domain labels, no consecutive dots.
 * - Top-Level Domain (TLD) must be at least 2 alphabetic letters (e.g. .com, .in, .org, .net).
 * - Case-insensitive normalization.
 */
export function validateEmail(rawEmail?: string | null): EmailValidationResult {
  if (!rawEmail || !rawEmail.trim()) {
    return { isValid: false, error: "Email is required.", normalizedEmail: "" };
  }

  const email = rawEmail.trim();

  // 1. Check spaces anywhere
  if (/\s/.test(email)) {
    return { isValid: false, error: "Email cannot contain spaces.", normalizedEmail: email.toLowerCase() };
  }

  // 2. Length check (RFC standard: 5 to 254 characters)
  if (email.length < 5 || email.length > 254) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  // 3. Exactly one '@' symbol
  const atParts = email.split("@");
  if (atParts.length !== 2) {
    return { isValid: false, error: "Please enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  const [localPart, domainPart] = atParts;

  // 4. Must have text before '@'
  if (!localPart || localPart.length === 0) {
    return { isValid: false, error: "Enter a valid email address.", normalizedEmail: email.toLowerCase() };
  }

  // 5. Dot rules on local part before '@'
  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return { isValid: false, error: "Email format is invalid.", normalizedEmail: email.toLowerCase() };
  }
  if (localPart.includes("..")) {
    return { isValid: false, error: "Email format is invalid.", normalizedEmail: email.toLowerCase() };
  }

  // 6. Character validation for local part: letters, numbers, dot, underscore, hyphen, plus
  const localPartRegex = /^[a-zA-Z0-9._+-]+$/;
  if (!localPartRegex.test(localPart)) {
    return { isValid: false, error: "Email format is invalid.", normalizedEmail: email.toLowerCase() };
  }

  // 7. Domain part validation
  if (!domainPart || domainPart.length === 0) {
    return { isValid: false, error: "Email domain is invalid.", normalizedEmail: email.toLowerCase() };
  }

  // Domain cannot start or end with dot or hyphen
  if (domainPart.startsWith(".") || domainPart.endsWith(".") || domainPart.startsWith("-") || domainPart.endsWith("-")) {
    return { isValid: false, error: "Email domain is invalid.", normalizedEmail: email.toLowerCase() };
  }

  // Domain cannot have consecutive dots
  if (domainPart.includes("..")) {
    return { isValid: false, error: "Email domain is invalid.", normalizedEmail: email.toLowerCase() };
  }

  // Domain must contain a dot (.)
  if (!domainPart.includes(".")) {
    return { isValid: false, error: "Email domain is invalid.", normalizedEmail: email.toLowerCase() };
  }

  // Domain labels check
  const domainLabels = domainPart.split(".");
  if (domainLabels.length < 2) {
    return { isValid: false, error: "Email domain is invalid.", normalizedEmail: email.toLowerCase() };
  }

  for (let i = 0; i < domainLabels.length; i++) {
    const label = domainLabels[i];
    if (!label || label.length === 0) {
      return { isValid: false, error: "Email domain is invalid.", normalizedEmail: email.toLowerCase() };
    }
    // Each domain label must only contain letters, numbers, hyphens
    if (!/^[a-zA-Z0-9-]+$/.test(label) || label.startsWith("-") || label.endsWith("-")) {
      return { isValid: false, error: "Email domain is invalid.", normalizedEmail: email.toLowerCase() };
    }
  }

  // Top-Level Domain (TLD) must be at least 2 alphabetic letters (e.g. .com, .in, .org, .net)
  const tld = domainLabels[domainLabels.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) {
    return { isValid: false, error: "Email domain is invalid.", normalizedEmail: email.toLowerCase() };
  }

  return {
    isValid: true,
    normalizedEmail: email.toLowerCase(),
  };
}

export function isValidEmail(email?: string | null): boolean {
  return validateEmail(email).isValid;
}
