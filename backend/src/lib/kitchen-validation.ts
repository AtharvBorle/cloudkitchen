export interface KitchenNameValidationResult {
  isValid: boolean;
  error?: string;
  normalizedName: string;
}

export function validateKitchenName(name: string): KitchenNameValidationResult {
  if (name === undefined || name === null) {
    return {
      isValid: false,
      error: "Kitchen name is required.",
      normalizedName: "",
    };
  }

  const trimmed = name.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: "Kitchen name is required.",
      normalizedName: "",
    };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: "Kitchen name must be at least 3 characters long.",
      normalizedName: trimmed,
    };
  }

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: "Kitchen name cannot exceed 50 characters.",
      normalizedName: trimmed,
    };
  }

  // Must contain at least one alphanumeric character
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Kitchen name must contain letters or numbers.",
      normalizedName: trimmed,
    };
  }

  // Allowed: letters, numbers, spaces, and standard business symbols & ' . , - ( ) /
  const validPattern = /^[a-zA-Z0-9\s&'.,()/-]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error: "Kitchen name contains invalid special characters. Only letters, numbers, spaces, and & ' . , ( ) - / are allowed.",
      normalizedName: trimmed,
    };
  }

  return {
    isValid: true,
    normalizedName: trimmed,
  };
}
