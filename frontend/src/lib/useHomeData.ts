import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from './fetch-api';
import { useLocation } from '@/components/location-provider';
import {
  calculateDistanceKm,
  formatDistance,
  MAX_DELIVERY_RADIUS_KM,
  getPincodeCoordinates,
} from './geo-distance';

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
  sellerLatitude?: number | null;
  sellerLongitude?: number | null;
  sellerIsLocationPinned?: boolean;
  distanceKm?: number;
  distanceText?: string;
  categoryName?: string;
  rating?: number;
  deliveryTime?: string;
  servedPincodes?: string[];
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
  sellerLatitude?: number | null;
  sellerLongitude?: number | null;
  sellerIsLocationPinned?: boolean;
  distanceKm?: number;
  distanceText?: string;
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
  latitude?: number | null;
  longitude?: number | null;
  isLocationPinned?: boolean;
  distanceKm?: number;
  distanceText?: string;
  isOnline: boolean;
  foodType?: string;
  servedPincodes?: string[];
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
            const defaultCoords = getPincodeCoordinates(item.sellerPincode);
            const resolvedLat = item.sellerLatitude ?? defaultCoords?.lat ?? null;
            const resolvedLng = item.sellerLongitude ?? defaultCoords?.lng ?? null;

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
              sellerLatitude: resolvedLat,
              sellerLongitude: resolvedLng,
              sellerIsLocationPinned: item.sellerIsLocationPinned ?? false,
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
            const defaultCoords = getPincodeCoordinates(k.pincode);
            const resolvedLat = k.latitude ?? defaultCoords?.lat ?? null;
            const resolvedLng = k.longitude ?? defaultCoords?.lng ?? null;

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
              latitude: resolvedLat,
              longitude: resolvedLng,
              isLocationPinned: k.isLocationPinned ?? false,
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

            const defaultCoords = getPincodeCoordinates(r.sellerPincode);
            const resolvedLat = r.sellerLatitude ?? defaultCoords?.lat ?? null;
            const resolvedLng = r.sellerLongitude ?? defaultCoords?.lng ?? null;

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
              sellerLatitude: resolvedLat,
              sellerLongitude: resolvedLng,
              sellerIsLocationPinned: r.sellerIsLocationPinned ?? false,
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

  const userLat = defaultAddress?.latitude != null && !isNaN(Number(defaultAddress.latitude)) ? Number(defaultAddress.latitude) : null;
  const userLng = defaultAddress?.longitude != null && !isNaN(Number(defaultAddress.longitude)) ? Number(defaultAddress.longitude) : null;
  const pinFallbackCoords = activePincode ? getPincodeCoordinates(activePincode) : null;
  const activeUserLat = userLat ?? pinFallbackCoords?.lat ?? null;
  const activeUserLng = userLng ?? pinFallbackCoords?.lng ?? null;
  const hasUserCoords = activeUserLat !== null && activeUserLng !== null;

  // Compute enriched food items with accurate distances
  const enrichedFoodItems = useMemo(() => {
    return foodItems.map((item) => {
      if (hasUserCoords && item.sellerLatitude != null && item.sellerLongitude != null) {
        const dist = calculateDistanceKm(activeUserLat!, activeUserLng!, Number(item.sellerLatitude), Number(item.sellerLongitude));
        const estTime = dist <= 1.5 ? "15-20 min" : dist <= 3.0 ? "20-30 min" : "30-40 min";
        return {
          ...item,
          distanceKm: dist,
          distanceText: formatDistance(dist),
          deliveryTime: estTime,
        };
      }
      return item;
    });
  }, [foodItems, hasUserCoords, activeUserLat, activeUserLng]);

  // Compute enriched kitchens with accurate distances
  const enrichedKitchens = useMemo(() => {
    return kitchens.map((k) => {
      if (hasUserCoords && k.latitude != null && k.longitude != null) {
        const dist = calculateDistanceKm(activeUserLat!, activeUserLng!, Number(k.latitude), Number(k.longitude));
        const estTime = dist <= 1.5 ? "15-20 min" : dist <= 3.0 ? "20-30 min" : "30-40 min";
        return {
          ...k,
          distanceKm: dist,
          distanceText: formatDistance(dist),
          time: estTime,
        };
      }
      return k;
    });
  }, [kitchens, hasUserCoords, activeUserLat, activeUserLng]);

  // Helper to check 5 km distance deliverability with pincode fallback
  const isSellerDeliverable = (
    sellerLat?: number | null,
    sellerLng?: number | null,
    sellerPin?: string,
    servedPins?: string[],
    locality?: string,
    landmark?: string
  ) => {
    // 1. If coordinates exist on both sides, strictly enforce 5.0 km radius
    if (hasUserCoords && sellerLat != null && sellerLng != null && !isNaN(Number(sellerLat)) && !isNaN(Number(sellerLng))) {
      const dist = calculateDistanceKm(activeUserLat!, activeUserLng!, Number(sellerLat), Number(sellerLng));
      return dist <= MAX_DELIVERY_RADIUS_KM;
    }
    // 2. Fallback: Pincode serviceability match
    if (activePincode) {
      return isPincodeServiced(activePincode, sellerPin, servedPins, locality, landmark);
    }
    return true;
  };

  // Compute filtered food items based on 5 km distance + filter options
  const filteredFoodItems = useMemo(() => {
    let list = enrichedFoodItems.filter((item) => {
      // 1. Distance / Pincode boundary check (5 km limit)
      if (activePincode || hasUserCoords) {
        const deliverable = isSellerDeliverable(
          item.sellerLatitude,
          item.sellerLongitude,
          item.sellerPincode,
          item.servedPincodes,
          item.sellerLocality,
          item.sellerLandmark
        );
        if (!deliverable) return false;
      }

      if (!options) return true;
      const { searchQuery, category, vegOnly, minPrice, maxPrice, minRating } = options;

      if (vegOnly && (item.itemType === "NON_VEG" || item.itemType?.includes("NON_VEG"))) return false;

      if (category && category !== "all" && category !== "food") {
        const c = category.toLowerCase();
        const matchCat =
          item.categoryName?.toLowerCase().includes(c) ||
          item.name.toLowerCase().includes(c) ||
          item.description.toLowerCase().includes(c);
        if (!matchCat) return false;
      }

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchQuery =
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.sellerName.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q);
        if (!matchQuery) return false;
      }

      if (minPrice !== undefined && item.price < minPrice) return false;
      if (maxPrice !== undefined && item.price > maxPrice) return false;
      if (minRating !== undefined && (item.rating || 0) < minRating) return false;

      return true;
    });

    // Sort: if options.sortBy === "fastest", or by distance closest first when user coords available
    if (options?.sortBy === "fastest") {
      list = [...list].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else if (options?.sortBy === "rating") {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (options?.sortBy === "price_asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (options?.sortBy === "price_desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (hasUserCoords) {
      // Default: sort by distance closest first
      list = [...list].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return list;
  }, [enrichedFoodItems, activePincode, hasUserCoords, activeUserLat, activeUserLng, options]);

  // Compute filtered kitchens based on 5 km distance + filter options
  const filteredKitchens = useMemo(() => {
    let list = enrichedKitchens.filter((k) => {
      // 1. Distance / Pincode boundary check (5 km limit)
      if (activePincode || hasUserCoords) {
        const deliverable = isSellerDeliverable(
          k.latitude,
          k.longitude,
          k.pincode,
          k.servedPincodes,
          k.locality,
          k.landmark
        );
        if (!deliverable) return false;
      }

      if (!options) return true;
      const { searchQuery, category, vegOnly, minRating } = options;

      if (vegOnly && k.foodType === "NON_VEG") return false;

      if (category && category !== "all" && category !== "food" && category !== "rooms") {
        const c = category.toLowerCase();
        const matchCat =
          k.category?.toLowerCase().includes(c) ||
          k.name.toLowerCase().includes(c);
        if (!matchCat) return false;
      }

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchQuery =
          k.name.toLowerCase().includes(q) ||
          k.category?.toLowerCase().includes(q) ||
          k.locality?.toLowerCase().includes(q) ||
          k.city?.toLowerCase().includes(q);
        if (!matchQuery) return false;
      }

      if (minRating !== undefined && (k.rating || 0) < minRating) return false;

      return true;
    });

    // Sort by distance closest first
    if (options?.sortBy === "fastest" || hasUserCoords) {
      list = [...list].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return list;
  }, [enrichedKitchens, activePincode, hasUserCoords, activeUserLat, activeUserLng, options]);

  return {
    categories,
    foodItems: activePincode || hasUserCoords || options ? filteredFoodItems : enrichedFoodItems,
    rooms,
    kitchens: activePincode || hasUserCoords || options ? filteredKitchens : enrichedKitchens,
    coupons,
    promoBanners,
    filteredFoodItems,
    filteredKitchens,
    allFoodItems: enrichedFoodItems,
    allKitchens: enrichedKitchens,
    activePincode,
    hasMatchingKitchens: (activePincode || hasUserCoords) ? filteredKitchens.length > 0 : enrichedKitchens.length > 0,
    totalKitchensCount: enrichedKitchens.length,
    isLoading,
    error,
    isUsingFallback,
  };
}
