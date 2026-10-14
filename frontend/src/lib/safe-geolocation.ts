/**
 * Safe Geolocation Utility with high-accuracy GPS attempt and graceful low-accuracy fallback.
 * Prevents mobile devices from hanging on GPS satellite acquisition or throwing unhandled TIMEOUT / POSITION_UNAVAILABLE errors.
 */

export interface SafeGeolocationOptions {
  timeout?: number;
  maximumAge?: number;
  enableHighAccuracy?: boolean;
}

export function getSafeCurrentPosition(
  onSuccess: (position: GeolocationPosition) => void,
  onError?: (error: GeolocationPositionError | { code: number; message: string }) => void,
  options?: SafeGeolocationOptions
): void {
  if (typeof window === "undefined" || !navigator.geolocation) {
    onError?.({
      code: 2,
      message: "Geolocation is not supported by your browser or environment.",
    });
    return;
  }

  const highAccuracyOptions: PositionOptions = {
    enableHighAccuracy: options?.enableHighAccuracy ?? true,
    timeout: options?.timeout ?? 5000,
    maximumAge: options?.maximumAge ?? 60000,
  };

  const fallbackOptions: PositionOptions = {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 300000,
  };

  try {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSuccess(pos);
      },
      (firstError) => {
        // If user explicitly denied permission, do not retry
        if (firstError.code === 1 /* PERMISSION_DENIED */) {
          onError?.(firstError);
          return;
        }

        // If timeout or position unavailable on high accuracy, gracefully fallback to network/cell/IP location
        try {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              onSuccess(fallbackPos);
            },
            (fallbackError) => {
              onError?.(fallbackError);
            },
            fallbackOptions
          );
        } catch (e: any) {
          onError?.(firstError);
        }
      },
      highAccuracyOptions
    );
  } catch (err: any) {
    try {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, fallbackOptions);
    } catch {
      onError?.({
        code: 2,
        message: err?.message || "Failed to acquire location",
      });
    }
  }
}
