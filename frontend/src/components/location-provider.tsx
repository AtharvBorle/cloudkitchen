"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
import { usePathname } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import { useSession } from "next-auth/react";
import { LocationModal } from "@/components/location-modal/LocationModal";
import { getPincodeCoordinates } from "@/lib/geo-distance";

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

  const isStaffOrSeller = Boolean(
    session?.user?.role && session.user.role !== "USER"
  );

  const isNonCustomerRoute = Boolean(
    !pathname ||
      pathname.startsWith("/seller") ||
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
      pathname === "/signup"
  );

  const shouldDisableLocation = isStaffOrSeller || isNonCustomerRoute;

  const openLocationModal = () => {
    if (shouldDisableLocation) return;
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
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const pin = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);
              const locality =
                addr.suburb ||
                addr.neighbourhood ||
                addr.residential ||
                addr.city_district ||
                addr.road ||
                addr.town ||
                addr.city ||
                "Current Location";
              const city = addr.city || addr.town || addr.state_district || addr.state || "Pune";

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
                localStorage.setItem("guest-pincode", pin);
                localStorage.setItem("guest-locality", locality);
                localStorage.setItem("guest-city", city);
                localStorage.setItem("guest-lat", String(latitude));
                localStorage.setItem("guest-lng", String(longitude));

                if (status === "authenticated" && !isStaffOrSeller) {
                  fetchApi("/api/user/location", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pincode: pin, lat: latitude, lng: longitude }),
                  }).catch(() => {});
                }

                resolve(true);
                return;
              }
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
  }, [status, shouldDisableLocation, isStaffOrSeller]);

  const setGuestLocation = (
    pincode: string,
    locality?: string,
    city?: string,
    latitude?: number | null,
    longitude?: number | null
  ) => {
    const pinInfo = getPincodeCoordinates(pincode);
    const finalLat = (latitude != null && !isNaN(latitude)) ? latitude : (pinInfo?.lat ?? null);
    const finalLng = (longitude != null && !isNaN(longitude)) ? longitude : (pinInfo?.lng ?? null);
    const finalLocality = locality || pinInfo?.locality || `PIN ${pincode}`;
    const finalCity = city || pinInfo?.city || "Pune";

    if (typeof window !== "undefined") {
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
    // If on seller/admin panel or logged in as seller/admin, bypass location modal and address fetch
    if (shouldDisableLocation) {
      setIsLoading(false);
      setIsLocationModalOpen(false);
      return;
    }

    if (status !== "authenticated") {
      // Guest / Non-logged in flow
      const guestPin = typeof window !== "undefined" ? (localStorage.getItem("active-selected-pincode") || localStorage.getItem("guest-pincode")) : null;
      const guestLocality = typeof window !== "undefined" ? localStorage.getItem("guest-locality") : null;
      const guestCity = typeof window !== "undefined" ? localStorage.getItem("guest-city") : null;
      const rawLat = typeof window !== "undefined" ? localStorage.getItem("guest-lat") : null;
      const rawLng = typeof window !== "undefined" ? localStorage.getItem("guest-lng") : null;
      const parsedLat = rawLat ? parseFloat(rawLat) : null;
      const parsedLng = rawLng ? parseFloat(rawLng) : null;

      if (guestPin) {
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

      // If user has NO location set, request GPS permission directly
      setIsLoading(true);
      if (!hasAttemptedGpsRef.current) {
        hasAttemptedGpsRef.current = true;
        const success = await detectGpsLocation();
        if (!success && !shouldDisableLocation) {
          // If GPS was denied/unavailable and this is first arrival on user customer pages
          const modalPrompted = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("location-modal-shown") : null;
          if (!modalPrompted) {
            sessionStorage.setItem("location-modal-shown", "true");
            setIsLocationModalOpen(true);
          }
        }
      }
      setIsLoading(false);
      return;
    }

    // Authenticated user flow
    setIsLoading(true);
    try {
      const userSelectedPin = typeof window !== "undefined"
        ? (localStorage.getItem("active-selected-pincode") || localStorage.getItem("guest-pincode"))
        : null;
      const userLocality = typeof window !== "undefined" ? localStorage.getItem("guest-locality") : null;
      const userCity = typeof window !== "undefined" ? localStorage.getItem("guest-city") : null;
      const rawLat = typeof window !== "undefined" ? localStorage.getItem("guest-lat") : null;
      const rawLng = typeof window !== "undefined" ? localStorage.getItem("guest-lng") : null;
      const parsedLat = rawLat ? parseFloat(rawLat) : null;
      const parsedLng = rawLng ? parseFloat(rawLng) : null;

      // 1. Fetch Default Address / active location
      const defRes = await fetchApi("/api/user/location/default");
      let activeAddr: Address | null = null;
      if (defRes.ok) {
        const defData = await defRes.json();
        const payload = defData?.data || defData;
        if (payload && payload.pincode) {
          activeAddr = payload;
        }
      }

      // 2. Fetch all saved addresses
      const addrRes = await fetchApi("/api/user/addresses");
      let addressList: Address[] = [];
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        const list = addrData?.data?.addresses || addrData?.addresses || addrData?.data || [];
        if (Array.isArray(list)) {
          addressList = list;
          setSavedAddresses(list);
        }
      }

      // If user has explicitly selected a pincode, prioritize it
      if (userSelectedPin) {
        const matchedSaved = addressList.find((a) => a.pincode === userSelectedPin);
        if (matchedSaved) {
          const pinCoords = getPincodeCoordinates(userSelectedPin);
          const resolvedLat = matchedSaved.latitude ?? (parsedLat && !isNaN(parsedLat) ? parsedLat : (pinCoords?.lat ?? null));
          const resolvedLng = matchedSaved.longitude ?? (parsedLng && !isNaN(parsedLng) ? parsedLng : (pinCoords?.lng ?? null));
          setDefaultAddress({
            ...matchedSaved,
            latitude: resolvedLat,
            longitude: resolvedLng,
            isDefault: true,
          });
        } else {
          const pinCoords = getPincodeCoordinates(userSelectedPin);
          const resolvedLat = parsedLat && !isNaN(parsedLat) ? parsedLat : (pinCoords?.lat ?? null);
          const resolvedLng = parsedLng && !isNaN(parsedLng) ? parsedLng : (pinCoords?.lng ?? null);
          setDefaultAddress({
            id: "guest-location",
            type: "Current Location",
            pincode: userSelectedPin,
            locality: userLocality || pinCoords?.locality || `PIN ${userSelectedPin}`,
            city: userCity || pinCoords?.city || "Pune",
            latitude: resolvedLat,
            longitude: resolvedLng,
            isDefault: true,
          });
        }
      } else {
        if (!activeAddr && addressList.length > 0) {
          activeAddr = addressList.find((a) => a.isDefault) || addressList[0];
        }

        if (activeAddr) {
          if (activeAddr.latitude === null || activeAddr.latitude === undefined || activeAddr.longitude === null || activeAddr.longitude === undefined) {
            const matchedSaved = addressList.find((a) => (a.id === activeAddr?.id || a.pincode === activeAddr?.pincode) && a.latitude && a.longitude);
            if (matchedSaved) {
              activeAddr.latitude = matchedSaved.latitude;
              activeAddr.longitude = matchedSaved.longitude;
            } else {
              const pinCoords = getPincodeCoordinates(activeAddr.pincode);
              if (pinCoords) {
                activeAddr.latitude = pinCoords.lat;
                activeAddr.longitude = pinCoords.lng;
              }
            }
          }
          if (typeof window !== "undefined") {
            localStorage.setItem("active-selected-pincode", activeAddr.pincode);
            localStorage.setItem("guest-pincode", activeAddr.pincode);
            if (activeAddr.locality) localStorage.setItem("guest-locality", activeAddr.locality);
            if (activeAddr.city) localStorage.setItem("guest-city", activeAddr.city);
            if (activeAddr.latitude != null) localStorage.setItem("guest-lat", String(activeAddr.latitude));
            if (activeAddr.longitude != null) localStorage.setItem("guest-lng", String(activeAddr.longitude));
          }
          setDefaultAddress(activeAddr);
        } else if (!hasAttemptedGpsRef.current) {
          hasAttemptedGpsRef.current = true;
          const success = await detectGpsLocation();
          if (!success && !shouldDisableLocation) {
            setIsLocationModalOpen(true);
          }
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
      {!shouldDisableLocation && <LocationModal />}
    </LocationContext.Provider>
  );
}

export default LocationProvider;
