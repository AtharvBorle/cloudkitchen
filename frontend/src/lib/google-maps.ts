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
let isAuthFailureRegistered = false;
let googleMapsAuthFailed = false;

function cleanClientKey(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/^["']|["']$/g, "").trim();
  const lower = cleaned.toLowerCase();
  if (
    !cleaned ||
    lower === "my key" ||
    lower === "your_google_maps_key" ||
    lower.includes("placeholder") ||
    lower.includes("your_key") ||
    lower.includes("my_key") ||
    cleaned.length < 20
  ) {
    return null;
  }
  return cleaned;
}

function setupAuthFailureHandler() {
  if (typeof window === "undefined" || isAuthFailureRegistered) return;
  isAuthFailureRegistered = true;

  const prevHandler = (window as any).gm_authFailure;
  (window as any).gm_authFailure = () => {
    googleMapsAuthFailed = true;
    console.warn(
      "[Google Maps] Authentication failure: InvalidKeyMapError or API restrictions/billing issue detected. " +
      "Falling back automatically to Leaflet & OpenStreetMap."
    );
    if (typeof prevHandler === "function") {
      try {
        prevHandler();
      } catch {}
    }
    window.dispatchEvent(new CustomEvent("google-maps-auth-failure"));
  };
}

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
      const clientKey = cleanClientKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
      if (clientKey) {
        return {
          isConfigured: true,
          apiKey: clientKey,
          provider: "google_maps",
          defaultCenter: { lat: 18.5204, lng: 73.8567, city: "Pune", state: "Maharashtra" },
        };
      }

      // 2. Fetch server-configured key from backend
      const res = await fetchApi("/api/public/maps/config");
      if (res.ok) {
        const json = await res.json();
        const cfg = json.data || json;
        const serverKey = cleanClientKey(cfg.apiKey);
        return {
          isConfigured: Boolean(cfg.isConfigured && serverKey),
          apiKey: serverKey,
          provider: serverKey ? (cfg.provider || "google_maps") : "openstreetmap",
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

async function waitForGoogleMapsMap(maxWaitMs = 6000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (typeof (window as any).google?.maps?.Map === "function") {
      return true;
    }
    if (typeof (window as any).google?.maps?.importLibrary === "function") {
      try {
        await Promise.allSettled([
          (window as any).google.maps.importLibrary("maps"),
          (window as any).google.maps.importLibrary("marker"),
        ]);
        if (typeof (window as any).google?.maps?.Map === "function") {
          return true;
        }
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 60));
  }
  return typeof (window as any).google?.maps?.Map === "function";
}

/**
 * Dynamically loads the official Google Maps JavaScript API script
 */
export async function loadGoogleMapsScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  setupAuthFailureHandler();

  if (googleMapsAuthFailed) {
    return false;
  }

  // Already loaded and Map constructor is ready
  if (typeof (window as any).google?.maps?.Map === "function") {
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

      if (typeof (window as any).google?.maps?.Map === "function") {
        resolve(true);
        return;
      }

      const callbackName = `__initGoogleMapsSdk_${Date.now()}`;
      let isResolved = false;

      const finishResolve = (success: boolean) => {
        if (isResolved) return;
        isResolved = true;
        try {
          delete (window as any)[callbackName];
        } catch {}
        resolve(success);
      };

      (window as any)[callbackName] = async () => {
        const ready = await waitForGoogleMapsMap(3000);
        finishResolve(ready);
      };

      // Check if script tag already exists in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        const ready = await waitForGoogleMapsMap(5000);
        finishResolve(ready);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        config.apiKey
      )}&libraries=places,geometry,marker&loading=async&callback=${callbackName}`;
      script.async = true;
      script.defer = true;

      script.onload = async () => {
        const ready = await waitForGoogleMapsMap(4000);
        if (ready) {
          finishResolve(true);
        }
      };

      script.onerror = (e) => {
        console.warn("Google Maps JavaScript API script failed to load:", e);
        googleMapsAuthFailed = true;
        window.dispatchEvent(new CustomEvent("google-maps-auth-failure"));
        finishResolve(false);
      };

      // Safety timeout in case callback doesn't fire
      setTimeout(async () => {
        if (!isResolved) {
          const ready = await waitForGoogleMapsMap(2000);
          finishResolve(ready);
        }
      }, 6000);

      document.head.appendChild(script);
    } catch (err) {
      console.warn("Error initializing Google Maps SDK loader:", err);
      resolve(false);
    }
  });

  return googleMapsScriptPromise;
}

/**
 * Parses Google address components array into NormalizedAddressDetails
 */
function parseGoogleAddressComponentsClient(
  components: any[] = [],
  formattedAddress = "",
  lat?: number,
  lng?: number
): NormalizedAddressDetails {
  let pincode = "";
  let houseNumber = "";
  let street = "";
  let locality = "";
  let landmark = "";
  let city = "Pune";
  let state = "Maharashtra";

  for (const comp of components) {
    const types: string[] = comp.types || [];
    const val: string = comp.long_name || comp.short_name || "";

    if (types.includes("postal_code")) {
      pincode = val.replace(/\D/g, "").slice(0, 6);
    } else if (types.includes("street_number") || types.includes("subpremise") || types.includes("premise")) {
      houseNumber = houseNumber ? `${houseNumber}, ${val}` : val;
    } else if (types.includes("route")) {
      street = street ? `${val}, ${street}` : val;
    } else if (types.includes("sublocality_level_2") || types.includes("sublocality_level_3")) {
      street = street ? `${street}, ${val}` : val;
    } else if (types.includes("sublocality_level_1") || types.includes("sublocality") || types.includes("neighborhood")) {
      locality = locality ? `${locality}, ${val}` : val;
    } else if (types.includes("point_of_interest") || types.includes("establishment")) {
      landmark = val;
    } else if (types.includes("locality")) {
      city = val;
    } else if (types.includes("administrative_area_level_2") && !city) {
      city = val;
    } else if (types.includes("administrative_area_level_1")) {
      state = val;
    }
  }

  // Fallback locality/street from formatted address if empty or redundant with city
  if ((!locality || locality.toLowerCase() === city.toLowerCase()) && formattedAddress) {
    const parts = formattedAddress.split(",").map((s) => s.trim());
    const filtered = parts.filter((p) => {
      const pl = p.toLowerCase();
      return pl !== city.toLowerCase() && pl !== "india" && pl !== "maharashtra" && !/^\d{6}$/.test(p);
    });
    if (filtered.length > 0) {
      locality = filtered[0];
    }
  }

  return {
    pincode,
    street,
    locality: locality || street || "Pune",
    landmark,
    houseNumber,
    city: city || "Pune",
    state: state || "Maharashtra",
    formattedAddress,
    lat,
    lng,
  };
}

/**
 * Client-side Google Places AutocompleteService
 * Runs directly in the browser, perfectly respecting HTTP referrer restrictions (*.neocloudbites.com).
 */
async function fetchPlaceSuggestionsClient(
  query: string,
  options?: { lat?: number; lng?: number }
): Promise<PlacePredictionItem[] | null> {
  if (typeof window === "undefined") return null;
  if (!(window as any).google?.maps?.places?.AutocompleteService) {
    await loadGoogleMapsScript();
  }
  if (!(window as any).google?.maps?.places?.AutocompleteService) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const service = new (window as any).google.maps.places.AutocompleteService();
      const request: any = {
        input: query,
        componentRestrictions: { country: "in" },
      };

      const centerLat = options?.lat ?? 18.5204;
      const centerLng = options?.lng ?? 73.8567;
      if ((window as any).google?.maps?.LatLng && (window as any).google?.maps?.Circle) {
        request.locationBias = new (window as any).google.maps.Circle({
          center: new (window as any).google.maps.LatLng(centerLat, centerLng),
          radius: 50000,
        });
      }

      service.getPlacePredictions(request, (predictions: any[], status: any) => {
        if (
          status === (window as any).google.maps.places.PlacesServiceStatus?.OK &&
          Array.isArray(predictions) &&
          predictions.length > 0
        ) {
          const list: PlacePredictionItem[] = predictions.map((p) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text || p.description.split(",")[0],
            secondaryText:
              p.structured_formatting?.secondary_text ||
              p.description.split(",").slice(1).join(", ").trim(),
            types: p.types || [],
          }));
          resolve(list);
        } else {
          resolve(null);
        }
      });
    } catch (err) {
      console.warn("Client-side AutocompleteService failed:", err);
      resolve(null);
    }
  });
}

/**
 * Client-side Google PlacesService for detailed coordinates & address components
 */
async function fetchPlaceDetailsClient(placeId: string): Promise<NormalizedAddressDetails | null> {
  if (typeof window === "undefined" || !placeId) return null;
  if (!(window as any).google?.maps?.places?.PlacesService) {
    await loadGoogleMapsScript();
  }
  if (!(window as any).google?.maps?.places?.PlacesService) return null;

  return new Promise((resolve) => {
    try {
      const dummy = document.createElement("div");
      const service = new (window as any).google.maps.places.PlacesService(dummy);
      service.getDetails(
        {
          placeId,
          fields: ["address_components", "formatted_address", "geometry", "name"],
        },
        (place: any, status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus?.OK && place) {
            const lat = typeof place.geometry?.location?.lat === "function" ? place.geometry.location.lat() : place.geometry?.location?.lat;
            const lng = typeof place.geometry?.location?.lng === "function" ? place.geometry.location.lng() : place.geometry?.location?.lng;
            const parsed = parseGoogleAddressComponentsClient(
              place.address_components || [],
              place.formatted_address || place.name || "",
              lat,
              lng
            );
            resolve(parsed);
          } else {
            resolve(null);
          }
        }
      );
    } catch (err) {
      console.warn("Client-side PlacesService.getDetails failed:", err);
      resolve(null);
    }
  });
}

/**
 * Client-side Google Geocoder for reverse geocoding
 */
async function reverseGeocodeCoordsClient(lat: number, lng: number): Promise<NormalizedAddressDetails | null> {
  if (typeof window === "undefined") return null;
  if (!(window as any).google?.maps?.Geocoder) {
    await loadGoogleMapsScript();
  }
  if (!(window as any).google?.maps?.Geocoder) return null;

  return new Promise((resolve) => {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: any) => {
        if (status === "OK" && Array.isArray(results) && results.length > 0) {
          const first = results[0];
          const parsed = parseGoogleAddressComponentsClient(
            first.address_components || [],
            first.formatted_address || "",
            lat,
            lng
          );
          resolve(parsed);
        } else {
          resolve(null);
        }
      });
    } catch (err) {
      console.warn("Client-side Geocoder failed:", err);
      resolve(null);
    }
  });
}

/**
 * Client-side Google Geocoder for forward address query
 */
async function geocodeAddressQueryClient(address: string): Promise<NormalizedAddressDetails | null> {
  if (typeof window === "undefined" || !address) return null;
  if (!(window as any).google?.maps?.Geocoder) {
    await loadGoogleMapsScript();
  }
  if (!(window as any).google?.maps?.Geocoder) return null;

  return new Promise((resolve) => {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address, componentRestrictions: { country: "in" } }, (results: any[], status: any) => {
        if (status === "OK" && Array.isArray(results) && results.length > 0) {
          const first = results[0];
          const lat = typeof first.geometry?.location?.lat === "function" ? first.geometry.location.lat() : first.geometry?.location?.lat;
          const lng = typeof first.geometry?.location?.lng === "function" ? first.geometry.location.lng() : first.geometry?.location?.lng;
          const parsed = parseGoogleAddressComponentsClient(
            first.address_components || [],
            first.formatted_address || address,
            lat,
            lng
          );
          resolve(parsed);
        } else {
          resolve(null);
        }
      });
    } catch (err) {
      console.warn("Client-side forward Geocoder failed:", err);
      resolve(null);
    }
  });
}

/**
 * Real-time Places Autocomplete Suggestions
 * Uses client-side Google Maps SDK first (works with HTTP-referrer-restricted keys),
 * falling back to backend proxy /api/public/maps/autocomplete (with OSM fallback).
 */
export async function fetchPlaceSuggestions(
  query: string,
  options?: { lat?: number; lng?: number; sessionToken?: string }
): Promise<PlacePredictionItem[]> {
  const q = (query || "").trim();
  if (!q) return [];

  // 1. Try client-side Google Places Autocomplete first
  const clientResults = await fetchPlaceSuggestionsClient(q, options);
  if (clientResults && clientResults.length > 0) {
    return clientResults;
  }

  // 2. Fallback to backend proxy (with OSM Nominatim fallback)
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

  // 1. Try client-side Google PlacesService first
  const clientDetails = await fetchPlaceDetailsClient(placeId);
  if (clientDetails) {
    return clientDetails;
  }

  // 2. Fallback to backend proxy
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
  // 1. Try client-side Google Geocoder first
  const clientGeocoded = await reverseGeocodeCoordsClient(lat, lng);
  if (clientGeocoded) {
    return clientGeocoded;
  }

  // 2. Fallback to backend proxy
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

  // 1. Try client-side Google Geocoder first
  const clientGeocoded = await geocodeAddressQueryClient(q);
  if (clientGeocoded) {
    return clientGeocoded;
  }

  // 2. Fallback to backend proxy
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
