"use client";

import { useState } from "react";
import { Power, PowerOff } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

export function StoreStatusToggle({ initialStatus }: { initialStatus: boolean }) {
    const [isOnline, setIsOnline] = useState(initialStatus);
    const [loading, setLoading] = useState(false);

    const toggleStatus = async () => {
        setLoading(true);
        try {
            const res = await fetchApi("/api/seller/profile/status", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOnline: !isOnline })
            });
            if (res.ok) {
                const data = await res.json();
                setIsOnline(data.isOnline);
            } else {
                alert("Failed to update store status, please try again.");
            }
        } catch (error) {
            console.error("Error toggling store status:", error);
            alert("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: isOnline ? 'var(--teal)' : 'var(--text-muted)' }}>
                {isOnline ? 'Online (Accepting Orders)' : 'Offline (Paused)'}
            </span>
            <button
                onClick={toggleStatus}
                disabled={loading}
                style={{
                    backgroundColor: isOnline ? '#E8F8F5' : '#FEE2E2',
                    color: isOnline ? 'var(--teal)' : '#B91C1C',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    fontSize: '0.9rem',
                    flexShrink: 0
                }}
            >
                {isOnline ? <Power size={18} /> : <PowerOff size={18} />}
                {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
        </div>
    );
}
