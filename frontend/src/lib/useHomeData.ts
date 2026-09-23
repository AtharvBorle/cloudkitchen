import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from './fetch-api';
import { useLocation } from '@/components/location-provider';

export interface DynamicCategory {
  id: string;
  name: string;
  image?: string | null;
  emoji?: string;
  route: string;
}

export interface DynamicFoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  itemType: 'VEG' | 'NON_VEG' | string;
  isAvailable: boolean;
  sellerId: string;
  sellerName: string;
  sellerCity?: string;
  sellerPincode?: string;
  sellerLocality?: string;
  sellerLandmark?: string;
  sellerTrackingId?: string;
  sellerIsOnline?: boolean;
  sellerFoodType?: string;
  categoryName?: string;
  rating?: number;
  deliveryTime?: string;
  servedPincodes?: string[];
  distanceKm?: number;
  isWithin5km?: boolean;
}

export interface DynamicRoom {
  id: string;
  title: string;
  price: number;
  description: string;
  capacity: number;
  images: string[];
  isAvailable: boolean;
  sellerId: string;
  sellerName: string;
  sellerCity?: string;
  sellerPincode?: string;
  sellerLocality?: string;
  sellerTrackingId?: string;
}

export interface DynamicCoupon {
  id: string;
  code: string;
  description: string;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  minimumCartValue?: number | null;
}

export interface DynamicPromoBanner {
  id: string;
  title: string;
  desktopImageUrl: string;
  mobileImageUrl?: string | null;
  redirectUrl?: string | null;
  displayOrder: number;
}

export interface DynamicKitchen {
  id: string;
  name: string;
  trackingId: string;
  rating: number;
  reviewsCount?: number;
  time: string;
  imageUrl: string;
  category: string;
  locality?: string;
  city?: string;
  pincode?: string;
  isOnline: boolean;
  foodType?: string;
  servedPincodes?: string[];
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  isWithin5km?: boolean;
}

export interface HomeDataFilterOptions {
  searchQuery?: string;
  category?: string;
  vegOnly?: boolean;
  pincode?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "fastest" | "rating" | "price_asc" | "price_desc";
}

export interface HomeDataState {
  categories: DynamicCategory[];
  foodItems: DynamicFoodItem[];
  rooms: DynamicRoom[];
  kitchens: DynamicKitchen[];
  coupons: DynamicCoupon[];
  promoBanners: DynamicPromoBanner[];
  filteredFoodItems: DynamicFoodItem[];
  filteredKitchens: DynamicKitchen[];
  allFoodItems: DynamicFoodItem[];
  allKitchens: DynamicKitchen[];
  activePincode: string | null;
  hasMatchingKitchens: boolean;
  totalKitchensCount: number;
  isLoading: boolean;
  error: string | null;
  isUsingFallback: boolean;
}

export const PINCODE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "411001": { lat: 18.5204, lng: 73.8567 }, // Pune Station / Camp / Shaniwar Peth
  "411002": { lat: 18.5135, lng: 73.8553 }, // Shukrawar Peth / Budhwar Peth
  "411004": { lat: 18.5175, lng: 73.8398 }, // Deccan Gymkhana / FC Road
  "411005": { lat: 18.5308, lng: 73.8475 }, // Shivajinagar
  "411006": { lat: 18.5492, lng: 73.8967 }, // Yerwada / Kalyani Nagar
  "411007": { lat: 18.5626, lng: 73.8087 }, // Aundh
  "411011": { lat: 18.5262, lng: 73.8683 }, // Kasba Peth / Rasta Peth
  "411014": { lat: 18.5679, lng: 73.9143 }, // Viman Nagar
  "411016": { lat: 18.5293, lng: 73.8344 }, // Model Colony / Gokhalenagar
  "411028": { lat: 18.5089, lng: 73.9260 }, // Hadapsar / Magarpatta
  "411030": { lat: 18.5080, lng: 73.8490 }, // Sadashiv Peth / Narayan Peth
  "411038": { lat: 18.5074, lng: 73.8077 }, // Kothrud / Paud Road / Karve Road
  "411041": { lat: 18.4680, lng: 73.8180 }, // Vadgaon Budruk / Sinhagad Road
  "411045": { lat: 18.5590, lng: 73.7868 }, // Baner / Balewadi
  "411048": { lat: 18.4710, lng: 73.8790 }, // Kondhwa
  "411051": { lat: 18.4960, lng: 73.8390 }, // Dattawadi / Parvati / Sahakar Nagar
  "411052": { lat: 18.4900, lng: 73.8200 }, // Karve Nagar / Hingne
  "411057": { lat: 18.5913, lng: 73.7389 }, // Hinjawadi / Wakad
  "411058": { lat: 18.4480, lng: 73.8560 }, // Katraj / Dhankawadi
};

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function useHomeData(options?: HomeDataFilterOptions): HomeDataState {
  const { defaultAddress } = useLocation();
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [foodItems, setFoodItems] = useState<DynamicFoodItem[]>([]);
  const [rooms, setRooms] = useState<DynamicRoom[]>([]);
  const [kitchens, setKitchens] = useState<DynamicKitchen[]>([]);
  const [coupons, setCoupons] = useState<DynamicCoupon[]>([]);
  const [promoBanners, setPromoBanners] = useState<DynamicPromoBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);

        const explorePromise = fetchApi('/api/public/explore')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const categoriesPromise = fetchApi('/api/public/categories')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const couponsPromise = fetchApi('/api/public/coupons?sellerId=none')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const bannersPromise = fetchApi('/api/public/promo-banners')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const [exploreRes, categoriesRes, couponsRes, bannersRes] = await Promise.all([
          explorePromise,
          categoriesPromise,
          couponsPromise,
          bannersPromise,
        ]);

        if (!isMounted) return;

        const CATEGORY_IMAGE_MAP: Record<string, string> = {
          food: "/images/categories/cat-food.png",
          mess: "/images/categories/cat-mess.png",
          bakery: "/images/categories/cat-backery.png",
          "home meals": "/images/categories/cat-homemeals.png",
          homemeals: "/images/categories/cat-homemeals.png",
          healthy: "/images/categories/cat-healthy.png",
          snacks: "/images/categories/cat-snacks.png",
          desserts: "/images/categories/cat-deserts.png",
          dessert: "/images/categories/cat-deserts.png",
          drink: "/images/categories/cat-drink.png",
          drinks: "/images/categories/cat-drink.png",
          rooms: "/images/categories/cat-rooms.png",
        };

        // 1. Process Categories
        const dbCategories: DynamicCategory[] = [];
        dbCategories.push({
          id: "food",
          name: "Food",
          image: "/images/categories/cat-food.png",
          emoji: "🍔",
          route: "/explore-desktop",
        });

        if (exploreRes?.foodCategories && Array.isArray(exploreRes.foodCategories) && exploreRes.foodCategories.length > 0) {
          exploreRes.foodCategories.forEach((fc: any) => {
            const lower = (fc.name || "").toLowerCase().trim();
            if (lower && lower !== "food" && lower !== "rooms") {
              const mappedImage = CATEGORY_IMAGE_MAP[lower] || fc.imageUrl || "/images/categories/cat-food.png";
              dbCategories.push({
                id: fc.id || lower,
                name: fc.name,
                image: mappedImage,
                emoji: "🍽️",
                route: "/explore-desktop?category=" + encodeURIComponent(lower),
              });
            }
          });
        } else if (categoriesRes?.categories && Array.isArray(categoriesRes.categories) && categoriesRes.categories.length > 0) {
          categoriesRes.categories.forEach((cat: any) => {
            const lower = (cat.name || "").toLowerCase().trim();
            if (lower && lower !== "food" && lower !== "rooms") {
              const mappedImage = CATEGORY_IMAGE_MAP[lower] || "/images/categories/cat-food.png";
              dbCategories.push({
                id: cat.id || lower,
                name: cat.name,
                image: mappedImage,
                emoji: "🍲",
                route: "/explore-desktop?category=" + encodeURIComponent(lower),
              });
            }
          });
        }

        // Add rooms if not present
        if (!dbCategories.some((c) => c.id === "rooms" || c.name.toLowerCase() === "rooms")) {
          dbCategories.push({
            id: "rooms",
            name: "Rooms",
            image: "/images/categories/cat-rooms.png",
            emoji: "🛏️",
            route: "/room-booking",
          });
        }

        setCategories(dbCategories);

        // 2. Process Food Items & Kitchens
        const rawFoodItems: DynamicFoodItem[] = [];
        const kitchenMap = new Map<string, DynamicKitchen>();

        if (exploreRes?.foodItems && Array.isArray(exploreRes.foodItems) && exploreRes.foodItems.length > 0) {
          exploreRes.foodItems.forEach((item: any) => {
            const foodItem: DynamicFoodItem = {
              id: item.id,
              name: item.name,
              description: item.description || '',
              price: item.price || 0,
              imageUrl: item.imageUrl || null,
              itemType: item.itemType || 'VEG',
              isAvailable: item.isAvailable !== false,
              sellerId: item.sellerId,
              sellerName: item.sellerName || 'Cloud Kitchen',
              sellerCity: item.sellerCity,
              sellerPincode: item.sellerPincode,
              sellerLocality: item.sellerLocality,
              sellerLandmark: item.sellerLandmark,
              sellerTrackingId: item.sellerTrackingId,
              sellerIsOnline: item.sellerIsOnline !== false,
              sellerFoodType: item.sellerFoodType || 'BOTH',
              categoryName: item.foodCategory?.name || item.category?.name || 'Food',
              rating: item.rating || 5.0,
              deliveryTime: item.deliveryTime || '20-30 min',
              servedPincodes: item.servedPincodes || [],
            };
            rawFoodItems.push(foodItem);
          });
        }

        if (exploreRes?.kitchens && Array.isArray(exploreRes.kitchens) && exploreRes.kitchens.length > 0) {
          exploreRes.kitchens.forEach((k: any) => {
            kitchenMap.set(k.id, {
              id: k.id,
              name: k.name,
              trackingId: k.trackingId || k.id,
              rating: k.rating || 5.0,
              reviewsCount: k.reviewsCount || 0,
              time: k.time || '20-30 min',
              imageUrl: k.imageUrl || '',
              category: k.type || (k.foodType === 'VEG' ? 'Pure Veg' : 'Cloud Kitchen'),
              locality: k.locality,
              city: k.city,
              pincode: k.pincode,
              isOnline: k.isOnline !== false,
              foodType: k.foodType,
              servedPincodes: k.servedPincodes || [],
            });
          });
        }

        setFoodItems(rawFoodItems);
        setKitchens(Array.from(kitchenMap.values()));
        setIsUsingFallback(false);

        // 3. Process Rooms
        const rawRooms: DynamicRoom[] = [];
        if (exploreRes?.availableRooms && Array.isArray(exploreRes.availableRooms)) {
          exploreRes.availableRooms.forEach((r: any) => {
            let parsedImages: string[] = [];
            if (typeof r.images === 'string') {
              try {
                parsedImages = JSON.parse(r.images);
              } catch {
                parsedImages = [r.images];
              }
            } else if (Array.isArray(r.images)) {
              parsedImages = r.images;
            }

            rawRooms.push({
              id: r.id,
              title: r.title || 'Room',
              price: r.price || 0,
              description: r.description || '',
              capacity: r.capacity || 1,
              images: parsedImages,
              isAvailable: r.isAvailable !== false,
              sellerId: r.sellerId,
              sellerName: r.sellerName || '',
              sellerCity: r.sellerCity,
              sellerPincode: r.sellerPincode,
              sellerLocality: r.sellerLocality,
              sellerTrackingId: r.sellerTrackingId,
            });
          });
        }
        setRooms(rawRooms);

        // 4. Process Coupons
        const rawCoupons: DynamicCoupon[] = [];
        if (Array.isArray(couponsRes) && couponsRes.length > 0) {
          couponsRes.forEach((c: any) => {
            rawCoupons.push({
              id: c.id,
              code: c.code,
              description: c.description || '',
              discountPercentage: c.discountPercentage,
              discountAmount: c.discountAmount,
              minimumCartValue: c.minimumCartValue,
            });
          });
        }
        setCoupons(rawCoupons);

        // 5. Process Promo Banners
        const rawBanners: DynamicPromoBanner[] = [];
        const fetchedBanners = bannersRes?.data?.banners || bannersRes?.banners;
        if (Array.isArray(fetchedBanners) && fetchedBanners.length > 0) {
          fetchedBanners.forEach((b: any) => {
            rawBanners.push({
              id: b.id,
              title: b.title,
              desktopImageUrl: b.desktopImageUrl,
              mobileImageUrl: b.mobileImageUrl,
              redirectUrl: b.redirectUrl || '/explore-desktop',
              displayOrder: b.displayOrder || 0,
            });
          });
        }
        setPromoBanners(rawBanners);
        setError(null);
      } catch (err: any) {
        if (isMounted) {
          console.error('Error loading home data:', err);
          setError(err?.message || 'Failed to load live data');
          setIsUsingFallback(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to check if a kitchen/dish serves or belongs to a pincode
  const isPincodeServiced = (
    targetPin: string,
    mainPincode?: string,
    servedPincodes?: string[],
    locality?: string,
    landmark?: string
  ): boolean => {
    const cleanPin = targetPin.trim();
    if (!cleanPin) return true;

    // 1. Direct registered / seller pincode match
    if (mainPincode && mainPincode.trim() === cleanPin) return true;

    // 2. Served operational pincodes match
    if (Array.isArray(servedPincodes)) {
      for (const sp of servedPincodes) {
        if (typeof sp === 'string') {
          const clean = sp.trim();
          if (clean === cleanPin || clean.includes(cleanPin)) return true;
        }
      }
    }

    // 3. 6-digit pincode contained in address locality or landmark text
    if (locality) {
      const locPins = locality.match(/\b\d{6}\b/g);
      if (locPins && locPins.includes(cleanPin)) return true;
    }
    if (landmark) {
      const landPins = landmark.match(/\b\d{6}\b/g);
      if (landPins && landPins.includes(cleanPin)) return true;
    }

    return false;
  };

  // Compute active pincode from filter options or active location
  const activePincode = (options?.pincode || defaultAddress?.pincode || '').trim() || null;

  // Resolve user coordinates from active address GPS or active pincode center
  const userLat = defaultAddress?.latitude ?? (activePincode ? PINCODE_COORDINATES[activePincode]?.lat : undefined);
  const userLng = defaultAddress?.longitude ?? (activePincode ? PINCODE_COORDINATES[activePincode]?.lng : undefined);

  // Compute filtered food items based on 5km radius + pincode matching + options
  const filteredFoodItems = useMemo(() => {
    const list: Array<DynamicFoodItem & { distanceKm?: number; isWithin5km?: boolean }> = [];

    foodItems.forEach((item) => {
      const kLat = item.sellerPincode ? PINCODE_COORDINATES[item.sellerPincode]?.lat : undefined;
      const kLng = item.sellerPincode ? PINCODE_COORDINATES[item.sellerPincode]?.lng : undefined;

      let distanceKm: number | undefined;
      let isWithin5km = false;

      if (userLat !== undefined && userLng !== undefined && kLat !== undefined && kLng !== undefined) {
        distanceKm = calculateDistanceKm(userLat, userLng, kLat, kLng);
        if (distanceKm <= 5.0) {
          isWithin5km = true;
        }
      }

      const isPinMatched = activePincode
        ? isPincodeServiced(
            activePincode,
            item.sellerPincode,
            item.servedPincodes,
            item.sellerLocality,
            item.sellerLandmark
          )
        : true;

      // Match if within 5km radius OR explicitly matching/serving the pincode
      if (activePincode && !isWithin5km && !isPinMatched) {
        return;
      }

      if (options) {
        const { searchQuery, category, vegOnly, minPrice, maxPrice, minRating } = options;

        if (vegOnly && (item.itemType === "NON_VEG" || item.itemType?.includes("NON_VEG"))) return;

        if (category && category !== "all" && category !== "food") {
          const c = category.toLowerCase();
          const matchCat =
            item.categoryName?.toLowerCase().includes(c) ||
            item.name.toLowerCase().includes(c) ||
            item.description.toLowerCase().includes(c);
          if (!matchCat) return;
        }

        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchQuery =
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.sellerName.toLowerCase().includes(q) ||
            item.categoryName?.toLowerCase().includes(q);
          if (!matchQuery) return;
        }

        if (minPrice !== undefined && item.price < minPrice) return;
        if (maxPrice !== undefined && item.price > maxPrice) return;
        if (minRating !== undefined && (item.rating || 0) < minRating) return;
      }

      list.push({
        ...item,
        distanceKm,
        isWithin5km,
      });
    });

    return list.sort((a, b) => {
      if (a.isWithin5km && !b.isWithin5km) return -1;
      if (!a.isWithin5km && b.isWithin5km) return 1;
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [foodItems, activePincode, userLat, userLng, options]);

  // Compute filtered kitchens based on 5km radius + pincode matching + options
  const filteredKitchens = useMemo(() => {
    const list: Array<DynamicKitchen & { distanceKm?: number; isWithin5km?: boolean }> = [];

    kitchens.forEach((k) => {
      const kLat = k.latitude ?? (k.pincode ? PINCODE_COORDINATES[k.pincode]?.lat : undefined);
      const kLng = k.longitude ?? (k.pincode ? PINCODE_COORDINATES[k.pincode]?.lng : undefined);

      let distanceKm: number | undefined;
      let isWithin5km = false;

      if (userLat !== undefined && userLng !== undefined && kLat !== undefined && kLng !== undefined) {
        distanceKm = calculateDistanceKm(userLat, userLng, kLat, kLng);
        if (distanceKm <= 5.0) {
          isWithin5km = true;
        }
      }

      // 1. Pincode / Service area check
      const isPinMatched = activePincode
        ? isPincodeServiced(activePincode, k.pincode, k.servedPincodes, k.locality, k.landmark)
        : true;

      // Match if within 5km radius OR explicitly matching/serving the pincode
      if (activePincode && !isWithin5km && !isPinMatched) {
        return;
      }

      if (options) {
        const { searchQuery, category, vegOnly, minRating } = options;

        if (vegOnly && k.foodType === "NON_VEG") return;

        if (category && category !== "all" && category !== "food" && category !== "rooms") {
          const c = category.toLowerCase();
          const matchCat =
            k.category?.toLowerCase().includes(c) ||
            k.name.toLowerCase().includes(c);
          if (!matchCat) return;
        }

        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchQuery =
            k.name.toLowerCase().includes(q) ||
            k.category?.toLowerCase().includes(q) ||
            k.locality?.toLowerCase().includes(q) ||
            k.city?.toLowerCase().includes(q);
          if (!matchQuery) return;
        }

        if (minRating !== undefined && (k.rating || 0) < minRating) return;
      }

      list.push({
        ...k,
        distanceKm,
        isWithin5km,
      });
    });

    return list.sort((a, b) => {
      if (a.isWithin5km && !b.isWithin5km) return -1;
      if (!a.isWithin5km && b.isWithin5km) return 1;
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [kitchens, activePincode, userLat, userLng, options]);

  return {
    categories,
    foodItems: activePincode || options ? filteredFoodItems : foodItems,
    rooms,
    kitchens: activePincode || options ? filteredKitchens : kitchens,
    coupons,
    promoBanners,
    filteredFoodItems,
    filteredKitchens,
    allFoodItems: foodItems,
    allKitchens: kitchens,
    activePincode,
    hasMatchingKitchens: activePincode ? filteredKitchens.length > 0 : kitchens.length > 0,
    totalKitchensCount: kitchens.length,
    isLoading,
    error,
    isUsingFallback,
  };
}
