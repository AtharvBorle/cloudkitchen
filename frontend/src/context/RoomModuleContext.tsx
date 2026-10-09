"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/fetch-api";

interface RoomModuleContextType {
  isRoomEnabled: boolean;
  isLoading: boolean;
  setRoomEnabled: (enabled: boolean) => Promise<boolean>;
  refreshRoomSetting: () => Promise<void>;
}

const RoomModuleContext = createContext<RoomModuleContextType>({
  isRoomEnabled: false,
  isLoading: false,
  setRoomEnabled: async () => false,
  refreshRoomSetting: async () => {},
});

const SETTING_KEY = "ENABLE_ROOM_MODULE";
const CHANNEL_NAME = "app_system_settings_channel";

export const RoomModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously initialize from localStorage to prevent UI flashing or layout shift
  const [isRoomEnabled, setIsRoomEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(SETTING_KEY);
        if (stored !== null) {
          return stored === "true";
        }
      } catch {}
    }
    return false; // Default to false (Next Version launch mode)
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch latest value from backend
  const refreshRoomSetting = useCallback(async () => {
    try {
      const res = await fetchApi("/api/public/settings");
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        const enabled = Boolean(
          data?.isRoomEnabled ?? (data?.ENABLE_ROOM_MODULE === "true")
        );
        setIsRoomEnabledState(enabled);
        if (typeof window !== "undefined") {
          localStorage.setItem(SETTING_KEY, enabled ? "true" : "false");
        }
      }
    } catch (err) {
      // Gracefully fall back to current state
    }
  }, []);

  // Update setting (used by Superadmin toggle)
  const setRoomEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    // 1. Optimistic update
    setIsRoomEnabledState(enabled);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SETTING_KEY, enabled ? "true" : "false");
        window.dispatchEvent(
          new CustomEvent("room-module-toggled", { detail: { enabled } })
        );
      } catch {}

      // 2. Broadcast to other open tabs/windows
      if ("BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel(CHANNEL_NAME);
          bc.postMessage({ type: "ROOM_MODULE_TOGGLED", enabled });
          bc.close();
        } catch {}
      }
    }

    // 3. Persist to backend database
    setIsLoading(true);
    try {
      const res = await fetchApi("/api/superadmin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: SETTING_KEY,
          value: enabled ? "true" : "false",
        }),
      });

      if (!res.ok) {
        // Rollback on failure
        refreshRoomSetting();
        return false;
      }
      return true;
    } catch (err) {
      refreshRoomSetting();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshRoomSetting]);

  // Listen to cross-tab updates and sync on mount
  useEffect(() => {
    refreshRoomSetting();

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event.data?.type === "ROOM_MODULE_TOGGLED" && typeof event.data?.enabled === "boolean") {
            setIsRoomEnabledState(event.data.enabled);
            localStorage.setItem(SETTING_KEY, event.data.enabled ? "true" : "false");
          }
        };
      } catch {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SETTING_KEY && e.newValue !== null) {
        setIsRoomEnabledState(e.newValue === "true");
      }
    };

    const handleCustom = (e: any) => {
      if (typeof e.detail?.enabled === "boolean") {
        setIsRoomEnabledState(e.detail.enabled);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("room-module-toggled", handleCustom);

    return () => {
      if (bc) {
        try { bc.close(); } catch {}
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("room-module-toggled", handleCustom);
    };
  }, [refreshRoomSetting]);

  return (
    <RoomModuleContext.Provider
      value={{
        isRoomEnabled,
        isLoading,
        setRoomEnabled,
        refreshRoomSetting,
      }}
    >
      {children}
    </RoomModuleContext.Provider>
  );
};

export const useRoomModule = () => useContext(RoomModuleContext);
export default useRoomModule;
