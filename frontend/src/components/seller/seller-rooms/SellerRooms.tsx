'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, User, Pencil, X, Check, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
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
    title: 'Presidential Penthouse 402',
    guestsCount: 4,
    tier: 'Premium Tier',
    pricePerNight: '₹6,500',
    isAvailable: false,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    title: 'Classic Studio Suite 204',
    guestsCount: 2,
    tier: 'Standard Tier',
    pricePerNight: '₹3,200',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    title: 'Garden View Villa 05',
    guestsCount: 6,
    tier: 'Luxury Tier',
    pricePerNight: '₹9,800',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '5',
    title: 'Corner Skyline Room 305',
    guestsCount: 3,
    tier: 'Executive Tier',
    pricePerNight: '₹4,400',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '6',
    title: 'Economy Urban Pod 12',
    guestsCount: 1,
    tier: 'Standard Tier',
    pricePerNight: '₹1,500',
    isAvailable: false,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '7',
    title: 'Superior King Suite 201',
    guestsCount: 2,
    tier: 'Executive Tier',
    pricePerNight: '₹4,100',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: '8',
    title: 'Standard Double Room 108',
    guestsCount: 2,
    tier: 'Standard Tier',
    pricePerNight: '₹2,800',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80',
  },
];

const TIER_OPTIONS = ['Standard Tier', 'Executive Tier', 'Premium Tier', 'Luxury Tier'];
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

  // Edit Modal State
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGuests, setEditGuests] = useState(2);
  const [editTier, setEditTier] = useState('Standard Tier');
  const [editPrice, setEditPrice] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);

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

  const handleOpenEditModal = (room: RoomItem) => {
    setEditingRoom(room);
    setEditTitle(room.title);
    setEditGuests(room.guestsCount);
    setEditTier(room.tier);
    setEditPrice(room.pricePerNight.replace('₹', '').trim());
    setEditImage(room.image);
    setEditAvailable(room.isAvailable);
  };

  const handleCloseEditModal = () => {
    setEditingRoom(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    const formattedPrice = editPrice.startsWith('₹') ? editPrice : `₹${editPrice}`;

    setRoomList((prev) =>
      prev.map((r) =>
        r.id === editingRoom.id
          ? {
              ...r,
              title: editTitle,
              guestsCount: Number(editGuests) || 1,
              tier: editTier,
              pricePerNight: formattedPrice,
              image: editImage || r.image,
              isAvailable: editAvailable,
            }
          : r
      )
    );

    setEditingRoom(null);
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
                {/* Room Hero Image Container with Floating Edit Action */}
                <div className={styles.imageContainer}>
                  <Image
                    src={room.image}
                    alt={room.title}
                    fill
                    className={styles.roomImage}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                  />

                  {/* Unique Dynamic Edit Action Button Floating on Image */}
                  <button
                    type="button"
                    className={styles.imageEditBadge}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(room);
                    }}
                    title={`Edit ${room.title}`}
                    aria-label={`Edit ${room.title}`}
                  >
                    <Pencil size={13} strokeWidth={2.6} className={styles.editIcon} />
                    <span className={styles.editLabel}>Edit</span>
                  </button>
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

      {/* Interactive Edit Room Modal */}
      {editingRoom && (
        <div className={styles.modalOverlay} onClick={handleCloseEditModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconCircle}>
                  <Pencil size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Edit Room Details</h3>
                  <p className={styles.modalSubtitle}>Update pricing, capacity, and cover photo.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={handleCloseEditModal}
                aria-label="Close modal"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className={styles.modalForm}>
              {/* Image Preview & URL */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ROOM COVER IMAGE URL</label>
                <div className={styles.imagePreviewRow}>
                  <div className={styles.modalImageThumbnail}>
                    <Image
                      src={editImage || editingRoom.image}
                      alt="Room Preview"
                      fill
                      className={styles.thumbnailImg}
                    />
                  </div>
                  <input
                    type="url"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Room Title */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ROOM SUITE TITLE</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Deluxe Executive Suite 101"
                  required
                  className={styles.formInput}
                />
              </div>

              {/* Tier & Capacity 2-Column Row */}
              <div className={styles.formTwoCol}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>ROOM TIER</label>
                  <select
                    value={editTier}
                    onChange={(e) => setEditTier(e.target.value)}
                    className={styles.formSelect}
                  >
                    {TIER_OPTIONS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>MAX GUESTS</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editGuests}
                    onChange={(e) => setEditGuests(Number(e.target.value))}
                    required
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Price Per Night */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>PRICE PER NIGHT (₹)</label>
                <input
                  type="text"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="2,800"
                  required
                  className={styles.formInput}
                />
              </div>

              {/* Availability Switch in Modal */}
              <div className={styles.modalToggleRow}>
                <div>
                  <span className={styles.toggleLabelTitle}>Listing Status</span>
                  <p className={styles.toggleLabelSub}>
                    {editAvailable
                      ? 'Room is visible and available for guest bookings'
                      : 'Room is offline and hidden from explore'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAvailable((prev) => !prev)}
                  className={`${styles.toggleSwitch} ${
                    editAvailable ? styles.toggleSwitchActive : ''
                  }`}
                  aria-label="Toggle availability"
                >
                  <span
                    className={`${styles.toggleThumb} ${
                      editAvailable ? styles.toggleThumbActive : ''
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCloseEditModal}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  <Check size={16} strokeWidth={2.8} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerRooms;
