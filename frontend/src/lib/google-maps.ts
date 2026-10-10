/**
 * Google Maps Client SDK Loader & API Utilities
 * Supports real-time Places suggestions, Geocoding, Reverse Geocoding,
 * and seamless fallback when Google Maps key is missing or offline.
 */

import { fetchApi } from "./fetch-api";

export interface NormalizedAddressDetails {
  pincode?: string;
  street?: string;
  locality?: string;
  landmark?: string;
  houseNumber?: string;
  city?: string;
  state?: string;
  formattedAddress?: string;
  address?: string;
  provider?: string;
  lat?: number;
  lng?: number;
}

export interface PlacePredictionItem {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types?: string[];
  lat?: number;
  lng?: number;
  details?: Partial<NormalizedAddressDetails>;
}

interface MapsConfigResponse {
  isConfigured: boolean;
  apiKey: string | null;
  provider: string;
  defaultCenter?: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
}

let mapsConfigPromise: Promise<MapsConfigResponse | null> | null = null;
let googleMapsScriptPromise: Promise<boolean> | null = null;

/**
 * Fetch Google Maps config from backend
 */
export async function getGoogleMapsConfig(): Promise<MapsConfigResponse | null> {
  if (typeof window === "undefined") return null;

  if (mapsConfigPromise) {
    return mapsConfigPromise;
  }

  mapsConfigPromise = (async () => {
    try {
      // 1. Direct client env check if available
      const clientKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (clientKey && clientKey.trim() && clientKey !== "your_google_maps_key") {
        return {
          isConfigured: true,
          apiKey: clientKey.trim(),
          provider: "google_maps",
          defaultCenter: { lat: 18.5204, lng: 73.8567, city: "Pune", state: "Maharashtra" },
        };
      }

      // 2. Fetch server-configured key from backend
      const res = await fetchApi("/api/public/maps/config");
      if (res.ok) {
        const json = await res.json();
        const cfg = json.data || json;
        return {
          isConfigured: Boolean(cfg.isConfigured && cfg.apiKey && cfg.apiKey !== "your_google_maps_key"),
          apiKey: cfg.apiKey || null,
          provider: cfg.provider || "google_maps",
          defaultCenter: cfg.defaultCenter || { lat: 18.5204, lng: 73.8567, city: "Pune", state: "Maharashtra" },
        };
      }
    } catch (err) {
      console.warn("Failed to retrieve Google Maps config:", err);
    }
    return {
      isConfigured: false,
      apiKey: null,
      provider: "openstreetmap",
      defaultCenter: { lat: 18.5204, lng: 73.8567, city: "Pune", state: "Maharashtra" },
    };
  })();

  return mapsConfigPromise;
}

/**
 * Dynamically loads the official Google Maps JavaScript API script
 */
export async function loadGoogleMapsScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Already loaded
  if ((window as any).google && (window as any).google.maps) {
    return true;
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise(async (resolve) => {
    try {
      const config = await getGoogleMapsConfig();
      if (!config?.isConfigured || !config.apiKey) {
        resolve(false);
        return;
      }

      // Check if script tag already exists in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        if ((window as any).google && (window as any).google.maps) {
          resolve(true);
          return;
        }
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        config.apiKey
      )}&libraries=places,geometry&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        resolve(true);
      };

      script.onerror = (e) => {
        console.warn("Google Maps JavaScript API script failed to load:", e);
        resolve(false);
      };

      document.head.appendChild(script);
    } catch (err) {
      console.warn("Error initializing Google Maps SDK loader:", err);
      resolve(false);
    }
  });

  return googleMapsScriptPromise;
}

/**
 * Real-time Places Autocomplete Suggestions
 * Uses backend proxy /api/public/maps/autocomplete (which queries Google Places API with OSM fallback).
 */
export async function fetchPlaceSuggestions(
  query: string,
  options?: { lat?: number; lng?: number; sessionToken?: string }
): Promise<PlacePredictionItem[]> {
  const q = (query || "").trim();
  if (!q) return [];

  try {
    const params = new URLSearchParams();
    params.set("input", q);
    if (options?.lat !== undefined) params.set("lat", String(options.lat));
    if (options?.lng !== undefined) params.set("lng", String(options.lng));
    if (options?.sessionToken) params.set("sessionToken", options.sessionToken);

    const res = await fetchApi(`/api/public/maps/autocomplete?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      const list = json.data?.suggestions || json.suggestions || [];
      if (Array.isArray(list)) {
        return list;
      }
    }
  } catch (err) {
    console.warn("Autocomplete suggestions fetch warning:", err);
  }

  return [];
}

/**
 * Place Details lookup by place_id
 */
export async function fetchPlaceDetails(
  placeId: string,
  sessionToken?: string
): Promise<NormalizedAddressDetails | null> {
  if (!placeId) return null;

  try {
    const params = new URLSearchParams();
    params.set("placeId", placeId);
    if (sessionToken) params.set("sessionToken", sessionToken);

    const res = await fetchApi(`/api/public/maps/place-details?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      const details = json.data?.details || json.details || null;
      if (details) {
        return details;
      }
    }
  } catch (err) {
    console.warn("Place details fetch warning:", err);
  }

  return null;
}

/**
 * Reverse Geocode: lat/lng -> full normalized address
 */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<NormalizedAddressDetails> {
  try {
    const res = await fetchApi(`/api/public/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const json = await res.json();
      const details = json.data?.details || json.details;
      if (details) {
        return {
          ...details,
          address: details.formattedAddress || details.address || "",
        };
      }
    }
  } catch (err) {
    console.warn("Reverse geocode fetch warning:", err);
  }

  return {
    lat,
    lng,
    pincode: "",
    street: "",
    locality: "Pune Area",
    landmark: "",
    houseNumber: "",
    city: "Pune",
    state: "Maharashtra",
    formattedAddress: "",
    address: "",
  };
}

/**
 * Forward Geocode: address text -> coordinates and normalized address
 */
export async function geocodeAddressQuery(
  address: string
): Promise<NormalizedAddressDetails | null> {
  const q = (address || "").trim();
  if (!q) return null;

  try {
    const res = await fetchApi(`/api/public/maps/geocode?address=${encodeURIComponent(q)}`);
    if (res.ok) {
      const json = await res.json();
      const details = json.data?.details || json.details;
      if (details) {
        return details;
      }
    }
  } catch (err) {
    console.warn("Geocode address query warning:", err);
  }

  return null;
}

// Aliases for convenience across components
export const reverseGeocodeWithGoogle = reverseGeocodeCoords;
export const geocodeWithGoogle = geocodeAddressQuery;
export const fetchPlacesAutocomplete = fetchPlaceSuggestions;
