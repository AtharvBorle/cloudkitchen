"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/fetch-api";

interface RoomModuleContextType {
  isRoomEnabled: boolean;
  isLoading: boolean;
  setRoomEnabled: (enabled: boolean) => Promise<boolean>;
  refreshRoomSetting: () => Promise<void>;
  isChatbotEnabled: boolean;
  setChatbotEnabled: (enabled: boolean) => Promise<boolean>;
}

const RoomModuleContext = createContext<RoomModuleContextType>({
  isRoomEnabled: false,
  isLoading: false,
  setRoomEnabled: async () => false,
  refreshRoomSetting: async () => {},
  isChatbotEnabled: true,
  setChatbotEnabled: async () => false,
});

const SETTING_KEY_ROOM = "ENABLE_ROOM_MODULE";
const SETTING_KEY_CHATBOT = "ENABLE_CHATBOT";
const CHANNEL_NAME = "app_system_settings_channel";

export const RoomModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously initialize from localStorage to prevent UI flashing or layout shift
  const [isRoomEnabled, setIsRoomEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(SETTING_KEY_ROOM);
        if (stored !== null) {
          return stored === "true";
        }
      } catch {}
    }
    return false; // Default to false (Next Version launch mode)
  });

  const [isChatbotEnabled, setIsChatbotEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(SETTING_KEY_CHATBOT);
        if (stored !== null) {
          return stored !== "false";
        }
      } catch {}
    }
    return true; // Default to true
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch latest values from backend
  const refreshRoomSetting = useCallback(async () => {
    try {
      const res = await fetchApi("/api/public/settings");
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        const roomEnabled = Boolean(
          data?.isRoomEnabled ?? (data?.ENABLE_ROOM_MODULE === "true")
        );
        const botEnabled = Boolean(
          data?.isChatbotEnabled ?? (data?.ENABLE_CHATBOT !== "false")
        );
        setIsRoomEnabledState(roomEnabled);
        setIsChatbotEnabledState(botEnabled);
        if (typeof window !== "undefined") {
          localStorage.setItem(SETTING_KEY_ROOM, roomEnabled ? "true" : "false");
          localStorage.setItem(SETTING_KEY_CHATBOT, botEnabled ? "true" : "false");
        }
      }
    } catch (err) {
      // Gracefully fall back to current state
    }
  }, []);

  // Update Room Module setting (used by Superadmin toggle)
  const setRoomEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    setIsRoomEnabledState(enabled);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SETTING_KEY_ROOM, enabled ? "true" : "false");
        window.dispatchEvent(
          new CustomEvent("room-module-toggled", { detail: { enabled } })
        );
      } catch {}

      if ("BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel(CHANNEL_NAME);
          bc.postMessage({ type: "ROOM_MODULE_TOGGLED", enabled });
          bc.close();
        } catch {}
      }
    }

    setIsLoading(true);
    try {
      const res = await fetchApi("/api/superadmin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: SETTING_KEY_ROOM,
          value: enabled ? "true" : "false",
        }),
      });

      if (!res.ok) {
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

  // Update Chatbot setting (used by Superadmin toggle)
  const setChatbotEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    setIsChatbotEnabledState(enabled);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SETTING_KEY_CHATBOT, enabled ? "true" : "false");
        window.dispatchEvent(
          new CustomEvent("chatbot-toggled", { detail: { enabled } })
        );
      } catch {}

      if ("BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel(CHANNEL_NAME);
          bc.postMessage({ type: "CHATBOT_TOGGLED", enabled });
          bc.close();
        } catch {}
      }
    }

    setIsLoading(true);
    try {
      const res = await fetchApi("/api/superadmin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: SETTING_KEY_CHATBOT,
          value: enabled ? "true" : "false",
        }),
      });

      if (!res.ok) {
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
            localStorage.setItem(SETTING_KEY_ROOM, event.data.enabled ? "true" : "false");
          }
          if (event.data?.type === "CHATBOT_TOGGLED" && typeof event.data?.enabled === "boolean") {
            setIsChatbotEnabledState(event.data.enabled);
            localStorage.setItem(SETTING_KEY_CHATBOT, event.data.enabled ? "true" : "false");
          }
        };
      } catch {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SETTING_KEY_ROOM && e.newValue !== null) {
        setIsRoomEnabledState(e.newValue === "true");
      }
      if (e.key === SETTING_KEY_CHATBOT && e.newValue !== null) {
        setIsChatbotEnabledState(e.newValue !== "false");
      }
    };

    const handleCustomRoom = (e: any) => {
      if (typeof e.detail?.enabled === "boolean") {
        setIsRoomEnabledState(e.detail.enabled);
      }
    };

    const handleCustomChatbot = (e: any) => {
      if (typeof e.detail?.enabled === "boolean") {
        setIsChatbotEnabledState(e.detail.enabled);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("room-module-toggled", handleCustomRoom);
    window.addEventListener("chatbot-toggled", handleCustomChatbot);

    return () => {
      if (bc) {
        try { bc.close(); } catch {}
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("room-module-toggled", handleCustomRoom);
      window.removeEventListener("chatbot-toggled", handleCustomChatbot);
    };
  }, [refreshRoomSetting]);

  return (
    <RoomModuleContext.Provider
      value={{
        isRoomEnabled,
        isLoading,
        setRoomEnabled,
        refreshRoomSetting,
        isChatbotEnabled,
        setChatbotEnabled,
      }}
    >
      {children}
    </RoomModuleContext.Provider>
  );
};

export const useRoomModule = () => useContext(RoomModuleContext);
export default useRoomModule;
