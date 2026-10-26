'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, Plus, Trash2, CloudUpload, Check, Clock, Copy, Eye, RefreshCw, X, ExternalLink, Utensils, User, Users } from 'lucide-react';
import {
  DaySchedule,
  DEFAULT_ITEM_SCHEDULE,
  TIME_SLOTS_12H,
  getValidEndTimes,
  ensureValidEndTime,
  parseOperationalHours,
  serializeSchedules,
  timeToMinutes
} from '@/lib/item-timing';
import ConsoleSidebar from '../sidebar/Sidebar';
import Topbar from '../nav/Topbar';
import { fetchApi } from '@/lib/fetch-api';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { broadcastStockAlert } from '@/hooks/useSellerNotifications';
import DishAddonsSelector, { SelectedAddonItem } from '../seller-menu/addons/DishAddonsSelector';
import styles from './EditMenu.module.css';

export interface VariantItem {
  id: string;
  name: string;
  price: string | number;
  imageUrl?: string | null;
  stockQuantity?: number;
  isActive?: boolean;
}

export interface AddonItem {
  id: string;
  name: string;
  price: string | number;
  imageUrl?: string | null;
  stockQuantity?: number;
  isActive?: boolean;
}

// DaySchedule imported from @/lib/item-timing

export interface EditMenuProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

function EditMenuInner({
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  onSearch,
  onNotificationClick,
}: EditMenuProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams?.get('id');
  const fromReadiness = searchParams?.get('from') === 'readiness';
  const seller = useSellerProfile();

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string }>>([]);

  // Form states (clean empty defaults for Add New Dish)
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedServes, setSelectedServes] = useState<number | null>(null);

  // Food type dropdown & multi-select
  const [isFoodTypeDropdownOpen, setIsFoodTypeDropdownOpen] = useState(false);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>([]);
  const [foodTypeError, setFoodTypeError] = useState<string | null>(null);

  // Stock
  const [stockQty, setStockQty] = useState('');

  // Variants & Add-ons
  const [variants, setVariants] = useState<VariantItem[]>([]);

  // Themed Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalActionType, setModalActionType] = useState<'add' | 'edit'>('add');
  const [savedDishName, setSavedDishName] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (existingImageUrl) {
      setPreviewUrl(existingImageUrl);
    } else {
      setPreviewUrl('');
    }
  }, [imageFile, existingImageUrl]);
  const [schedules, setSchedules] = useState<DaySchedule[]>(() =>
    DEFAULT_ITEM_SCHEDULE.map((s) => ({ ...s }))
  );

  useEffect(() => {
    async function loadItem() {
      try {
        const res = await fetchApi('/api/seller/menu');
        if (res.ok) {
          const json = await res.json();
          const dataPayload = json.data || json;
          if (dataPayload.foodCategories && dataPayload.foodCategories.length > 0) {
            setCategoriesList(dataPayload.foodCategories);
            if (!category && !itemId) {
              setCategory(dataPayload.foodCategories[0].name);
            }
          } else {
            setCategoriesList([]);
            if (!itemId) {
              setCategory('');
            }
          }
          if (itemId && dataPayload.items) {
            const found = dataPayload.items.find((it: any) => it.id === itemId);
            if (found) {
              setItemName(found.name || '');
              setPrice(found.price !== null && found.price !== undefined ? String(found.price) : '');
              if (found.foodCategory?.name) setCategory(found.foodCategory.name);
              if (found.description) {
                const match = found.description.match(/^\(Serves\s*([1-4])\)\s*([\s\S]*)$/i) || found.description.match(/^\[Serves:\s*([1-4])\]\s*([\s\S]*)$/i);
                if (match) {
                  setSelectedServes(Number(match[1]) || null);
                  setDescription(match[2] || '');
                } else {
                  setSelectedServes(null);
                  setDescription(found.description || '');
                }
              } else {
                setSelectedServes(null);
                setDescription('');
              }
              if (found.imageUrl) setExistingImageUrl(found.imageUrl);
              setStockQty(found.stockQuantity !== null && found.stockQuantity !== undefined && found.stockQuantity >= 0 ? String(found.stockQuantity) : '');
              if (found.operationalHours) {
                setSchedules(parseOperationalHours(found.operationalHours));
              } else if (found.availableDays || found.openTime || found.closeTime) {
                const daysStr = (found.availableDays || "Mon,Tue,Wed,Thu,Fri,Sat,Sun").toLowerCase();
                const defOpen = found.openTime || "09:00 AM";
                const defClose = found.closeTime || "10:00 PM";
                setSchedules(DEFAULT_ITEM_SCHEDULE.map(d => ({
                  day: d.day,
                  isOpen: daysStr.includes(d.day.substring(0, 3).toLowerCase()) || daysStr.includes(d.day.toLowerCase()),
                  openTime: defOpen,
                  closeTime: defClose
                })));
              } else {
                setSchedules(DEFAULT_ITEM_SCHEDULE.map(s => ({ ...s })));
              }

              if (found.itemType) {
                const parts = String(found.itemType).split(',').map((s: string) => s.trim().toUpperCase());
                if (parts.includes('NON_VEG') || parts.includes('NON-VEG') || parts.includes('NON VEG')) {
                  setSelectedFoodTypes(['Non Veg']);
                } else {
                  const loadedTypes: string[] = [];
                  if (parts.includes('VEG')) loadedTypes.push('Veg');
                  if (parts.includes('VEGAN')) loadedTypes.push('Vegan');
                  if (parts.includes('JAIN')) loadedTypes.push('Jain');
                  setSelectedFoodTypes(loadedTypes);
                }
              } else {
                setSelectedFoodTypes([]);
              }

              const rawAddonsData = found.addons || found.variants;
              if (rawAddonsData) {
                try {
                  const parsed = typeof rawAddonsData === 'string' ? JSON.parse(rawAddonsData) : rawAddonsData;
                  if (Array.isArray(parsed)) {
                    setVariants(parsed.map((v: any, i: number) => ({
                      id: v.id ? String(v.id) : String(i + 1),
                      name: v.name || '',
                      price: v.price !== undefined ? v.price : '',
                      imageUrl: v.imageUrl || null,
                      stockQuantity: v.stockQuantity !== undefined ? Number(v.stockQuantity) : undefined,
                      isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
                    })));
                  }
                } catch (e) {
                  console.error('Failed to parse item addons:', e);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch menu item details:', err);
      }
    }
    loadItem();
  }, [itemId]);

  const toggleFoodType = (type: string) => {
    setSelectedFoodTypes((prev) => {
      const isAlreadySelected = prev.includes(type);

      let next: string[];
      if (isAlreadySelected) {
        // Unselect the clicked type
        next = prev.filter((t) => t !== type);
      } else {
        // Select the clicked type
        if (type === 'Non Veg' || type === 'Non-Veg' || type === 'NON_VEG') {
          // If Non Veg is selected: automatically unselect Veg, Vegan, and Jain
          next = ['Non Veg'];
        } else {
          // If Veg, Vegan, or Jain is selected: automatically unselect Non Veg
          const withoutNonVeg = prev.filter(
            (t) => t !== 'Non Veg' && t !== 'Non-Veg' && t !== 'NON_VEG'
          );
          next = [...withoutNonVeg, type];
        }
      }
      if (next.length > 0) {
        setFoodTypeError(null);
      }
      return next;
    });
  };

  const handleAddVariant = () => {
    const newId = (Date.now() + Math.floor(Math.random() * 1000)).toString();
    setVariants([...variants, { id: newId, name: '', price: '' }]);
  };

  const handleUpdateVariant = (id: string, field: 'name' | 'price', value: string) => {
    let cleanVal = value;
    if (field === 'price') {
      cleanVal = cleanVal.replace(/-/g, '');
    }
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, [field]: cleanVal } : v))
    );
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleAddAnother = () => {
    setItemName('');
    setPrice('');
    setCategory(categoriesList[0]?.name || '');
    setDescription('');
    setSelectedFoodTypes([]);
    setFoodTypeError(null);
    setStockQty('');
    setVariants([]);
    setImageFile(null);
    setPreviewUrl('');
    setIsPreviewOpen(false);
    setSchedules(DEFAULT_ITEM_SCHEDULE.map((s) => ({ ...s })));
    setShowSuccessModal(false);
    if (itemId) {
      router.push('/seller/edit-menu');
    }
  };

  const handleToggleDay = (dayName: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day === dayName ? { ...s, isOpen: !s.isOpen } : s))
    );
  };

  const handleOpenTimeChange = (dayName: string, newOpenTime: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.day !== dayName) return s;
        const validatedClose = ensureValidEndTime(newOpenTime, s.closeTime);
        return {
          ...s,
          openTime: newOpenTime,
          closeTime: validatedClose,
        };
      })
    );
  };

  const handleCloseTimeChange = (dayName: string, newCloseTime: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day === dayName ? { ...s, closeTime: newCloseTime } : s))
    );
  };

  const handleCopyMondayTimings = () => {
    const mondaySchedule = schedules.find((s) => s.day === 'Monday') || schedules[0];
    if (!mondaySchedule) return;
    setSchedules((prev) =>
      prev.map((s) => ({
        ...s,
        openTime: mondaySchedule.openTime,
        closeTime: mondaySchedule.closeTime,
      }))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName || !itemName.trim()) {
      alert("Dish Name is required.");
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      alert("Please enter a valid base price greater than ₹0 (no negative numbers).");
      return;
    }

    // Validate all Add-ons: name and price are mandatory, price must be non-negative, and no duplicate add-ons
    const seenAddonNames = new Set<string>();
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const trimmedName = (v.name || '').trim();
      if (!trimmedName) {
        alert(`Add-on #${i + 1} name is required. Please provide a name or delete the add-on.`);
        return;
      }
      const lowerName = trimmedName.toLowerCase();
      if (seenAddonNames.has(lowerName)) {
        alert(`Duplicate add-on "${trimmedName}" is not allowed. Each add-on must have a unique name.`);
        return;
      }
      seenAddonNames.add(lowerName);

      if (v.price === '' || v.price === undefined || v.price === null || isNaN(Number(v.price)) || Number(v.price) < 0) {
        alert(`Price for add-on "${trimmedName}" is mandatory and must be ₹0 or greater (negative numbers are not allowed).`);
        return;
      }
    }

    if (!category || !category.trim()) {
      alert("Please select a category.");
      return;
    }

    if (!selectedFoodTypes || selectedFoodTypes.length === 0) {
      setFoodTypeError('Food Type is required. Please select at least one type.');
      alert('Please select a food type (Veg, Non Veg, Vegan, or Jain).');
      return;
    }

    if (stockQty === '' || isNaN(parseInt(stockQty, 10)) || parseInt(stockQty, 10) < 0) {
      alert("Stock Quantity is required (enter 0 or more).");
      return;
    }

    if (!description || !description.trim()) {
      alert("Description is required.");
      return;
    }

    if (!imageFile && !existingImageUrl) {
      alert("Dish image is mandatory. Please upload an image.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', itemName);
      formData.append('price', price);
      const cleanDesc = description.replace(/^\(Serves\s*[1-4]\)\s*/i, '').replace(/^\[Serves:\s*[1-4]\]\s*/i, '').trim();
      const finalDescription = selectedServes ? `(Serves ${selectedServes}) ${cleanDesc}` : cleanDesc;
      formData.append('description', finalDescription);
      if (selectedServes) {
        formData.append('serves', String(selectedServes));
      }

      let itemTypeVal = 'VEG';
      if (selectedFoodTypes.includes('Non Veg') || selectedFoodTypes.includes('Non-Veg')) {
        itemTypeVal = 'NON_VEG';
      } else {
        const typesList: string[] = [];
        if (selectedFoodTypes.includes('Veg')) typesList.push('VEG');
        if (selectedFoodTypes.includes('Vegan')) typesList.push('VEGAN');
        if (selectedFoodTypes.includes('Jain')) typesList.push('JAIN');
        itemTypeVal = typesList.length > 0 ? typesList.join(',') : 'VEG';
      }
      formData.append('itemType', itemTypeVal);

      const cleanStock = stockQty.trim() !== '' && !isNaN(parseInt(stockQty, 10)) ? Math.max(0, parseInt(stockQty, 10)) : 0;
      formData.append('stockQuantity', String(cleanStock));
      formData.append('isAvailable', String(cleanStock > 0));

      const validVariants = variants
        .filter(v => v.name && String(v.name).trim().length > 0)
        .map(v => ({
          id: String(v.id),
          name: String(v.name).trim(),
          price: Number(v.price) || 0,
          imageUrl: v.imageUrl || null
        }));
      formData.append('addons', JSON.stringify(validVariants));
      formData.append('variants', JSON.stringify(validVariants));

      const serializedSchedules = serializeSchedules(schedules);
      formData.append('operationalHours', serializedSchedules.operationalHours);
      formData.append('availableDays', serializedSchedules.availableDays);
      formData.append('openTime', serializedSchedules.openTime);
      formData.append('closeTime', serializedSchedules.closeTime);

      let matchedCatId = categoriesList[0]?.id || '';
      const matched = categoriesList.find((c) => c.name.toLowerCase() === category.toLowerCase());
      if (matched) matchedCatId = matched.id;
      if (matchedCatId) {
        formData.append('foodCategoryId', matchedCatId);
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      let res;
      if (itemId) {
        res = await fetchApi(`/api/seller/menu/${itemId}`, {
          method: 'PATCH',
          body: formData,
        });
      } else {
        res = await fetchApi('/api/seller/menu', {
          method: 'POST',
          body: formData,
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to save menu item');
        setLoading(false);
        return;
      }

      const resData = await res.json().catch(() => ({}));
      const savedItem = resData.data?.item || resData.item || {};
      const targetId = savedItem.id || itemId;

      try {
        broadcastStockAlert({
          itemId: targetId,
          itemName: itemName.trim(),
          currentStock: cleanStock,
        });
      } catch (e) {
        console.error('Failed to broadcast stock alert:', e);
      }

      setSavedDishName(itemName);
      setModalActionType(itemId ? 'edit' : 'add');
      setShowSuccessModal(true);
      setLoading(false);
    } catch (err: any) {
      console.error('Error saving menu item:', err);
      alert(err.message || 'Error saving menu item');
      setLoading(false);
    }
  };

  return (
    <div className={styles.editMenuContainer}>
      {/* 1. Left Sidebar */}
      <ConsoleSidebar
        activeItemId="menu"
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
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Main Content Canvas */}
        <main className={styles.mainContent}>
          {/* Top Header Row with Back Button */}
          <div className={styles.topHeaderRow}>
            <Link href={fromReadiness ? "/seller/readiness" : "/seller/menu"} className={styles.backBtn} aria-label={fromReadiness ? "Go back to readiness checklist" : "Go back to menu"}>
              <ArrowLeft size={18} strokeWidth={2.4} />
            </Link>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>
                {itemId ? 'Edit Menu Item' : 'Add New Dish'}
              </h1>
              <p className={styles.pageSubtitle}>
                {itemId
                  ? `Update details for '${itemName || 'dish'}'`
                  : 'Publish a new dish to your cloud kitchen menu'}
              </p>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSave} className={styles.formCard}>
            {/* Section Header */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {itemId ? 'Dish Meta & Configurations' : 'Dish Details & Configurations'}
              </h2>
              <p className={styles.sectionSubtitle}>
                {itemId
                  ? 'Edit ingredient composition, prices, and room visibility tags.'
                  : 'Configure dish name, category, pricing, food types, and stock availability.'}
              </p>
            </div>

            {/* Field: Item Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Item Name <span className={styles.requiredStar}>*</span>
              </label>
              <input
                type="text"
                className={styles.textInput}
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Enter item name"
                required
              />
            </div>

            {/* 2-Column Row: Price & Category */}
            <div className={styles.twoColRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Price (₹) <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={styles.textInput}
                  value={price}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/-/g, '');
                    setPrice(clean);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter price (₹)"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Category <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.selectInput}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    {categoriesList.length === 0 ? (
                      <option value="">No categories available</option>
                    ) : (
                      <>
                        {!category && <option value="">Select a category</option>}
                        {categoriesList.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown size={16} className={styles.selectArrow} />
                </div>
              </div>
            </div>

            {/* 2-Column Row: Food Type & Automatic Stock */}
            <div className={styles.twoColRow}>
              {/* Food Type with Custom Multi-select Dropdown */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Food Type <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.foodTypeDropdownContainer}>
                  <button
                    type="button"
                    className={`${styles.dropdownTrigger} ${
                      foodTypeError ? styles.dropdownTriggerError : ''
                    }`}
                    onClick={() => setIsFoodTypeDropdownOpen((prev) => !prev)}
                  >
                    <span
                      className={styles.dropdownTriggerText}
                      style={{
                        color: selectedFoodTypes.length === 0 ? '#94A3B8' : '#0F172A',
                      }}
                    >
                      {selectedFoodTypes.length > 0
                        ? selectedFoodTypes.join(', ')
                        : 'Select Food Type *'}
                    </span>
                    <ChevronDown size={16} className={styles.selectArrow} />
                  </button>
                  {foodTypeError && (
                    <span className={styles.errorText}>{foodTypeError}</span>
                  )}

                  {isFoodTypeDropdownOpen && (
                    <>
                      <div
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 40,
                        }}
                        onClick={() => setIsFoodTypeDropdownOpen(false)}
                      />
                      <div className={styles.dropdownMenu} style={{ zIndex: 45 }}>
                        {['Veg', 'Non Veg', 'Vegan', 'Jain'].map((type) => {
                          const isSelected = selectedFoodTypes.includes(type);
                          const dotColor =
                            type === 'Non Veg'
                              ? '#EF4444'
                              : type === 'Jain'
                              ? '#16A34A'
                              : type === 'Vegan'
                              ? '#059669'
                              : '#16A34A';
                          return (
                            <div
                              key={type}
                              className={styles.dropdownOption}
                              onClick={() => toggleFoodType(type)}
                            >
                              <div
                                className={`${styles.checkboxBox} ${
                                   isSelected ? styles.checkboxBoxActive : ''
                                }`}
                              >
                                {isSelected && <Check size={12} strokeWidth={3} />}
                              </div>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: dotColor,
                                  display: 'inline-block',
                                  marginRight: '6px',
                                }}
                              />
                              <span className={styles.optionLabel}>{type}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Manual Stock Quantity Input */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Stock Quantity <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.textInput}
                  value={stockQty}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    if (rawVal === '') {
                      setStockQty('');
                      return;
                    }
                    const cleanVal = rawVal.replace(/[^\d]/g, '');
                    const num = parseInt(cleanVal, 10);
                    setStockQty(isNaN(num) ? '0' : String(Math.max(0, num)));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter available stock (e.g. 25)"
                  required
                />
              </div>
            </div>

            {/* Field: Description */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Description <span className={styles.requiredStar}>*</span>
              </label>
              <textarea
                className={styles.textAreaInput}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dish description..."
                required
              />
            </div>

            {/* Field: Serves (Portion Size: 1, 2, 3, 4 - Optional) */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Serves (Portion Size) <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "normal" }}>(Optional)</span>
              </label>
              <div className={styles.servesGrid}>
                {[
                  { value: 1, label: "Serves 1", icon: <User size={15} strokeWidth={2.4} /> },
                  { value: 2, label: "Serves 2", icon: <Users size={15} strokeWidth={2.4} /> },
                  { value: 3, label: "Serves 3", icon: <Users size={15} strokeWidth={2.4} /> },
                  { value: 4, label: "Serves 4", icon: <Users size={15} strokeWidth={2.4} /> },
                ].map((item) => {
                  const isSelected = selectedServes === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSelectedServes(selectedServes === item.value ? null : item.value)}
                      className={`${styles.servesBtn} ${isSelected ? styles.servesBtnActive : ""}`}
                    >
                      <span className={styles.servesIcon}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dish Add-Ons Section */}
            <div className={styles.subSection} style={{ padding: "18px 20px", backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
              <DishAddonsSelector
                selectedAddons={variants as SelectedAddonItem[]}
                onChange={(updated) => setVariants(updated as VariantItem[])}
              />
            </div>

            {/* Weekly Availability & Operational Hours */}
            <div className={styles.timingSection}>
              <div className={styles.timingHeaderRow}>
                <div className={styles.timingHeaderLeft}>
                  <h3 className={styles.timingSectionTitle}>
                    <Clock size={18} color="#F97316" />
                    Weekly Availability & Timings
                  </h3>
                  <p className={styles.timingSectionSubtitle}>
                    Dish is visible and orderable only during active days and hours (12-hour schedule).
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.copyTimingsBtn}
                  onClick={handleCopyMondayTimings}
                  title="Copy Monday's open & close times to all 7 days"
                >
                  <Copy size={13} />
                  <span>Copy Mon to all</span>
                </button>
              </div>

              <div className={styles.timingDaysList}>
                {schedules.map((schedule) => {
                  const validEndTimes = getValidEndTimes(schedule.openTime);

                  return (
                    <div
                      key={schedule.day}
                      className={`${styles.timingDayRow} ${
                        schedule.isOpen ? styles.timingDayRowOpen : styles.timingDayRowClosed
                      }`}
                    >
                      <div className={styles.timingDayLeft}>
                        <label className={styles.timingCheckboxWrapper}>
                          <input
                            type="checkbox"
                            checked={schedule.isOpen}
                            onChange={() => handleToggleDay(schedule.day)}
                            style={{ width: '16px', height: '16px', accentColor: '#F97316', cursor: 'pointer' }}
                          />
                        </label>
                        <span className={styles.timingDayName}>{schedule.day}</span>
                        <span
                          className={`${styles.timingStatusBadge} ${
                            schedule.isOpen ? styles.statusOpen : styles.statusClosed
                          }`}
                        >
                          {schedule.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>

                      <div className={styles.timingDayControls}>
                        {schedule.isOpen ? (
                          <>
                            <div className={styles.timePickerGroup}>
                              <span className={styles.timePickerLabel}>From</span>
                              <select
                                className={styles.timeSelect}
                                value={schedule.openTime}
                                onChange={(e) => handleOpenTimeChange(schedule.day, e.target.value)}
                              >
                                {TIME_SLOTS_12H.filter((t) => t !== '11:59 PM').map((timeSlot) => (
                                  <option key={timeSlot} value={timeSlot}>
                                    {timeSlot}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <span className={styles.timeSeparator}>–</span>

                            <div className={styles.timePickerGroup}>
                              <span className={styles.timePickerLabel}>To</span>
                              <select
                                className={styles.timeSelect}
                                value={schedule.closeTime}
                                onChange={(e) => handleCloseTimeChange(schedule.day, e.target.value)}
                              >
                                {validEndTimes.map((timeSlot) => (
                                  <option key={timeSlot} value={timeSlot}>
                                    {timeSlot}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        ) : (
                          <span className={styles.closedMessage}>Closed for ordering on this day</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dish Image Representation */}
            <div className={styles.subSection}>
              <div className={styles.subSectionHeaderRow}>
                <label className={styles.subSectionTitle}>
                  Dish Image representation <span className={styles.requiredStar}>*</span>
                </label>
                {(imageFile || existingImageUrl) && (
                  <button
                    type="button"
                    className={styles.headerPreviewBtn}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPreviewOpen(true);
                    }}
                    title="Preview dish image"
                  >
                    <Eye size={14} />
                    <span>Preview</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.fileInputHidden}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (file.size > 5 * 1024 * 1024) {
                      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                      alert(`Dish image "${file.name}" (${sizeMB} MB) exceeds the 5MB upload limit. Please upload an image under 5MB.`);
                      e.target.value = "";
                      return;
                    }
                    setImageFile(file);
                  }
                }}
              />

              {imageFile || existingImageUrl ? (
                <div
                  className={styles.uploadedDropzone}
                  onClick={() => setIsPreviewOpen(true)}
                  title="Click to preview image"
                >
                  <div className={styles.uploadedLeft}>
                    <div className={styles.dishThumbnailWrap}>
                      <img
                        src={previewUrl || existingImageUrl}
                        alt="Dish Thumbnail"
                        className={styles.dishThumbnail}
                      />
                    </div>
                    <div className={styles.fileInfoGroup}>
                      <p className={styles.fileName}>
                        {imageFile ? imageFile.name : (itemName ? `${itemName} - Photo` : "dish-photo.jpg")}
                      </p>
                      <p className={styles.fileStatus}>
                        {imageFile
                          ? `Ready to upload (${(imageFile.size / (1024 * 1024)).toFixed(2)} MB)`
                          : "Current menu photo (Active)"}
                      </p>
                    </div>
                  </div>

                  <div className={styles.dropzoneActions} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.actionPreviewBtn}
                      onClick={() => setIsPreviewOpen(true)}
                      title="Preview dish image"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      className={styles.reuploadBtn}
                      onClick={() => fileInputRef.current?.click()}
                      title="Change dish photo"
                    >
                      <RefreshCw size={13} />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => {
                        setImageFile(null);
                        setExistingImageUrl("");
                        setPreviewUrl("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      title="Remove image"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.uploadDropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={styles.uploadContent}>
                    <div className={styles.cloudIconBadge}>
                      <CloudUpload size={22} color="#F97316" strokeWidth={2.2} />
                    </div>
                    <span className={styles.uploadMainText}>
                      <span className={styles.browseLink}>Click to upload</span> or drag and drop
                    </span>
                    <span className={styles.uploadHint}>
                      PNG, JPG, up to 5MB, recommended square scale ratio
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className={styles.bottomActions}>
              <Link href={fromReadiness ? "/seller/readiness" : "/seller/menu"} className={styles.cancelBtn}>
                Cancel
              </Link>
              <button type="submit" className={styles.saveItemBtn} disabled={loading}>
                {loading ? 'Saving...' : itemId ? 'Update Dish' : 'Add Dish'}
              </button>
            </div>
          </form>

          {/* Document-style Dish Image Preview Modal */}
          {isPreviewOpen && (previewUrl || existingImageUrl) && (
            <div
              className={styles.previewModalOverlay}
              onClick={() => setIsPreviewOpen(false)}
              role="dialog"
              aria-modal="true"
            >
              <div
                className={styles.previewModalCard}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.previewModalHeader}>
                  <div className={styles.previewModalHeaderLeft}>
                    <div className={styles.previewIconSquircle}>
                      <Utensils size={20} className={styles.previewHeaderIcon} />
                    </div>
                    <div className={styles.previewHeaderTextGroup}>
                      <h3 className={styles.previewModalTitle}>
                        {itemName ? `${itemName} - Dish Image Preview` : "Dish Image Preview"}
                      </h3>
                      <div className={styles.previewModalSubtitleRow}>
                        <span className={styles.previewModalFileName} title={imageFile ? imageFile.name : (itemName ? `${itemName} Photo` : "dish-photo.jpg")}>
                          {imageFile ? imageFile.name : (itemName ? `${itemName} Photo` : "dish-photo.jpg")}
                        </span>
                        {imageFile && (
                          <span className={styles.previewModalFileSize}>
                            {(imageFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.previewModalHeaderActions}>
                    <button
                      type="button"
                      className={styles.previewExternalBtn}
                      onClick={() => {
                        const win = window.open();
                        if (win) {
                          win.document.write(
                            `<html><head><title>${itemName || "Dish Image"} Preview</title></head><body style="margin:0; background:#0f172a; display:flex; align-items:center; justify-content:center; min-height:100vh;"><img src="${previewUrl}" style="max-width:100%; max-height:100vh; object-fit:contain;"/></body></html>`
                          );
                        }
                      }}
                      title="Open full size in new tab"
                    >
                      <ExternalLink size={14} />
                      <span>Full Screen</span>
                    </button>
                    <button
                      type="button"
                      className={styles.modalCloseBtn}
                      onClick={() => setIsPreviewOpen(false)}
                      title="Close preview"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className={styles.previewModalBody}>
                  <div className={styles.imageContainer}>
                    <img
                      src={previewUrl}
                      alt={itemName || "Dish Photo"}
                      className={styles.previewImg}
                    />
                  </div>
                </div>

                <div className={styles.previewModalFooter}>
                  <button
                    type="button"
                    className={styles.previewChangeBtn}
                    onClick={() => {
                      setIsPreviewOpen(false);
                      setTimeout(() => {
                        fileInputRef.current?.click();
                      }, 60);
                    }}
                  >
                    <RefreshCw size={14} />
                    <span>Replace / Change Photo</span>
                  </button>
                  <button
                    type="button"
                    className={styles.previewCloseBtn}
                    onClick={() => setIsPreviewOpen(false)}
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Themed Confirmation Modal Popup */}
          {showSuccessModal && (
            <div className={styles.modalOverlay} onClick={() => setShowSuccessModal(false)}>
              <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalIconBadge}>
                  <Check size={28} strokeWidth={3} color="#FFFFFF" />
                </div>
                <h3 className={styles.modalTitle}>
                  {modalActionType === 'add' ? 'Dish Added Successfully!' : 'Dish Updated Successfully!'}
                </h3>
                <p className={styles.modalMessage}>
                  &lsquo;<strong>{savedDishName}</strong>&rsquo; has been saved with active add-ons and pricing, and is now live in your menu.
                </p>
                <div className={styles.modalButtons}>
                  <button
                    type="button"
                    className={styles.modalPrimaryBtn}
                    onClick={() => router.push(fromReadiness ? '/seller/readiness' : '/seller/menu')}
                  >
                    {fromReadiness ? 'Return to Readiness Checklist' : 'View Menu Inventory'}
                  </button>
                  {modalActionType === 'add' && (
                    <button
                      type="button"
                      className={styles.modalSecondaryBtn}
                      onClick={handleAddAnother}
                    >
                      Add Another Dish
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export const EditMenu: React.FC<EditMenuProps> = (props) => {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
          Loading Edit Menu...
        </div>
      }
    >
      <EditMenuInner {...props} />
    </Suspense>
  );
};

export default EditMenu;
