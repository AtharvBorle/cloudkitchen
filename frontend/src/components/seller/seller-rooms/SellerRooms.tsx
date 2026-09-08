'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, User } from 'lucide-react';
import ConsoleSidebar from '../sidebar/Sidebar';
import Topbar from '../nav/Topbar';
import styles from './SellerRooms.module.css';

export interface RoomItem {
  id: string;
  title: string;
  guestsCount: number;
  tier: string;
  pricePerNight: string;
  isAvailable: boolean;
  image: string;
}

const DEFAULT_ROOMS: RoomItem[] = [
  {
    id: '1',
    title: 'Deluxe Executive Suite 101',
    guestsCount: 2,
    tier: 'Standard Tier',
    pricePerNight: '₹2,800',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    title: 'Luxury Penthouse Suite 401',
    guestsCount: 3,
    tier: 'Standard Tier',
    pricePerNight: '₹5,200',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    title: 'Deluxe Executive Suite 101',
    guestsCount: 2,
    tier: 'Standard Tier',
    pricePerNight: '₹2,800',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    title: 'Deluxe Executive Suite 101',
    guestsCount: 2,
    tier: 'Standard Tier',
    pricePerNight: '₹2,800',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '5',
    title: 'Luxury Penthouse Suite 401',
    guestsCount: 3,
    tier: 'Standard Tier',
    pricePerNight: '₹5,200',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '6',
    title: 'Deluxe Executive Suite 101',
    guestsCount: 2,
    tier: 'Standard Tier',
    pricePerNight: '₹2,800',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80',
  },
];

export interface SellerRoomsProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  rooms?: RoomItem[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onAddRoom?: () => void;
  onToggleAvailability?: (roomId: string, isAvailable: boolean) => void;
}

export const SellerRooms: React.FC<SellerRoomsProps> = ({
  ownerName = 'John Doe',
  partnerRole = 'Neo Cloud Partner',
  avatarInitials = 'JD',
  rooms = DEFAULT_ROOMS,
  onSearch,
  onNotificationClick,
  onAddRoom,
  onToggleAvailability,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [roomList, setRoomList] = useState<RoomItem[]>(rooms);

  const handleToggleRoom = (id: string) => {
    setRoomList((prev) =>
      prev.map((room) => {
        if (room.id === id) {
          const nextState = !room.isAvailable;
          if (onToggleAvailability) onToggleAvailability(id, nextState);
          return { ...room, isAvailable: nextState };
        }
        return room;
      })
    );
  };

  return (
    <div className={styles.roomsContainer}>
      {/* 1. Left Sidebar with active Rooms tab */}
      <ConsoleSidebar
        activeItemId="rooms"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* 2. Right Content Section */}
      <div className={styles.rightSection}>
        {/* Top Navbar */}
        <Topbar
          title="Owner Operations Console"
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Main Content Canvas */}
        <main className={styles.mainContent}>
          {/* Header Row: Title & Subtitle + Add Room Button */}
          <div className={styles.headerRow}>
            <div className={styles.headerGroup}>
              <h1 className={styles.title}>Rooms Directory</h1>
              <p className={styles.subtitle}>
                View, edit, and control live availability status of all Neo Cloud Rooms.
              </p>
            </div>
            <button
              type="button"
              className={styles.addRoomBtn}
              onClick={onAddRoom}
            >
              <Plus size={18} strokeWidth={2.8} />
              <span>Add Room</span>
            </button>
          </div>

          {/* Rooms Grid Cards */}
          <div className={styles.roomsGrid}>
            {roomList.map((room) => (
              <div key={room.id} className={styles.roomCard}>
                {/* Room Hero Image */}
                <div className={styles.imageContainer}>
                  <Image
                    src={room.image}
                    alt={room.title}
                    fill
                    className={styles.roomImage}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                  />
                </div>

                {/* Card Content */}
                <div className={styles.cardBody}>
                  <h3 className={styles.roomTitle}>{room.title}</h3>

                  <div className={styles.metaRow}>
                    <div className={styles.guestInfo}>
                      <User size={15} strokeWidth={2.2} className={styles.userIcon} />
                      <span>{room.guestsCount} Guests</span>
                    </div>
                    <span className={styles.bulletDot}>•</span>
                    <span className={styles.tierTag}>{room.tier}</span>
                  </div>

                  <div className={styles.cardDivider} />

                  <div className={styles.pricingRow}>
                    <div className={styles.priceGroup}>
                      <span className={styles.priceLabel}>PRICE / NIGHT</span>
                      <span className={styles.priceValue}>{room.pricePerNight}</span>
                    </div>

                    <div className={styles.statusGroup}>
                      <span
                        className={
                          room.isAvailable ? styles.statusAvailable : styles.statusUnavailable
                        }
                      >
                        {room.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleRoom(room.id)}
                        className={`${styles.toggleSwitch} ${
                          room.isAvailable ? styles.toggleSwitchActive : ''
                        }`}
                        aria-label={`Toggle availability for ${room.title}`}
                      >
                        <span
                          className={`${styles.toggleThumb} ${
                            room.isAvailable ? styles.toggleThumbActive : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerRooms;
