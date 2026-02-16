/**
 * Browser geolocation utilities
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type GeolocationError = 
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "not_supported";

export interface GeolocationResult {
  success: boolean;
  coordinates?: Coordinates;
  error?: GeolocationError;
  errorMessage?: string;
}

/**
 * Request user's current location using browser Geolocation API
 * @param timeout Timeout in milliseconds (default: 10000)
 * @returns Promise with coordinates or error
 */
export async function getCurrentLocation(
  timeout: number = 10000
): Promise<GeolocationResult> {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    return {
      success: false,
      error: "not_supported",
      errorMessage: "Geolocation is not supported by your browser",
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      (error) => {
        let errorType: GeolocationError;
        let errorMessage: string;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = "permission_denied";
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = "position_unavailable";
            errorMessage = "Location information is unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorType = "timeout";
            errorMessage = "Location request timed out. Please try again.";
            break;
          default:
            errorType = "position_unavailable";
            errorMessage = "An unknown error occurred while getting your location.";
        }

        resolve({
          success: false,
          error: errorType,
          errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 30000, // Cache position for 30 seconds
      }
    );
  });
}

/**
 * Check if geolocation permission is granted
 * @returns Permission state: "granted", "denied", "prompt", or "unsupported"
 */
export async function checkLocationPermission(): Promise<
  "granted" | "denied" | "prompt" | "unsupported"
> {
  if (!navigator.permissions) {
    return "unsupported";
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state as "granted" | "denied" | "prompt";
  } catch (error) {
    return "unsupported";
  }
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string (e.g., "2.5 km" or "500 m")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
