"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

type PopupBannerType = {
    id: string;
    title: string;
    imageUrl: string;
    redirectUrl: string | null;
};

export default function PopupBannerDisplay({ sellerId }: { sellerId?: string }) {
    const [banners, setBanners] = useState<PopupBannerType[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                let url = "/api/public/popup-banners";
                if (sellerId) url += `?sellerId=${sellerId}`;

                const res = await fetchApi(url);
                const data = await res.json();

                if (res.ok && data.banners && data.banners.length > 0) {
                    // Check session storage to see if user already closed these banners this session
                    const closedBannersStr = sessionStorage.getItem("closed_banners");
                    const closedBanners = closedBannersStr ? JSON.parse(closedBannersStr) : [];

                    // Filter out banners the user already dismissed
                    const unviewedBanners = data.banners.filter((b: PopupBannerType) => !closedBanners.includes(b.id));

                    if (unviewedBanners.length > 0) {
                        setBanners(unviewedBanners);

                        // Add a small delay so it doesn't jarringly pop up instantly on page load
                        setTimeout(() => {
                            setIsOpen(true);
                        }, 1000);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch public banners:", error);
            }
        };

        fetchBanners();
    }, [sellerId]);

    const handleClose = () => {
        const currentBanner = banners[currentIndex];

        // Save to session storage so it doesn't show again this session
        const closedBannersStr = sessionStorage.getItem("closed_banners");
        const closedBanners = closedBannersStr ? JSON.parse(closedBannersStr) : [];
        sessionStorage.setItem("closed_banners", JSON.stringify([...closedBanners, currentBanner.id]));

        // If there are more banners to show, move to the next one
        if (currentIndex < banners.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsOpen(false);
        }
    };

    if (!isOpen || banners.length === 0) return null;

    const currentBanner = banners[currentIndex];

    const BannerContent = () => (
        <div style={{ position: "relative" }}>
            <button
                onClick={(e) => { e.preventDefault(); handleClose(); }}
                style={{
                    position: "absolute",
                    top: "-15px",
                    right: "-15px",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    color: "#334155",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    zIndex: 10
                }}
            >
                <X size={16} />
            </button>
            <img
                src={currentBanner.imageUrl}
                alt={currentBanner.title}
                style={{
                    width: "100%",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    borderRadius: "12px"
                }}
            />
        </div>
    );

    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
            animation: "fadeIn 0.3s ease-out",
            backdropFilter: "blur(4px)"
        }}>
            <div style={{
                position: "relative",
                maxWidth: "600px",
                width: "100%",
                backgroundColor: "transparent",
                borderRadius: "12px",
                animation: "popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }}>
                {currentBanner.redirectUrl ? (
                    <a href={currentBanner.redirectUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                        <BannerContent />
                    </a>
                ) : (
                    <BannerContent />
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
