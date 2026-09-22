/**
 * Utility functions and constants for frontend file upload validation.
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_FILE_SIZE_LABEL = "5MB";

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export interface FileValidationResult {
  isValid: boolean;
  sizeFormatted: string;
  errorMessage?: string;
}

export function validateFileSize(file: File, maxBytes: number = MAX_FILE_SIZE_BYTES): FileValidationResult {
  const sizeFormatted = formatFileSize(file.size);
  if (file.size > maxBytes) {
    return {
      isValid: false,
      sizeFormatted,
      errorMessage: `File size (${sizeFormatted}) exceeds the ${MAX_FILE_SIZE_LABEL} limit. Please upload a smaller file.`,
    };
  }
  return {
    isValid: true,
    sizeFormatted,
  };
}
