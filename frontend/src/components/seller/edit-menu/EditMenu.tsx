'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, Plus, Trash2, CloudUpload, Check } from 'lucide-react';
import ConsoleSidebar from '../sidebar/Sidebar';
import Topbar from '../nav/Topbar';
import { fetchApi } from '@/lib/fetch-api';
import styles from './EditMenu.module.css';

export interface VariantItem {
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
  ownerName = 'John Doe',
  partnerRole = 'Neo Cloud Partner',
  avatarInitials = 'JD',
  onSearch,
  onNotificationClick,
}: EditMenuProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams?.get('id');

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string }>>([
    { id: 'cat-1', name: 'North Indian' },
    { id: 'cat-2', name: 'South Indian' },
    { id: 'cat-3', name: 'Chinese' },
    { id: 'cat-4', name: 'Italian' },
    { id: 'cat-5', name: 'Desserts' },
    { id: 'cat-6', name: 'Beverages' },
  ]);

  // Form states
  const [itemName, setItemName] = useState('Special Butter Chicken');
  const [price, setPrice] = useState('380');
  const [category, setCategory] = useState('North Indian');
  const [description, setDescription] = useState(
    'Tender chicken cubes simmered in a rich, buttery, spiced tomato gravy with fresh cream.'
  );

  // Food type dropdown & multi-select
  const [isFoodTypeDropdownOpen, setIsFoodTypeDropdownOpen] = useState(false);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>(['Veg']);

  // Stock
  const [stockQty, setStockQty] = useState('24');
  const [isInStock, setIsInStock] = useState(true);

  // Variants & Add-ons
  const [variants, setVariants] = useState<VariantItem[]>([
    { id: '1', name: 'Extra Cheese', price: '40' },
    { id: '2', name: 'Paneer with Corn', price: '60' },
    { id: '3', name: 'Extra Pizza Slice', price: '80' },
    { id: '4', name: 'Mushroom Topping', price: '50' },
  ]);

  // Day-wise Operational Hours
  const [schedules, setSchedules] = useState<DaySchedule[]>([
    { day: 'Monday', openTime: '09:00 AM', closeTime: '10:00 PM', isOpen: true },
    { day: 'Tuesday', openTime: '09:00 AM', closeTime: '10:00 PM', isOpen: true },
    { day: 'Wednesday', openTime: '09:00 AM', closeTime: '10:00 PM', isOpen: true },
    { day: 'Thursday', openTime: '09:00 AM', closeTime: '10:00 PM', isOpen: true },
    { day: 'Friday', openTime: '09:00 AM', closeTime: '10:00 PM', isOpen: true },
    { day: 'Saturday', openTime: '09:00 AM', closeTime: '10:00 PM', isOpen: true },
    { day: 'Sunday', openTime: '09:00 AM', closeTime: '10:00 PM', isOpen: true },
  ]);

  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadItem() {
      try {
        const res = await fetchApi('/api/seller/menu');
        if (res.ok) {
          const json = await res.json();
          const dataPayload = json.data || json;
          if (dataPayload.foodCategories && dataPayload.foodCategories.length > 0) {
            setCategoriesList(dataPayload.foodCategories);
          }
          if (itemId && dataPayload.items) {
            const found = dataPayload.items.find((it: any) => it.id === itemId);
            if (found) {
              setItemName(found.name || '');
              setPrice(String(found.price || ''));
              if (found.foodCategory?.name) setCategory(found.foodCategory.name);
              setDescription(found.description || '');
              setStockQty(String(found.stockQuantity >= 0 ? found.stockQuantity : 24));
              setIsInStock(found.isAvailable ?? true);
              setSelectedFoodTypes(found.itemType === 'NON_VEG' ? ['Non Veg'] : ['Veg']);
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
    if (selectedFoodTypes.includes(type)) {
      if (selectedFoodTypes.length > 1) {
        setSelectedFoodTypes(selectedFoodTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedFoodTypes([...selectedFoodTypes, type]);
    }
  };

  const handleAddVariant = () => {
    const newId = (variants.length + 1).toString();
    setVariants([...variants, { id: newId, name: '', price: '' }]);
  };

  const handleUpdateVariant = (id: string, field: 'name' | 'price', value: string) => {
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', itemName);
      formData.append('price', price);
      formData.append('description', description || '');
      formData.append('itemType', selectedFoodTypes.includes('Non Veg') ? 'NON_VEG' : 'VEG');
      formData.append('stockQuantity', stockQty || '24');
      formData.append('isAvailable', String(isInStock));

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

      router.push('/seller/menu');
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
              <h1 className={styles.pageTitle}>Edit Menu Item</h1>
              <p className={styles.pageSubtitle}>
                Update details for &lsquo;{itemName}&rsquo;
              </p>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSave} className={styles.formCard}>
            {/* Section Header */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Dish Meta & Configurations</h2>
              <p className={styles.sectionSubtitle}>
                Edit ingredient composition, prices, and room visibility tags.
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
                placeholder="Item Name"
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
                  className={styles.textInput}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="380"
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
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className={styles.selectArrow} />
                </div>
              </div>
            </div>

            {/* 2-Column Row: Food Type & Automatic Stock */}
            <div className={styles.twoColRow}>
              {/* Food Type with Custom Multi-select Dropdown */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Food Type</label>
                <div className={styles.foodTypeDropdownContainer}>
                  <button
                    type="button"
                    className={styles.dropdownTrigger}
                    onClick={() => setIsFoodTypeDropdownOpen((prev) => !prev)}
                  >
                    <span className={styles.dropdownTriggerText}>
                      {selectedFoodTypes.length > 0
                        ? selectedFoodTypes.join(', ')
                        : 'Select Type'}
                    </span>
                    <ChevronDown size={16} className={styles.selectArrow} />
                  </button>

                  {isFoodTypeDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      {['Veg', 'Non Veg', 'Vegan', 'Jain'].map((type) => {
                        const isSelected = selectedFoodTypes.includes(type);
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
                            <span className={styles.optionLabel}>{type}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Automatic Stock Control */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Automatic Stock</label>
                <div className={styles.stockControlCard}>
                  <span className={styles.itemInStockLabel}>Item in Stock</span>
                  <input
                    type="number"
                    className={styles.stockNumberInput}
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    placeholder="24"
                  />
                  <button
                    type="button"
                    onClick={() => setIsInStock((prev) => !prev)}
                    className={`${styles.toggleSwitch} ${
                      isInStock ? styles.toggleSwitchActive : ''
                    }`}
                    aria-label="Toggle in stock status"
                  >
                    <span
                      className={`${styles.toggleThumb} ${
                        isInStock ? styles.toggleThumbActive : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Field: Description */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Description</label>
              <textarea
                className={styles.textAreaInput}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dish description..."
              />
            </div>

            {/* Variants & Add-Ons Section */}
            <div className={styles.subSection}>
              <label className={styles.subSectionTitle}>Variants & Add-Ons</label>
              <div className={styles.variantsList}>
                {variants.map((variant) => (
                  <div key={variant.id} className={styles.variantRow}>
                    <input
                      type="text"
                      className={styles.variantNameInput}
                      placeholder="Variant / Add-on name"
                      value={variant.name}
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, 'name', e.target.value)
                      }
                    />
                    <div className={styles.variantPriceBadge}>
                      <span>₹{variant.price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(variant.id)}
                      className={styles.deleteVariantBtn}
                      aria-label="Remove variant"
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
                <span>Add Variant</span>
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
                        onChange={(e) =>
                          handleTimeChange(schedule.day, 'openTime', e.target.value)
                        }
                      />
                      <span className={styles.toText}>to</span>
                      <input
                        type="text"
                        className={styles.timeInput}
                        value={schedule.closeTime}
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
              <label className={styles.subSectionTitle}>Dish Image representation</label>
              <label className={styles.uploadDropzone}>
                <input
                  type="file"
                  accept="image/*"
                  className={styles.fileInputHidden}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
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
                      ? imageFile.name
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
                {loading ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </form>
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
