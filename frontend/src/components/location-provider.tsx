"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchApi } from "@/lib/fetch-api";

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
}

const LocationContext = createContext<LocationContextType>({
    defaultAddress: null,
    isLoading: true,
    refreshAddress: async () => { },
});

export const useLocation = () => useContext(LocationContext);

interface LocationProviderProps {
    children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
    const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAddress = async () => {
        setIsLoading(true);
        try {
            const res = await fetchApi("/api/user/location/default");
            if (res.ok) {
                const addressData = await res.json();
                if (addressData && addressData.pincode) {
                    setDefaultAddress(addressData);
                } else {
                    setDefaultAddress(null);
                }
            }
        } catch (err) {
            console.error("Failed to fetch address for header", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAddress();
    }, []);

    return (
        <LocationContext.Provider value={{ defaultAddress, isLoading, refreshAddress: fetchAddress }}>
            {children}
        </LocationContext.Provider>
    );
}
