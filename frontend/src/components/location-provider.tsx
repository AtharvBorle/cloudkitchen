"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { useSession } from "next-auth/react";
import { LocationModal } from "@/components/location-modal/LocationModal";

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
  setGuestLocation: (pincode: string, locality?: string, city?: string) => void;
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

  const openLocationModal = () => setIsLocationModalOpen(true);
  const closeLocationModal = () => setIsLocationModalOpen(false);

  const fetchAddress = useCallback(async () => {
    if (status !== "authenticated") {
      // User is a guest or session is loading
      const guestPin = typeof window !== "undefined" ? localStorage.getItem("guest-pincode") : null;
      const guestLocality = typeof window !== "undefined" ? localStorage.getItem("guest-locality") : null;
      const guestCity = typeof window !== "undefined" ? localStorage.getItem("guest-city") : null;

      if (guestPin) {
        setDefaultAddress({
          id: "guest-location",
          type: "Current Location",
          pincode: guestPin,
          locality: guestLocality || "Kothrud",
          city: guestCity || "Pune",
          isDefault: true,
        });
      } else {
        // Default initial guest fallback
        setDefaultAddress({
          id: "guest-location",
          type: "Current Location",
          pincode: "411038",
          locality: "Kothrud",
          city: "Pune",
          isDefault: true,
        });
      }
      setSavedAddresses([]);
      setIsLoading(status === "loading");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch Default / Active location
      const defRes = await fetchApi("/api/user/location/default");
      let activeAddr: Address | null = null;
      if (defRes.ok) {
        const defData = await defRes.json();
        if (defData && defData.pincode) {
          activeAddr = defData;
        }
      }

      // 2. Fetch all saved addresses for the user
      const addrRes = await fetchApi("/api/user/addresses");
      let addressList: Address[] = [];
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        const list = addrData.data?.addresses || addrData.addresses || addrData.data || [];
        if (Array.isArray(list)) {
          addressList = list;
          setSavedAddresses(list);
        }
      }

      // If active address wasn't resolved by location/default, pick the default or first saved address
      if (!activeAddr && addressList.length > 0) {
        const defaultOne = addressList.find((a) => a.isDefault) || addressList[0];
        activeAddr = defaultOne;
      }

      if (activeAddr) {
        setDefaultAddress(activeAddr);
      } else {
        const guestPin = typeof window !== "undefined" ? localStorage.getItem("guest-pincode") : null;
        setDefaultAddress({
          id: "default-pune",
          type: "Current Location",
          pincode: guestPin || "411038",
          locality: "Kothrud",
          city: "Pune",
          isDefault: true,
        });
      }
    } catch (err) {
      console.error("Failed to fetch address for LocationProvider", err);
      setDefaultAddress({
        id: "offline-fallback",
        type: "Current Location",
        pincode: "411038",
        locality: "Kothrud",
        city: "Pune",
        isDefault: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  const selectAddress = async (addressId: string) => {
    try {
      const res = await fetchApi(`/api/user/addresses/${addressId}/default`, {
        method: "PATCH",
      });
      if (res.ok) {
        await fetchAddress();
      } else {
        // Optimistically set if saved
        const target = savedAddresses.find((a) => a.id === addressId);
        if (target) {
          setDefaultAddress({ ...target, isDefault: true });
        }
      }
    } catch (err) {
      console.error("Error setting default address:", err);
    }
  };

  const setGuestLocation = (pincode: string, locality?: string, city?: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("guest-pincode", pincode);
      if (locality) localStorage.setItem("guest-locality", locality);
      if (city) localStorage.setItem("guest-city", city);
    }
    setDefaultAddress({
      id: "guest-location",
      type: "Current Location",
      pincode: pincode,
      locality: locality || "Delivery Area",
      city: city || "Pune",
      isDefault: true,
    });
  };

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
      }}
    >
      {children}
      <LocationModal />
    </LocationContext.Provider>
  );
}

export default LocationProvider;
