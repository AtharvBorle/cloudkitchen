"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
import { usePathname } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import { useSession } from "next-auth/react";
import { LocationModal } from "@/components/location-modal/LocationModal";
import { getPincodeCoordinates, formatShortDeliveryLocation } from "@/lib/geo-distance";
import { reverseGeocodeCoords } from "@/lib/google-maps";

export interface Address {
  id: string;
  type: string;
  pincode: string;
  houseNumber?: string;
  street?: string;
  landmark?: string;
  locality?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
  [key: string]: any;
}

export interface LocationContextType {
  defaultAddress: Address | null;
  savedAddresses: Address[];
  isLoading: boolean;
  isLocationModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  refreshAddress: () => Promise<void>;
  selectAddress: (addressId: string) => Promise<void>;
  setGuestLocation: (pincode: string, locality?: string, city?: string, latitude?: number | null, longitude?: number | null) => void;
  detectGpsLocation: () => Promise<boolean>;
}

const LocationContext = createContext<LocationContextType>({
  defaultAddress: null,
  savedAddresses: [],
  isLoading: true,
  isLocationModalOpen: false,
  openLocationModal: () => {},
  closeLocationModal: () => {},
  refreshAddress: async () => {},
  selectAddress: async () => {},
  setGuestLocation: () => {},
  detectGpsLocation: async () => false,
});

export const useLocation = () => useContext(LocationContext);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const hasAttemptedGpsRef = useRef(false);

  const isNonCustomerRoute = Boolean(
    pathname &&
      (pathname.startsWith("/seller") ||
        pathname.startsWith("/seller-onboarding") ||
        pathname.startsWith("/dashboard/seller") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/superadmin") ||
        pathname.startsWith("/dashboard/superadmin") ||
        pathname.startsWith("/dashboard/support") ||
        pathname.startsWith("/support") ||
        pathname.startsWith("/dashboard/delivery") ||
        pathname.startsWith("/delivery") ||
        pathname.startsWith("/auth") ||
        pathname.startsWith("/invoice") ||
        pathname === "/login" ||
        pathname === "/signup")
  );

  const shouldDisableLocation = isNonCustomerRoute;

  const openLocationModal = () => {
    setIsLocationModalOpen(true);
  };
  const closeLocationModal = () => setIsLocationModalOpen(false);

  // GPS Auto-Detection & Reverse Geocoding via Nominatim
  const detectGpsLocation = useCallback(async (): Promise<boolean> => {
    if (shouldDisableLocation || typeof window === "undefined" || !navigator.geolocation) {
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const details = await reverseGeocodeCoords(latitude, longitude);
            const pin = details.pincode || "";
            const formattedShort = formatShortDeliveryLocation({ ...details, pincode: pin });
            const locality = (formattedShort && formattedShort !== "Select Location")
              ? formattedShort
              : (details.locality || details.street || "Current Location");
            const city = details.city || "Pune";

            if (pin && pin.length === 6) {
              const detectedAddress: Address = {
                id: "gps-location",
                type: "Current Location",
                pincode: pin,
                locality,
                city,
                latitude,
                longitude,
                isDefault: true,
              };
              setDefaultAddress(detectedAddress);
              localStorage.setItem("user-has-selected-location", "true");
              localStorage.setItem("guest-pincode", pin);
              localStorage.setItem("guest-locality", locality);
              localStorage.setItem("guest-city", city);
              localStorage.setItem("guest-lat", String(latitude));
              localStorage.setItem("guest-lng", String(longitude));

              if (status === "authenticated") {
                fetchApi("/api/user/location", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ pincode: pin, lat: latitude, lng: longitude }),
                }).catch(() => {});
              }

              resolve(true);
              return;
            }
          } catch (err) {
            console.error("GPS Reverse Geocoding failed:", err);
          }
          resolve(false);
        },
        (error) => {
          console.warn("Browser GPS permission error / denied:", error.message);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }, [status, shouldDisableLocation]);

  const setGuestLocation = (
    pincode: string,
    locality?: string,
    city?: string,
    latitude?: number | null,
    longitude?: number | null
  ) => {
    const pinDigits = (pincode || "").replace(/\D/g, "").slice(0, 6);
    const pinInfo = getPincodeCoordinates(pinDigits);
    const finalLat = (latitude != null && !isNaN(latitude)) ? latitude : (pinInfo?.lat ?? null);
    const finalLng = (longitude != null && !isNaN(longitude)) ? longitude : (pinInfo?.lng ?? null);
    const isGenericLoc = !locality || locality === "Pune" || locality === "Pune, Pune" || locality === "Current Location" || locality === "Pune Area";
    const finalLocality = !isGenericLoc ? locality : (pinInfo?.locality ? `${pinInfo.locality}` : `PIN ${pinDigits || pincode}`);
    const finalCity = city || pinInfo?.city || "Pune";

    if (typeof window !== "undefined") {
      localStorage.setItem("user-has-selected-location", "true");
      localStorage.setItem("active-selected-pincode", pincode);
      localStorage.setItem("guest-pincode", pincode);
      if (finalLocality) localStorage.setItem("guest-locality", finalLocality);
      if (finalCity) localStorage.setItem("guest-city", finalCity);
      if (finalLat !== null && !isNaN(finalLat)) localStorage.setItem("guest-lat", String(finalLat));
      else localStorage.removeItem("guest-lat");
      if (finalLng !== null && !isNaN(finalLng)) localStorage.setItem("guest-lng", String(finalLng));
      else localStorage.removeItem("guest-lng");

      window.dispatchEvent(new Event("location-changed"));
      window.dispatchEvent(new Event("storage"));
    }
    setDefaultAddress({
      id: "guest-location",
      type: "Current Location",
      pincode: pincode,
      locality: finalLocality,
      city: finalCity,
      latitude: finalLat,
      longitude: finalLng,
      isDefault: true,
    });
  };

  const selectAddress = async (addressId: string) => {
    try {
      const target = savedAddresses.find((a) => a.id === addressId);
      if (target) {
        const pinInfo = getPincodeCoordinates(target.pincode);
        const finalLat = (target.latitude != null && !isNaN(Number(target.latitude))) ? Number(target.latitude) : (pinInfo?.lat ?? null);
        const finalLng = (target.longitude != null && !isNaN(Number(target.longitude))) ? Number(target.longitude) : (pinInfo?.lng ?? null);
        const finalLocality = target.locality || target.street || pinInfo?.locality || `PIN ${target.pincode}`;
        const finalCity = target.city || pinInfo?.city || "Pune";

        if (typeof window !== "undefined") {
          localStorage.setItem("user-has-selected-location", "true");
          localStorage.setItem("active-selected-pincode", target.pincode);
          localStorage.setItem("guest-pincode", target.pincode);
          localStorage.setItem("guest-locality", finalLocality);
          localStorage.setItem("guest-city", finalCity);
          if (finalLat !== null && !isNaN(finalLat)) localStorage.setItem("guest-lat", String(finalLat));
          if (finalLng !== null && !isNaN(finalLng)) localStorage.setItem("guest-lng", String(finalLng));
          window.dispatchEvent(new Event("location-changed"));
          window.dispatchEvent(new Event("storage"));
        }
        setDefaultAddress({ ...target, isDefault: true, latitude: finalLat, longitude: finalLng });
      }
      const res = await fetchApi(`/api/user/addresses/${addressId}/default`, {
        method: "PATCH",
      });
      if (res.ok) {
        await fetchAddress();
      }
    } catch (err) {
      console.error("Error setting default address:", err);
    }
  };

  const fetchAddress = useCallback(async () => {
    // If on seller/admin panel, bypass background location and address fetch
    if (shouldDisableLocation) {
      setIsLoading(false);
      return;
    }

    if (status !== "authenticated") {
      // Guest / Non-logged in flow
      const hasExplicitlySelected = typeof window !== "undefined" && localStorage.getItem("user-has-selected-location") === "true";
      const guestPin = hasExplicitlySelected && typeof window !== "undefined"
        ? (localStorage.getItem("active-selected-pincode") || localStorage.getItem("guest-pincode"))
        : null;
      const guestLocality = hasExplicitlySelected && typeof window !== "undefined"
        ? localStorage.getItem("guest-locality")
        : null;
      const guestCity = hasExplicitlySelected && typeof window !== "undefined"
        ? localStorage.getItem("guest-city")
        : null;
      const rawLat = hasExplicitlySelected && typeof window !== "undefined"
        ? localStorage.getItem("guest-lat")
        : null;
      const rawLng = hasExplicitlySelected && typeof window !== "undefined"
        ? localStorage.getItem("guest-lng")
        : null;
      const parsedLat = rawLat ? parseFloat(rawLat) : null;
      const parsedLng = rawLng ? parseFloat(rawLng) : null;

      if (hasExplicitlySelected && guestPin) {
        const fallbackCoords = getPincodeCoordinates(guestPin);
        const resolvedLat = parsedLat && !isNaN(parsedLat) ? parsedLat : (fallbackCoords?.lat ?? null);
        const resolvedLng = parsedLng && !isNaN(parsedLng) ? parsedLng : (fallbackCoords?.lng ?? null);

        setDefaultAddress({
          id: "guest-location",
          type: "Current Location",
          pincode: guestPin,
          locality: guestLocality || fallbackCoords?.locality || "Current Location",
          city: guestCity || fallbackCoords?.city || "Pune",
          latitude: resolvedLat,
          longitude: resolvedLng,
          isDefault: true,
        });
        setIsLoading(false);
        return;
      }

      // If user has NO location set, attempt GPS auto-detection once
      setDefaultAddress(null);
      if (!hasAttemptedGpsRef.current && !shouldDisableLocation) {
        hasAttemptedGpsRef.current = true;
        detectGpsLocation();
      }
      setIsLoading(false);
      return;
    }

    // Authenticated user flow
    setIsLoading(true);
    try {
      const hasExplicitlySelected = typeof window !== "undefined" && localStorage.getItem("user-has-selected-location") === "true";
      const userSelectedPin = hasExplicitlySelected && typeof window !== "undefined"
        ? (localStorage.getItem("active-selected-pincode") || localStorage.getItem("guest-pincode"))
        : null;
      const userLocality = hasExplicitlySelected && typeof window !== "undefined" ? localStorage.getItem("guest-locality") : null;
      const userCity = hasExplicitlySelected && typeof window !== "undefined" ? localStorage.getItem("guest-city") : null;
      const rawLat = hasExplicitlySelected && typeof window !== "undefined" ? localStorage.getItem("guest-lat") : null;
      const rawLng = hasExplicitlySelected && typeof window !== "undefined" ? localStorage.getItem("guest-lng") : null;
      const parsedLat = rawLat ? parseFloat(rawLat) : null;
      const parsedLng = rawLng ? parseFloat(rawLng) : null;

      // 1. Fetch all saved addresses
      const addrRes = await fetchApi("/api/user/addresses");
      let addressList: Address[] = [];
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        const list = addrData?.data?.addresses || addrData?.addresses || addrData?.data || [];
        if (Array.isArray(list)) {
          const sortedList = [...list].sort((a: any, b: any) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
          addressList = sortedList;
          setSavedAddresses(sortedList);
        }
      }

      // Prioritize the user's actively selected location if they chose one
      if (userSelectedPin) {
        const matchedSaved = addressList.find((a) => a.pincode === userSelectedPin);
        if (matchedSaved) {
          const pinCoords = getPincodeCoordinates(userSelectedPin);
          const resolvedLat = (matchedSaved.latitude != null && !isNaN(Number(matchedSaved.latitude)))
            ? Number(matchedSaved.latitude)
            : (parsedLat && !isNaN(parsedLat) ? parsedLat : (pinCoords?.lat ?? null));
          const resolvedLng = (matchedSaved.longitude != null && !isNaN(Number(matchedSaved.longitude)))
            ? Number(matchedSaved.longitude)
            : (parsedLng && !isNaN(parsedLng) ? parsedLng : (pinCoords?.lng ?? null));
          const resolvedLocality = matchedSaved.locality || matchedSaved.street || userLocality || pinCoords?.locality || `PIN ${userSelectedPin}`;
          const resolvedCity = matchedSaved.city || userCity || pinCoords?.city || "Pune";

          setDefaultAddress({
            ...matchedSaved,
            locality: resolvedLocality,
            city: resolvedCity,
            latitude: resolvedLat,
            longitude: resolvedLng,
            isDefault: true,
          });
        } else {
          const pinCoords = getPincodeCoordinates(userSelectedPin);
          const resolvedLat = (parsedLat && !isNaN(parsedLat)) ? parsedLat : (pinCoords?.lat ?? null);
          const resolvedLng = (parsedLng && !isNaN(parsedLng)) ? parsedLng : (pinCoords?.lng ?? null);
          const resolvedLocality = userLocality || pinCoords?.locality || `PIN ${userSelectedPin}`;
          const resolvedCity = userCity || pinCoords?.city || "Pune";

          setDefaultAddress({
            id: "guest-location",
            type: "Current Location",
            pincode: userSelectedPin,
            locality: resolvedLocality,
            city: resolvedCity,
            latitude: resolvedLat,
            longitude: resolvedLng,
            isDefault: true,
          });
        }
      } else if (addressList.length > 0) {
        // Fallback to default saved address for authenticated user
        const def = addressList.find((a) => a.isDefault) || addressList[0];
        const pinCoords = getPincodeCoordinates(def.pincode);
        const resolvedLat = (def.latitude != null && !isNaN(Number(def.latitude))) ? Number(def.latitude) : (pinCoords?.lat ?? null);
        const resolvedLng = (def.longitude != null && !isNaN(Number(def.longitude))) ? Number(def.longitude) : (pinCoords?.lng ?? null);
        const resolvedLocality = def.locality || def.street || pinCoords?.locality || `PIN ${def.pincode}`;
        const resolvedCity = def.city || pinCoords?.city || "Pune";

        setDefaultAddress({
          ...def,
          locality: resolvedLocality,
          city: resolvedCity,
          latitude: resolvedLat,
          longitude: resolvedLng,
          isDefault: true,
        });
      } else {
        // If user has no saved address, attempt GPS detection once
        setDefaultAddress(null);
        if (!hasAttemptedGpsRef.current && !shouldDisableLocation) {
          hasAttemptedGpsRef.current = true;
          detectGpsLocation();
        }
      }
    } catch (err) {
      console.error("Failed to fetch address for LocationProvider", err);
    } finally {
      setIsLoading(false);
    }
  }, [status, detectGpsLocation, shouldDisableLocation]);

  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

  useEffect(() => {
    const handleLocationEvent = () => {
      fetchAddress();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("location-changed", handleLocationEvent);
      window.addEventListener("default-address-changed", handleLocationEvent);
      window.addEventListener("storage", handleLocationEvent);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("location-changed", handleLocationEvent);
        window.removeEventListener("default-address-changed", handleLocationEvent);
        window.removeEventListener("storage", handleLocationEvent);
      }
    };
  }, [fetchAddress]);

  return (
    <LocationContext.Provider
      value={{
        defaultAddress,
        savedAddresses,
        isLoading,
        isLocationModalOpen,
        openLocationModal,
        closeLocationModal,
        refreshAddress: fetchAddress,
        selectAddress,
        setGuestLocation,
        detectGpsLocation,
      }}
    >
      {children}
      <LocationModal />
    </LocationContext.Provider>
  );
}

export default LocationProvider;
