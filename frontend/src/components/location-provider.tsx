"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { useSession } from "next-auth/react";

interface Address {
    id: string;
    type: string;
    pincode: string;
    [key: string]: any;
}

interface LocationContextType {
    defaultAddress: Address | null;
    isLoading: boolean;
    refreshAddress: () => Promise<void>;
    setGuestLocation: (pincode: string) => void;
}

const LocationContext = createContext<LocationContextType>({
    defaultAddress: null,
    isLoading: true,
    refreshAddress: async () => { },
    setGuestLocation: () => { },
});

export const useLocation = () => useContext(LocationContext);

interface LocationProviderProps {
    children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
    const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { status } = useSession();

    const fetchAddress = async () => {
        if (status !== "authenticated") {
            // User is a guest or session is loading
            const guestPin = localStorage.getItem("guest-pincode");
            if (guestPin) {
                setDefaultAddress({
                    id: "guest-location",
                    type: "Current Location",
                    pincode: guestPin
                });
            } else {
                setDefaultAddress(null);
            }
            setIsLoading(status === "loading");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetchApi("/api/user/location/default");
            if (res.status === 401) {
                // User is a guest
                const guestPin = localStorage.getItem("guest-pincode");
                if (guestPin) {
                    setDefaultAddress({
                        id: "guest-location",
                        type: "Current Location",
                        pincode: guestPin
                    });
                } else {
                    setDefaultAddress(null);
                }
            } else if (res.ok) {
                const addressData = await res.json();
                if (addressData && addressData.pincode) {
                    setDefaultAddress(addressData);
                } else {
                    setDefaultAddress(null);
                }
            } else {
                setDefaultAddress(null);
            }
        } catch (err) {
            console.error("Failed to fetch address for header", err);
            // Offline/error fallback to localStorage
            const guestPin = localStorage.getItem("guest-pincode");
            if (guestPin) {
                setDefaultAddress({
                    id: "guest-location",
                    type: "Current Location",
                    pincode: guestPin
                });
            } else {
                setDefaultAddress(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const setGuestLocation = (pincode: string) => {
        localStorage.setItem("guest-pincode", pincode);
        setDefaultAddress({
            id: "guest-location",
            type: "Current Location",
            pincode: pincode
        });
    };

    useEffect(() => {
        fetchAddress();
    }, [status]);

    return (
        <LocationContext.Provider value={{ defaultAddress, isLoading, refreshAddress: fetchAddress, setGuestLocation }}>
            {children}
        </LocationContext.Provider>
    );
}
