import { NextRequest } from "next/server";
import { PINCODE_COORDINATES } from "@/lib/geo-distance";

export interface NormalizedAddressDetails {
    pincode: string;
    street: string;
    locality: string;
    landmark: string;
    houseNumber: string;
    city: string;
    state: string;
    formattedAddress: string;
    lat: number;
    lng: number;
}

export interface PlaceSuggestion {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
    types: string[];
    lat?: number;
    lng?: number;
    details?: Partial<NormalizedAddressDetails>;
}

const getGoogleMapsApiKey = (): string => {
    const raw = (
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
        ""
    ).trim();
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
        return "";
    }
    return cleaned;
};

/**
 * Returns whether Google Maps is configured and provides the key for client use.
 */
export async function getMapsConfig() {
    const key = getGoogleMapsApiKey();
    return {
        isConfigured: Boolean(key),
        apiKey: key || null,
        provider: key ? "google_maps" : "openstreetmap",
        defaultCenter: {
            lat: 18.5204,
            lng: 73.8567,
            city: "Pune",
            state: "Maharashtra",
            country: "India",
        },
    };
}

/**
 * Parses Google Maps Geocoding address_components into clean normalized fields
 */
function parseGoogleAddressComponents(
    components: any[] = [],
    formattedAddress: string = "",
    lat: number = 18.5204,
    lng: number = 73.8567
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
        locality: locality || street || "Pune Area",
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
 * Places Autocomplete: Proxies to Google Places API with Pune/India bias.
 * Falls back to OSM Nominatim & local Pune Pincode directory if Google API key is missing or fails.
 */
export async function getPlacesAutocomplete(
    input: string,
    sessionToken?: string,
    lat?: number,
    lng?: number,
    radius?: number
): Promise<{ suggestions: PlaceSuggestion[]; provider: string }> {
    const query = (input || "").trim();
    if (!query) {
        return { suggestions: [], provider: "none" };
    }

    const apiKey = getGoogleMapsApiKey();

    if (apiKey) {
        try {
            const centerLat = lat ?? 18.5204;
            const centerLng = lng ?? 73.8567;
            const rad = radius ?? 45000;

            const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
            url.searchParams.set("input", query);
            url.searchParams.set("key", apiKey);
            url.searchParams.set("components", "country:in");
            url.searchParams.set("location", `${centerLat},${centerLng}`);
            url.searchParams.set("radius", String(rad));
            if (sessionToken) {
                url.searchParams.set("sessiontoken", sessionToken);
            }

            const res = await fetch(url.toString(), {
                headers: {
                    "Accept": "application/json",
                    "Referer": "https://dev.neocloudbites.com/",
                    "Origin": "https://dev.neocloudbites.com",
                },
                next: { revalidate: 60 },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === "OK" && Array.isArray(data.predictions)) {
                    const suggestions: PlaceSuggestion[] = data.predictions.map((p: any) => ({
                        placeId: p.place_id,
                        description: p.description,
                        mainText: p.structured_formatting?.main_text || p.description.split(",")[0],
                        secondaryText:
                            p.structured_formatting?.secondary_text ||
                            p.description.split(",").slice(1).join(",").trim(),
                        types: p.types || [],
                    }));
                    return { suggestions, provider: "google_places" };
                } else if (data.status) {
                    console.warn("[Google Places Autocomplete] API status:", data.status, data.error_message || "");
                }
            }
        } catch (err) {
            console.warn("Google Places Autocomplete error, falling back to OSM:", err);
        }
    }

    // Fallback: Local Pune directory & Nominatim
    const suggestions: PlaceSuggestion[] = [];
    const lower = query.toLowerCase();

    // 1. Check Pune Pincodes catalog
    for (const [pin, info] of Object.entries(PINCODE_COORDINATES)) {
        if (pin.includes(lower) || info.locality.toLowerCase().includes(lower)) {
            suggestions.push({
                placeId: `pin-${pin}`,
                description: `${info.locality}, ${info.city} - ${pin}`,
                mainText: info.locality,
                secondaryText: `${info.city}, Maharashtra ${pin}`,
                types: ["postal_code"],
                lat: info.lat,
                lng: info.lng,
                details: {
                    pincode: pin,
                    locality: info.locality,
                    city: info.city,
                    state: "Maharashtra",
                    formattedAddress: `${info.locality}, ${info.city}, Maharashtra ${pin}`,
                    street: "",
                    landmark: "",
                    houseNumber: "",
                    lat: info.lat,
                    lng: info.lng,
                },
            });
            if (suggestions.length >= 4) break;
        }
    }

    // 2. Query Nominatim
    try {
        const nomQuery = query.toLowerCase().includes("pune") ? query : `${query}, Pune, Maharashtra`;
        const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                nomQuery
            )}&countrycodes=in&limit=6&addressdetails=1`,
            {
                headers: {
                    "Accept-Language": "en",
                    "User-Agent": "NeoCloudKitchen/1.0 (contact@neocloudkitchen.com)",
                },
            }
        );
        if (nomRes.ok) {
            const data = await nomRes.json();
            if (Array.isArray(data)) {
                data.forEach((item: any, idx: number) => {
                    const addr = item.address || {};
                    const pin = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);
                    const mainText =
                        addr.amenity ||
                        addr.road ||
                        addr.suburb ||
                        addr.neighbourhood ||
                        item.display_name.split(",")[0].trim();
                    const secondaryText = item.display_name.split(",").slice(1, 4).join(",").trim();

                    suggestions.push({
                        placeId: `osm-${item.place_id || idx}`,
                        description: item.display_name,
                        mainText: mainText || "Pune Area",
                        secondaryText: secondaryText || "Pune, Maharashtra, India",
                        types: [item.type || "geocode"],
                        lat: parseFloat(item.lat),
                        lng: parseFloat(item.lon),
                        details: {
                            pincode: pin,
                            street: addr.road || addr.suburb || "",
                            locality: addr.suburb || addr.neighbourhood || addr.city_district || "",
                            landmark: addr.amenity || addr.shop || "",
                            houseNumber: addr.house_number || "",
                            city: addr.city || addr.town || "Pune",
                            state: addr.state || "Maharashtra",
                            formattedAddress: item.display_name,
                            lat: parseFloat(item.lat),
                            lng: parseFloat(item.lon),
                        },
                    });
                });
            }
        }
    } catch (nomErr) {
        console.warn("Nominatim fallback warning:", nomErr);
    }

    return { suggestions, provider: "openstreetmap_fallback" };
}

/**
 * Place Details: Resolves place_id to exact coordinates and structured address fields.
 */
export async function getPlaceDetails(
    placeId: string,
    sessionToken?: string
): Promise<{ details: NormalizedAddressDetails | null; provider: string }> {
    if (!placeId) {
        return { details: null, provider: "none" };
    }

    // If it was a local fallback suggestion with embedded pin details
    if (placeId.startsWith("pin-")) {
        const pin = placeId.replace("pin-", "");
        const info = PINCODE_COORDINATES[pin];
        if (info) {
            return {
                details: {
                    pincode: pin,
                    locality: info.locality,
                    street: "",
                    landmark: "",
                    houseNumber: "",
                    city: info.city,
                    state: "Maharashtra",
                    formattedAddress: `${info.locality}, ${info.city}, Maharashtra ${pin}`,
                    lat: info.lat,
                    lng: info.lng,
                },
                provider: "local_directory",
            };
        }
    }

    // If it was an OSM fallback suggestion
    if (placeId.startsWith("osm-")) {
        const osmId = placeId.replace("osm-", "");
        try {
            const nomRes = await fetch(
                `https://nominatim.openstreetmap.org/details?place_id=${encodeURIComponent(
                    osmId
                )}&format=json&addressdetails=1`,
                {
                    headers: {
                        "Accept-Language": "en",
                        "User-Agent": "NeoCloudKitchen/1.0 (contact@neocloudkitchen.com)",
                    },
                }
            );
            if (nomRes.ok) {
                const data = await nomRes.json();
                const addr = data.address || {};
                const pin = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);
                const lat = parseFloat(data.centroid?.coordinates?.[1] ?? data.lat ?? 18.5204);
                const lng = parseFloat(data.centroid?.coordinates?.[0] ?? data.lon ?? 73.8567);
                return {
                    details: {
                        pincode: pin,
                        street: addr.road || addr.suburb || "",
                        locality: addr.suburb || addr.neighbourhood || addr.city_district || "Pune Area",
                        landmark: addr.amenity || addr.shop || "",
                        houseNumber: addr.house_number || "",
                        city: addr.city || addr.town || "Pune",
                        state: addr.state || "Maharashtra",
                        formattedAddress: data.localname || data.names?.name || "Pune",
                        lat,
                        lng,
                    },
                    provider: "openstreetmap_details",
                };
            }
        } catch (osmErr) {
            console.warn("OSM Place Details fallback error:", osmErr);
        }
    }

    const apiKey = getGoogleMapsApiKey();

    if (apiKey && !placeId.startsWith("osm-")) {
        try {
            const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
            url.searchParams.set("place_id", placeId);
            url.searchParams.set("key", apiKey);
            url.searchParams.set(
                "fields",
                "address_components,formatted_address,geometry,name,types"
            );
            if (sessionToken) {
                url.searchParams.set("sessiontoken", sessionToken);
            }

            const res = await fetch(url.toString(), {
                headers: {
                    "Accept": "application/json",
                    "Referer": "https://dev.neocloudbites.com/",
                    "Origin": "https://dev.neocloudbites.com",
                },
                next: { revalidate: 3600 },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === "OK" && data.result) {
                    const r = data.result;
                    const lat = r.geometry?.location?.lat ?? 18.5204;
                    const lng = r.geometry?.location?.lng ?? 73.8567;
                    const parsed = parseGoogleAddressComponents(
                        r.address_components,
                        r.formatted_address || r.name || "",
                        lat,
                        lng
                    );
                    return { details: parsed, provider: "google_places" };
                } else if (data.status) {
                    console.warn("[Google Place Details] API status:", data.status, data.error_message || "");
                }
            }
        } catch (err) {
            console.warn("Google Place Details error, falling back to geocode:", err);
        }
    }

    return { details: null, provider: "not_found" };
}

/**
 * Reverse Geocoding: Converts lat/lng coordinates to formatted address details.
 */
export async function reverseGeocode(
    lat: number,
    lng: number
): Promise<{ details: NormalizedAddressDetails; provider: string }> {
    const apiKey = getGoogleMapsApiKey();

    if (apiKey) {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
            const res = await fetch(url, {
                headers: {
                    "Accept": "application/json",
                    "Referer": "https://dev.neocloudbites.com/",
                    "Origin": "https://dev.neocloudbites.com",
                },
                next: { revalidate: 300 },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
                    const first = data.results[0];
                    const parsed = parseGoogleAddressComponents(
                        first.address_components,
                        first.formatted_address || "",
                        lat,
                        lng
                    );
                    return { details: parsed, provider: "google_geocoding" };
                } else if (data.status) {
                    console.warn("[Google Reverse Geocoding] API status:", data.status, data.error_message || "");
                }
            }
        } catch (err) {
            console.warn("Google Reverse Geocoding error, falling back to Nominatim:", err);
        }
    }

    // Fallback: OpenStreetMap Nominatim
    let details: NormalizedAddressDetails = {
        pincode: "",
        street: "",
        locality: "",
        landmark: "",
        houseNumber: "",
        city: "Pune",
        state: "Maharashtra",
        formattedAddress: "",
        lat,
        lng,
    };

    try {
        const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            {
                headers: {
                    "Accept-Language": "en",
                    "User-Agent": "NeoCloudKitchen/1.0 (contact@neocloudkitchen.com)",
                },
            }
        );
        if (nomRes.ok) {
            const data = await nomRes.json();
            const addr = data.address || {};
            const pin = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);
            details = {
                pincode: pin,
                street: addr.road || addr.suburb || addr.neighbourhood || "",
                locality: addr.residential || addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || "Pune Area",
                landmark: addr.amenity || addr.shop || addr.commercial || addr.building || "",
                houseNumber: addr.house_number || addr.building || "",
                city: addr.city || addr.town || addr.village || "Pune",
                state: addr.state || "Maharashtra",
                formattedAddress: data.display_name || "",
                lat,
                lng,
            };
            return { details, provider: "openstreetmap_reverse" };
        }
    } catch (nomErr) {
        console.warn("Nominatim reverse geocode fallback failed:", nomErr);
    }

    return { details, provider: "fallback_coords" };
}

/**
 * Forward Geocoding: Converts an address text string to coordinates and structured fields.
 */
export async function geocodeAddress(
    address: string
): Promise<{ details: NormalizedAddressDetails | null; provider: string }> {
    const query = (address || "").trim();
    if (!query) {
        return { details: null, provider: "none" };
    }

    const apiKey = getGoogleMapsApiKey();

    if (apiKey) {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                query
            )}&components=country:in&key=${apiKey}`;
            const res = await fetch(url, {
                headers: {
                    "Accept": "application/json",
                    "Referer": "https://dev.neocloudbites.com/",
                    "Origin": "https://dev.neocloudbites.com",
                },
                next: { revalidate: 3600 },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
                    const first = data.results[0];
                    const lat = first.geometry?.location?.lat ?? 18.5204;
                    const lng = first.geometry?.location?.lng ?? 73.8567;
                    const parsed = parseGoogleAddressComponents(
                        first.address_components,
                        first.formatted_address || query,
                        lat,
                        lng
                    );
                    return { details: parsed, provider: "google_geocoding" };
                } else if (data.status) {
                    console.warn("[Google Geocoding] API status:", data.status, data.error_message || "");
                }
            }
        } catch (err) {
            console.warn("Google Geocoding error, falling back to OSM:", err);
        }
    }

    // Fallback: Nominatim
    try {
        const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                query
            )}&countrycodes=in&limit=1&addressdetails=1`,
            {
                headers: {
                    "Accept-Language": "en",
                    "User-Agent": "NeoCloudKitchen/1.0 (contact@neocloudkitchen.com)",
                },
            }
        );
        if (nomRes.ok) {
            const data = await nomRes.json();
            if (Array.isArray(data) && data.length > 0) {
                const first = data[0];
                const addr = first.address || {};
                const pin = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);
                const details: NormalizedAddressDetails = {
                    pincode: pin,
                    street: addr.road || addr.suburb || "",
                    locality: addr.suburb || addr.neighbourhood || addr.city_district || "Pune Area",
                    landmark: addr.amenity || addr.shop || "",
                    houseNumber: addr.house_number || "",
                    city: addr.city || addr.town || "Pune",
                    state: addr.state || "Maharashtra",
                    formattedAddress: first.display_name || query,
                    lat: parseFloat(first.lat),
                    lng: parseFloat(first.lon),
                };
                return { details, provider: "openstreetmap_geocode" };
            }
        }
    } catch (nomErr) {
        console.warn("Nominatim geocoding fallback failed:", nomErr);
    }

    return { details: null, provider: "not_found" };
}
