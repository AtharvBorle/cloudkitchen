'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, User, Pencil, X, Check, Upload, Sparkles, Image as ImageIcon, Lock, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ConsoleSidebar from '../sidebar/Sidebar';
import Topbar from '../nav/Topbar';
import { fetchApi } from '@/lib/fetch-api';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import styles from './SellerRooms.module.css';

export interface RoomItem {
  id: string;
  title: string;
  guestsCount: number;
  tier: string;
  pricePerNight: string;
  floor?: string;
  isAvailable: boolean;
  image: string;
}

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
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  rooms,
  onSearch,
  onNotificationClick,
  onAddRoom,
  onToggleAvailability,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomList, setRoomList] = useState<RoomItem[]>(rooms || []);
  const [loading, setLoading] = useState(false);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  // Edit Modal State
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGuests, setEditGuests] = useState(2);
  const [editTier, setEditTier] = useState('Standard Tier');
  const [editPrice, setEditPrice] = useState('');
  const [editFloor, setEditFloor] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const [statusChecked, setStatusChecked] = useState(false);
  const [isPropertyActive, setIsPropertyActive] = useState<boolean | null>(null);
  const [propertyVerification, setPropertyVerification] = useState<string>("NONE");

  useEffect(() => {
    async function checkCategoryAccess() {
      try {
        const res = await fetchApi("/api/seller/dashboard/status");
        if (res.ok) {
          const data = await res.json();
          const status = data.data || data;
          const active = Boolean(status.isPropertyActive);
          const verif = status.sellerProfile?.propertyVerificationStatus || "NONE";
          setIsPropertyActive(active);
          setPropertyVerification(verif);
          setStatusChecked(true);

          if (!active) {
            // Trigger upgrade popup immediately
            window.dispatchEvent(
              new CustomEvent(verif === "APPROVED" ? "open-subscription-modal" : "open-category-upgrade", {
                detail: { category: "PROPERTY" },
              })
            );
          }
        } else {
          setStatusChecked(true);
        }
      } catch (e) {
        setStatusChecked(true);
      }
    }
    checkCategoryAccess();
  }, []);

  useEffect(() => {
    if (isPropertyActive === false) return; // Do not load rooms if property category is not active

    if (rooms && rooms.length > 0) {
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
          if (Array.isArray(list)) {
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
                floor: r.floor || r.floorNo || '',
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
  }, [rooms, isPropertyActive]);

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
    setEditFloor(room.floor || '');
    setEditImage(room.image);
    setEditAvailable(room.isAvailable);
  };

  const handleCloseEditModal = () => {
    setEditingRoom(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || savingEdit) return;

    setSavingEdit(true);
    const formattedPrice = editPrice.startsWith('₹') ? editPrice : `₹${editPrice}`;
    const rawPrice = editPrice.replace(/[^\d.]/g, '') || '2800';

    setRoomList((prev) =>
      prev.map((r) =>
        r.id === editingRoom.id
          ? {
              ...r,
              title: editTitle,
              guestsCount: Number(editGuests) || 1,
              tier: editTier,
              pricePerNight: formattedPrice,
              floor: editFloor,
              image: editImage || r.image,
              isAvailable: editAvailable,
            }
          : r
      )
    );

    try {
      await fetchApi(`/api/seller/rooms/${editingRoom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: editingRoom.id,
          title: editTitle,
          price: parseFloat(rawPrice),
          capacity: Number(editGuests) || 1,
          floor: editFloor,
          isAvailable: editAvailable,
          imageUrl: editImage,
        }),
      });
    } catch (err) {
      console.error('Failed to update room in backend:', err);
    } finally {
      setSavingEdit(false);
      setEditingRoom(null);
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
        ownerName={ownerName}
        partnerRole={partnerRole}
        avatarInitials={avatarInitials}
      />

      {/* 2. Right Content Section */}
      <div className={styles.rightSection}>
        {/* Top Navbar */}
        <Topbar
          title="Owner Operations Console"
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={(q) => {
            setSearchQuery(q);
            if (onSearch) onSearch(q);
          }}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Main Content Canvas */}
        <main className={styles.mainContent}>
          {statusChecked && isPropertyActive === false ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #FED7AA",
                padding: "48px 24px",
                textAlign: "center",
                maxWidth: "600px",
                margin: "40px auto",
                boxShadow: "0 10px 25px rgba(249, 115, 22, 0.08)",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#FFF1E8",
                  color: "#F97316",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Lock size={28} />
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>
                Stay & Room Services Locked
              </h2>
              <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                {propertyVerification === "APPROVED"
                  ? "Your property verification is approved! Please subscribe to the Rooms & Stay category plan to activate guest booking management and room configuration."
                  : "Your seller account is currently configured for Food Services only. To list rooms and receive hotel bookings, please apply for the Property category upgrade."}
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                {propertyVerification === "APPROVED" ? (
                  <Link
                    href="/seller/payment?category=PROPERTY"
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#F97316",
                      color: "#FFFFFF",
                      borderRadius: "10px",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>Subscribe to Rooms Plan</span>
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("open-category-upgrade", { detail: { category: "PROPERTY" } })
                      );
                    }}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#F97316",
                      color: "#FFFFFF",
                      borderRadius: "10px",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontFamily: "inherit",
                    }}
                  >
                    <span>Apply for Category Upgrade</span>
                    <ArrowRight size={16} />
                  </button>
                )}
                <Link
                  href="/seller/dashboard"
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    borderRadius: "10px",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <>
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
            {roomList.filter((r) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase().trim();
              return (
                r.title.toLowerCase().includes(q) ||
                r.tier.toLowerCase().includes(q) ||
                r.pricePerNight.toLowerCase().includes(q)
              );
            }).length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 16px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", color: "#64748b" }}>
                {loading ? "Loading configured rooms..." : searchQuery.trim() ? `No rooms matching "${searchQuery}" found.` : "No rooms configured yet. Click '+ Add Room' to create your first listing."}
              </div>
            ) : (
              roomList
                .filter((r) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase().trim();
                  return (
                    r.title.toLowerCase().includes(q) ||
                    r.tier.toLowerCase().includes(q) ||
                    r.pricePerNight.toLowerCase().includes(q)
                  );
                })
                .map((room) => (
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
                      router.push(`/seller/rooms/config?id=${room.id}`);
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
            )))}
          </div>
            </>
          )}
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

              {/* Price & Floor 2-Column Row */}
              <div className={styles.formTwoCol}>
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

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>FLOOR NO / LEVEL</label>
                  <input
                    type="text"
                    value={editFloor}
                    onChange={(e) => setEditFloor(e.target.value)}
                    placeholder="e.g. 2nd Floor, Ground"
                    className={styles.formInput}
                  />
                </div>
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
                  disabled={savingEdit}
                  style={{
                    opacity: savingEdit ? 0.6 : 1,
                    cursor: savingEdit ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={savingEdit}
                  style={{
                    opacity: savingEdit ? 0.75 : 1,
                    cursor: savingEdit ? "not-allowed" : "pointer",
                  }}
                >
                  {savingEdit ? (
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Check size={16} strokeWidth={2.8} />
                  )}
                  <span>{savingEdit ? "Saving..." : "Save Changes"}</span>
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
