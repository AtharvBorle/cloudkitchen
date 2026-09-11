'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, User } from 'lucide-react';
import ConsoleSidebar from '../sidebar/Sidebar';
import Topbar from '../nav/Topbar';
import { fetchApi } from '@/lib/fetch-api';
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
  rooms,
  onSearch,
  onNotificationClick,
  onAddRoom,
  onToggleAvailability,
}) => {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [roomList, setRoomList] = useState<RoomItem[]>(rooms || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rooms) {
      setRoomList(rooms);
      return;
    }

    async function loadRooms() {
      try {
        setLoading(true);
        const res = await fetchApi('/api/seller/rooms');
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.rooms || data.rooms || data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const mapped: RoomItem[] = list.map((r: any) => {
              let imgUrl = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80';
              try {
                const parsed = typeof r.images === 'string' ? JSON.parse(r.images) : r.images;
                if (Array.isArray(parsed) && parsed[0]) imgUrl = parsed[0];
              } catch (e) {
                // fallback
              }
              return {
                id: r.id,
                title: r.title || 'Deluxe Room',
                guestsCount: r.capacity || 2,
                tier: r.tier || 'Standard Tier',
                pricePerNight: `₹${r.price}`,
                isAvailable: r.isAvailable ?? true,
                image: imgUrl,
              };
            });
            setRoomList(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load seller rooms:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRooms();
  }, [rooms]);

  const handleToggleRoom = async (id: string) => {
    const targetRoom = roomList.find((r) => r.id === id);
    if (!targetRoom) return;

    const nextState = !targetRoom.isAvailable;
    setRoomList((prev) =>
      prev.map((room) => (room.id === id ? { ...room, isAvailable: nextState } : room))
    );

    if (onToggleAvailability) {
      onToggleAvailability(id, nextState);
    } else {
      try {
        await fetchApi('/api/seller/rooms', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: id, isAvailable: nextState }),
        });
      } catch (err) {
        console.error('Failed to update room availability:', err);
      }
    }
  };

  const handleAddRoomClick = () => {
    if (onAddRoom) {
      onAddRoom();
    } else {
      router.push('/seller/rooms/config');
    }
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
              onClick={handleAddRoomClick}
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
