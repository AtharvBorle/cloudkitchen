'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, Plus, Trash2, CloudUpload, Check } from 'lucide-react';
import ConsoleSidebar from '../sidebar/Sidebar';
import Topbar from '../nav/Topbar';
import { fetchApi } from '@/lib/fetch-api';
import { useSellerProfile } from '@/hooks/useSellerProfile';
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

  // Day-wise Operational Hours
  const [schedules, setSchedules] = useState<DaySchedule[]>([
    { day: 'Monday', openTime: '', closeTime: '', isOpen: true },
    { day: 'Tuesday', openTime: '', closeTime: '', isOpen: true },
    { day: 'Wednesday', openTime: '', closeTime: '', isOpen: true },
    { day: 'Thursday', openTime: '', closeTime: '', isOpen: true },
    { day: 'Friday', openTime: '', closeTime: '', isOpen: true },
    { day: 'Saturday', openTime: '', closeTime: '', isOpen: true },
    { day: 'Sunday', openTime: '', closeTime: '', isOpen: true },
  ]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');

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
              setDescription(found.description || '');
              if (found.imageUrl) setExistingImageUrl(found.imageUrl);
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

              if (found.operationalHours) {
                try {
                  const parsed = typeof found.operationalHours === 'string' ? JSON.parse(found.operationalHours) : found.operationalHours;
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setSchedules(parsed);
                  }
                } catch {}
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

  const handleToggleDay = (day: string) => {
    setSchedules(
      schedules.map((s) => (s.day === day ? { ...s, isOpen: !s.isOpen } : s))
    );
  };

  const handleTimeChange = (day: string, field: 'openTime' | 'closeTime', val: string) => {
    setSchedules(
      schedules.map((s) => (s.day === day ? { ...s, [field]: val } : s))
    );
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

    // Validate all Add-ons: name and price are mandatory, price must be non-negative
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const trimmedName = (v.name || '').trim();
      if (!trimmedName) {
        alert(`Add-on #${i + 1} name is required. Please provide a name or delete the add-on.`);
        return;
      }
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
      formData.append('description', description || '');

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
      formData.append('operationalHours', JSON.stringify(schedules));

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
                      <span className={styles.currencyPrefix}>+₹</span>
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

            {/* Day-wise Operational Hours */}
            <div className={styles.subSection}>
              <label className={styles.subSectionTitle}>Day-wise Operational Hours</label>
              <div className={styles.scheduleList}>
                {schedules.map((schedule) => (
                  <div key={schedule.day} className={styles.scheduleRow}>
                    <span className={styles.scheduleDay}>{schedule.day}</span>
                    <div className={styles.timeRangeWrapper}>
                      <input
                        type="text"
                        className={styles.timeInput}
                        value={schedule.openTime}
                        placeholder="09:00 AM"
                        onChange={(e) =>
                          handleTimeChange(schedule.day, 'openTime', e.target.value)
                        }
                      />
                      <span className={styles.toText}>to</span>
                      <input
                        type="text"
                        className={styles.timeInput}
                        value={schedule.closeTime}
                        placeholder="10:00 PM"
                        onChange={(e) =>
                          handleTimeChange(schedule.day, 'closeTime', e.target.value)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleDay(schedule.day)}
                      className={`${styles.toggleSwitch} ${
                        schedule.isOpen ? styles.toggleSwitchActive : ''
                      }`}
                      aria-label={`Toggle ${schedule.day} hours`}
                    >
                      <span
                        className={`${styles.toggleThumb} ${
                          schedule.isOpen ? styles.toggleThumbActive : ''
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dish Image Representation */}
            <div className={styles.subSection}>
              <label className={styles.subSectionTitle}>
                Dish Image representation <span className={styles.requiredStar}>*</span>
              </label>
              <label className={styles.uploadDropzone}>
                <input
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
                <div className={styles.uploadContent}>
                  <div className={styles.cloudIconBadge}>
                    <CloudUpload size={22} color="#F97316" strokeWidth={2.2} />
                  </div>
                  <span className={styles.uploadTitle}>Click to upload raw picture</span>
                  <span className={styles.uploadHint}>
                    {imageFile
                      ? `Selected: ${imageFile.name}`
                      : existingImageUrl
                      ? 'Current image attached (click to replace)'
                      : 'PNG, JPG, up to 5MB, recommended square scale ratio'}
                  </span>
                </div>
              </label>
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
