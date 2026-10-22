'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, Plus, Trash2, CloudUpload, Check, Eye, RefreshCw, X, ExternalLink, Utensils } from 'lucide-react';
import ConsoleSidebar from '../sidebar/Sidebar';
import Topbar from '../nav/Topbar';
import { fetchApi } from '@/lib/fetch-api';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { broadcastStockAlert } from '@/hooks/useSellerNotifications';
import styles from './EditMenu.module.css';

export interface VariantItem {
  id: string;
  name: string;
  price: string;
}

export interface AddonItem {
  id: string;
  name: string;
  price: string;
}

export interface DaySchedule {
  day: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

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

  // Dish Photos (up to 4 photos)
  interface DishPhotoItem {
    id: string;
    url: string;
    file?: File | null;
    isExisting?: boolean;
    name?: string;
    sizeMB?: string;
  }
  const [photos, setPhotos] = useState<DishPhotoItem[]>([]);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 4) {
      alert("Maximum 4 photos allowed for food items. Please remove a photo first to upload a new one.");
      e.target.value = "";
      return;
    }

    const availableSlots = 4 - photos.length;
    const fileList = Array.from(files);
    const filesToProcess = fileList.slice(0, availableSlots);
    if (fileList.length > availableSlots) {
      alert(`You can only upload up to 4 photos. Only the first ${availableSlots} selected photo(s) will be added.`);
    }

    const newPhotos: DishPhotoItem[] = [];
    for (const file of filesToProcess) {
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Dish image "${file.name}" (${sizeMB} MB) exceeds the 5MB upload limit. Please upload images under 5MB.`);
        continue;
      }
      newPhotos.push({
        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: URL.createObjectURL(file),
        file,
        isExisting: false,
        name: file.name,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      });
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 4));
    }
    e.target.value = "";
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target && target.url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(target.url);
        } catch {}
      }
      const updated = prev.filter((p) => p.id !== id);
      if (previewPhotoIndex >= updated.length) {
        setPreviewPhotoIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

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
              const loadedPhotos: DishPhotoItem[] = [];
              if (found.images) {
                try {
                  const parsed = typeof found.images === "string" ? JSON.parse(found.images) : found.images;
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    parsed.slice(0, 4).forEach((u: string, idx: number) => {
                      if (u && typeof u === "string") {
                        loadedPhotos.push({
                          id: `existing-${idx}-${u}`,
                          url: u,
                          isExisting: true,
                          name: `Photo ${idx + 1}`
                        });
                      }
                    });
                  }
                } catch {}
              }
              if (loadedPhotos.length === 0 && found.imageUrl) {
                loadedPhotos.push({
                  id: `existing-0-${found.imageUrl}`,
                  url: found.imageUrl,
                  isExisting: true,
                  name: "Cover Photo"
                });
              }
              setPhotos(loadedPhotos);
              setStockQty(found.stockQuantity !== null && found.stockQuantity !== undefined && found.stockQuantity >= 0 ? String(found.stockQuantity) : '');
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
                      id: v.id || String(i + 1),
                      name: v.name || '',
                      price: String(v.price ?? '')
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
    setPhotos([]);
    setShowSuccessModal(false);
    if (itemId) {
      router.push('/seller/edit-menu');
    }
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

    if (photos.length === 0) {
      alert("Dish image is mandatory. Please upload at least one photo (up to 4 photos).");
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
        .filter(v => v.name.trim().length > 0)
        .map(v => ({
          id: v.id,
          name: v.name.trim(),
          price: Number(v.price) || 0
        }));
      formData.append('addons', JSON.stringify(validVariants));
      formData.append('variants', JSON.stringify(validVariants));

      let matchedCatId = categoriesList[0]?.id || '';
      const matched = categoriesList.find((c) => c.name.toLowerCase() === category.toLowerCase());
      if (matched) matchedCatId = matched.id;
      if (matchedCatId) {
        formData.append('foodCategoryId', matchedCatId);
      }

      // Append up to 4 photos
      const existingUrls: string[] = [];
      let firstFileAppended = false;

      photos.forEach((p) => {
        if (p.file) {
          formData.append('images', p.file);
          if (!firstFileAppended) {
            formData.append('image', p.file);
            firstFileAppended = true;
          }
        } else if (p.isExisting && p.url && !p.url.startsWith('blob:')) {
          existingUrls.push(p.url);
        }
      });

      if (existingUrls.length > 0) {
        formData.append('existingImages', JSON.stringify(existingUrls));
        if (!firstFileAppended) {
          formData.append('imageUrl', existingUrls[0]);
        }
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
            <Link href="/seller/menu" className={styles.backBtn} aria-label="Go back to menu">
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

            {/* Field: Serves (Portion Size: 1, 2, 3, 4) */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Serves (Portion Size) <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "normal" }}>(Optional)</span>
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "12px",
                  width: "100%",
                }}
              >
                {[
                  { value: 1, label: "Serves 1", icon: "👤" },
                  { value: 2, label: "Serves 2", icon: "👥" },
                  { value: 3, label: "Serves 3", icon: "👨‍👩‍👧" },
                  { value: 4, label: "Serves 4", icon: "👨‍👩‍👧‍👦" },
                ].map((item) => {
                  const isSelected = selectedServes === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSelectedServes(selectedServes === item.value ? null : item.value)}
                      style={{
                        height: "44px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        borderRadius: "10px",
                        border: isSelected ? "none" : "1.5px solid #E2E8F0",
                        backgroundColor: isSelected ? "#F97316" : "#FFFFFF",
                        backgroundImage: isSelected
                          ? "linear-gradient(135deg, #FF5500 0%, #F97316 100%)"
                          : "none",
                        color: isSelected ? "#FFFFFF" : "#334155",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: "0.88rem",
                        cursor: "pointer",
                        boxShadow: isSelected
                          ? "0 3px 10px rgba(249, 115, 22, 0.28)"
                          : "none",
                        transition: "all 0.18s ease",
                        outline: "none",
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dish Add-Ons Section */}
            <div className={styles.subSection}>
              <label className={styles.subSectionTitle}>
                Dish Add-Ons <span style={{ fontSize: "0.85rem", fontWeight: "normal", color: "#64748B" }}>(Optional add-ons with extra price, e.g. Dahi, Extra Butter, Extra Roti)</span>
              </label>
              <div className={styles.variantsList}>
                {variants.map((variant) => (
                  <div key={variant.id} className={styles.variantRow}>
                    <input
                      type="text"
                      className={styles.variantNameInput}
                      placeholder="Add-on name (e.g. Dahi, Extra Butter, Extra Pav) *"
                      value={variant.name}
                      required
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, 'name', e.target.value)
                      }
                    />
                    <div className={styles.variantPriceWrapper}>
                      <span className={styles.variantPricePrefix}>
                        <span className={styles.variantPlus}>+</span>
                        <span className={styles.variantCurrency}>₹</span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={styles.variantPriceInput}
                        placeholder="Price *"
                        value={variant.price}
                        required
                        onChange={(e) =>
                          handleUpdateVariant(variant.id, 'price', e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                            e.preventDefault();
                          }
                        }}
                        aria-label="Add-on price"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(variant.id)}
                      className={styles.deleteVariantBtn}
                      aria-label="Remove add-on"
                      title="Remove add-on"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddVariant}
                className={styles.addVariantBtn}
              >
                <Plus size={15} strokeWidth={2.6} />
                <span>Add Add-on</span>
              </button>
            </div>

            {/* Dish Image Representation (Up to 4 Photos) */}
            <div className={styles.subSection}>
              <div className={styles.subSectionHeaderRow}>
                <label className={styles.subSectionTitle}>
                  Dish Image representation <span className={styles.requiredStar}>*</span>
                  <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 500, marginLeft: "8px" }}>
                    ({photos.length}/4 photos)
                  </span>
                </label>
                {photos.length > 0 && (
                  <button
                    type="button"
                    className={styles.headerPreviewBtn}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPreviewPhotoIndex(0);
                      setIsPreviewOpen(true);
                    }}
                    title="Preview dish images"
                  >
                    <Eye size={14} />
                    <span>Preview Photos</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.fileInputHidden}
                onChange={handlePhotoUpload}
              />

              {photos.length === 0 ? (
                <div
                  className={styles.uploadDropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={styles.uploadContent}>
                    <div className={styles.cloudIconBadge}>
                      <CloudUpload size={24} color="#F97316" strokeWidth={2.2} />
                    </div>
                    <span className={styles.uploadTitle}>Click to upload raw picture</span>
                    <span className={styles.uploadHint}>
                      PNG, JPG, up to 5MB, recommended square scale ratio (up to 4 photos)
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: "12px",
                      width: "100%",
                    }}
                  >
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        style={{
                          position: "relative",
                          width: "100%",
                          paddingTop: "100%",
                          borderRadius: "12px",
                          border: idx === 0 ? "2px solid #F97316" : "1.5px solid #E2E8F0",
                          backgroundColor: "#F8FAFC",
                          overflow: "hidden",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <img
                          src={photo.url}
                          alt={photo.name || `Dish Photo ${idx + 1}`}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />

                        {/* Primary / Cover Badge */}
                        {idx === 0 ? (
                          <div
                            style={{
                              position: "absolute",
                              top: "6px",
                              left: "6px",
                              backgroundColor: "#FF5500",
                              color: "#FFFFFF",
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                              zIndex: 2,
                            }}
                          >
                            <span>★</span>
                            <span>Cover</span>
                          </div>
                        ) : (
                          <div
                            style={{
                              position: "absolute",
                              top: "6px",
                              left: "6px",
                              backgroundColor: "rgba(15, 23, 42, 0.72)",
                              backdropFilter: "blur(4px)",
                              color: "#FFFFFF",
                              fontSize: "10px",
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: "6px",
                              zIndex: 2,
                            }}
                          >
                            #{idx + 1}
                          </div>
                        )}

                        {/* Action buttons (Preview & Remove) */}
                        <div
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            display: "flex",
                            gap: "4px",
                            zIndex: 3,
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPreviewPhotoIndex(idx);
                              setIsPreviewOpen(true);
                            }}
                            title="Preview image"
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "6px",
                              backgroundColor: "rgba(15, 23, 42, 0.75)",
                              color: "#FFFFFF",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemovePhoto(photo.id);
                            }}
                            title="Remove photo"
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "6px",
                              backgroundColor: "rgba(239, 68, 68, 0.88)",
                              color: "#FFFFFF",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add More Photos Slot when less than 4 */}
                    {photos.length < 4 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          position: "relative",
                          width: "100%",
                          paddingTop: "100%",
                          borderRadius: "12px",
                          border: "1.5px dashed #CBD5E1",
                          backgroundColor: "#F8FAFC",
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#F97316";
                          e.currentTarget.style.backgroundColor = "#FFF7ED";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#CBD5E1";
                          e.currentTarget.style.backgroundColor = "#F8FAFC";
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "8px",
                            boxSizing: "border-box",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: "#FFEDD5",
                              color: "#F97316",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Plus size={18} strokeWidth={2.4} />
                          </div>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                            Add Photo
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                            {photos.length}/4
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p style={{ margin: "2px 0 0 0", fontSize: "0.74rem", color: "#64748B" }}>
                    💡 You can upload up to 4 photos. The first photo (Cover) will be displayed as the main dish card thumbnail.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className={styles.bottomActions}>
              <Link href="/seller/menu" className={styles.cancelBtn}>
                Cancel
              </Link>
              <button type="submit" className={styles.saveItemBtn} disabled={loading}>
                {loading ? 'Saving...' : itemId ? 'Update Dish' : 'Add Dish'}
              </button>
            </div>
          </form>

          {/* Multi-Photo Dish Image Preview Modal */}
          {isPreviewOpen && photos.length > 0 && photos[previewPhotoIndex] && (
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
                        {itemName ? `${itemName} - Photo ${previewPhotoIndex + 1} of ${photos.length}` : `Dish Photo ${previewPhotoIndex + 1} of ${photos.length}`}
                      </h3>
                      <div className={styles.previewModalSubtitleRow}>
                        <span className={styles.previewModalFileName}>
                          {photos[previewPhotoIndex].name || `dish-photo-${previewPhotoIndex + 1}.jpg`}
                        </span>
                        {photos[previewPhotoIndex].sizeMB && (
                          <span className={styles.previewModalFileSize}>
                            {photos[previewPhotoIndex].sizeMB} MB
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
                            `<html><head><title>${itemName || "Dish Image"} Preview</title></head><body style="margin:0; background:#0f172a; display:flex; align-items:center; justify-content:center; min-height:100vh;"><img src="${photos[previewPhotoIndex].url}" style="max-width:100%; max-height:100vh; object-fit:contain;"/></body></html>`
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
                      src={photos[previewPhotoIndex].url}
                      alt={itemName || "Dish Photo"}
                      className={styles.previewImg}
                    />
                  </div>

                  {/* Thumbnail Selector Strip if multiple photos */}
                  {photos.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "12px",
                        justifyContent: "center",
                      }}
                    >
                      {photos.map((p, pIdx) => (
                        <div
                          key={p.id}
                          onClick={() => setPreviewPhotoIndex(pIdx)}
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "8px",
                            border: pIdx === previewPhotoIndex ? "2px solid #F97316" : "1.5px solid #CBD5E1",
                            overflow: "hidden",
                            cursor: "pointer",
                            opacity: pIdx === previewPhotoIndex ? 1 : 0.6,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <img
                            src={p.url}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.previewModalFooter}>
                  <button
                    type="button"
                    className={styles.modalCloseFooterBtn}
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
                    onClick={() => router.push('/seller/menu')}
                  >
                    View Menu Inventory
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
