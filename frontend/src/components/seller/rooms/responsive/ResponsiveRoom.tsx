"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu as MenuIcon, Plus, User, ChevronRight, Bell } from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import styles from "./ResponsiveRoom.module.css";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export interface ResponsiveRoomItem {
  id: string;
  name: string;
  sleepsCount: number;
  pricePerNight: string;
  isAvailable: boolean;
  imageUrl: string;
}

export interface ResponsiveRoomProps {
  ownerName?: string;
  rooms?: ResponsiveRoomItem[];
  onAddRoom?: () => void;
  onToggleAvailability?: (roomId: string, isAvailable: boolean) => void;
  onSelectRoom?: (room: ResponsiveRoomItem) => void;
  onSyncDevices?: () => void;
}

export const ResponsiveRoom: React.FC<ResponsiveRoomProps> = ({
  ownerName,
  rooms = [],
  onAddRoom,
  onToggleAvailability,
  onSelectRoom,
  onSyncDevices,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const effectiveOwnerName = ownerName && ownerName !== "Rahul Sharma" && ownerName !== "John Doe" ? ownerName : seller.ownerName;
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [roomList, setRoomList] = useState<ResponsiveRoomItem[]>(rooms);

  useEffect(() => {
    if (rooms) {
      setRoomList(rooms);
    }
  }, [rooms]);

  const handleToggle = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRoomList((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const nextState = !r.isAvailable;
          if (onToggleAvailability) onToggleAvailability(roomId, nextState);
          return { ...r, isAvailable: nextState };
        }
        return r;
      })
    );
  };

  const handleAddRoomClick = () => {
    if (onAddRoom) {
      onAddRoom();
    } else {
      router.push("/seller/rooms/add");
    }
  };

  const handleCardClick = (room: ResponsiveRoomItem) => {
    if (onSelectRoom) {
      onSelectRoom(room);
    } else {
      router.push("/seller/rooms/config");
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="rooms"
        ownerName={effectiveOwnerName}
        onSyncDevices={onSyncDevices}
      />

      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar with Hamburger and Plus Icon */}
        <header className={styles.topBar}>
          <div className={styles.headerLeftGroup}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsNavMenuOpen(true);
              }}
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <MenuIcon size={24} />
            </button>
            <Link href="/seller/dashboard" className={styles.headerLogoLink} title="Neo Cloud Bites">
              <div className={styles.headerLogoWrapper}>
                <Image
                  src="/images/logo-nav.png"
                  alt="Neo Cloud Bites"
                  width={30}
                  height={30}
                  className={styles.headerLogoImg}
                  priority
                />
              </div>
            </Link>
          </div>

          <h1 className={styles.pageTitle}>Rooms</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => router.push("/seller/notifications")}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={22} />
              <span className={styles.notificationDot} />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleAddRoomClick}
              aria-label="Add Room"
              title="Add Room"
            >
              <Plus size={24} />
            </button>
          </div>
        </header>

        {/* Rooms List Content Area */}
        <main className={styles.contentArea}>
          {roomList.length > 0 ? (
            roomList.map((room) => (
              <article
                key={room.id}
                className={styles.roomCard}
                onClick={() => handleCardClick(room)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleCardClick(room);
                  }
                }}
              >
                {/* Room Photo Banner */}
                <div className={styles.imageWrapper}>
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    className={styles.roomImage}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                {/* Card Body Details */}
                <div className={styles.cardBody}>
                  <div className={styles.cardLeft}>
                    <h2 className={styles.roomName}>{room.name}</h2>
                    <div className={styles.metaRow}>
                      <span className={styles.sleepsInfo}>
                        <User size={14} className={styles.sleepsIcon} />
                        Sleeps {room.sleepsCount}
                      </span>
                      <span className={styles.priceTag}>
                        {room.pricePerNight}
                      </span>
                    </div>
                  </div>

                  {/* Right: Availability Toggle Switch & Chevron */}
                  <div className={styles.cardRight}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={room.isAvailable}
                      className={`${styles.toggleSwitch} ${
                        room.isAvailable ? styles.toggleSwitchActive : ""
                      }`}
                      onClick={(e) => handleToggle(room.id, e)}
                      aria-label={`Toggle availability for ${room.name}`}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                    <ChevronRight size={18} className={styles.chevronIcon} />
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No rooms configured yet.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResponsiveRoom;

