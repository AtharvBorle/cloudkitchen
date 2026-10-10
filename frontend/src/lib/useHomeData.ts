import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from './fetch-api';
import { useLocation } from '@/components/location-provider';
import {
  calculateDistanceKm,
  formatDistance,
  MAX_DELIVERY_RADIUS_KM,
  getPincodeCoordinates,
} from './geo-distance';
import { extractRoomPropertyLocation, cleanRoomAboutText } from './room-location-helper';

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
  stockQuantity?: number;
  maxStock?: number;
  rating?: number;
  totalRatings?: number;
  reviewsCount?: number;
  deliveryTime?: string;
  servedPincodes?: string[];
  sellerDeliveryRadiusKm?: number;
  isWithin5km?: boolean;
  addons?: any;
  variants?: any;
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
  sellerLandmark?: string;
  sellerTrackingId?: string;
  sellerLatitude?: number | null;
  sellerLongitude?: number | null;
  sellerIsLocationPinned?: boolean;
  sellerDeliveryRadiusKm?: number;
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
  appliesToSellerId?: string | null;
  appliesToProductId?: string | null;
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
  landmark?: string;
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
  deliveryRadiusKm?: number;
  isWithin5km?: boolean;
}

export interface DynamicCuratedReel {
  id: string;
  instagramMediaId: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink?: string;
  caption: string;
  likeCount?: number;
  commentsCount?: number;
  displayOrder: number;
  categoryTag?: string | null;
  customTitle?: string | null;
  customSubtitle?: string | null;
  redirectType: "KITCHEN" | "DISH" | "CUSTOM_URL" | "NONE" | string;
  customRedirectUrl?: string | null;
  seller?: {
    id: string;
    name: string;
    trackingId: string;
    locality?: string;
    imageUrl?: string;
    rating?: number;
    reviewsCount?: number;
  } | null;
  foodItem?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
    itemType: string;
  } | null;
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
  reels: DynamicCuratedReel[];
  filteredFoodItems: DynamicFoodItem[];
  filteredKitchens: DynamicKitchen[];
  allFoodItems: DynamicFoodItem[];
  allKitchens: DynamicKitchen[];
  activePincode: string | null;
  isDirectlyDeliverable?: boolean;
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
  const [reels, setReels] = useState<DynamicCuratedReel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData(isBackground = false) {
      try {
        if (!isBackground) {
          setIsLoading(true);
        }

        const explorePromise = fetchApi('/api/public/explore')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const categoriesPromise = fetchApi('/api/public/categories')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const couponsPromise = fetchApi('/api/public/coupons')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const bannersPromise = fetchApi('/api/public/promo-banners')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const reelsPromise = fetchApi('/api/public/reels')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const [exploreRes, categoriesRes, couponsRes, bannersRes, reelsRes] = await Promise.all([
          explorePromise,
          categoriesPromise,
          couponsPromise,
          bannersPromise,
          reelsPromise,
        ]);

        if (!isMounted) return;

        const CATEGORY_IMAGE_MAP: Record<string, string> = {
          food: "/images/categories/cat-food.png",
          mess: "/images/categories/cat-mess.png",
          tiffin: "/images/categories/cat-mess.png",
          dabba: "/images/categories/cat-mess.png",
          bakery: "/images/categories/cat-bakery.png",
          backery: "/images/categories/cat-bakery.png",
          healthy: "/images/categories/cat-healthy.png",
          snacks: "/images/categories/cat-snacks.png",
          snack: "/images/categories/cat-snacks.png",
          desserts: "/images/categories/cat-deserts.png",
          dessert: "/images/categories/cat-deserts.png",
          deserts: "/images/categories/cat-deserts.png",
          drink: "/images/categories/cat-drink.png",
          drinks: "/images/categories/cat-drink.png",
          beverage: "/images/categories/cat-drink.png",
          beverages: "/images/categories/cat-drink.png",
          shake: "/images/categories/cat-shake.png",
          shakes: "/images/categories/cat-shake.png",
          rooms: "/images/categories/cat-rooms.png",
          room: "/images/categories/cat-rooms.png",
          "rent property": "/images/categories/cat-rentproperty.png",
          rentproperty: "/images/categories/cat-rentproperty.png",
          property: "/images/categories/cat-rentproperty.png",
          cafe: "/images/categories/cat-cafe.png",
          coffee: "/images/categories/cat-cafe.png",
          burger: "/images/categories/cat-burger.png",
          burgers: "/images/categories/cat-burger.png",
          cake: "/images/categories/cat-cake.png",
          cakes: "/images/categories/cat-cake.png",
          pastry: "/images/categories/cat-cake.png",
          pastries: "/images/categories/cat-cake.png",
          meal: "/images/categories/cat-meal.png",
          meals: "/images/categories/cat-meal.png",
          thali: "/images/categories/cat-meal.png",
          "home meals": "/images/categories/cat-meal.png",
          homemeals: "/images/categories/cat-meal.png",
          "homely food": "/images/categories/cat-meal.png",
          homelyfood: "/images/categories/cat-meal.png",
          "lunch(homely food)": "/images/categories/cat-meal.png",
          lunch: "/images/categories/cat-meal.png",
          "south indian": "/images/categories/cat-southindian.png",
          southindian: "/images/categories/cat-southindian.png",
          dosa: "/images/categories/cat-southindian.png",
          idli: "/images/categories/cat-southindian.png",
          pizza: "/images/categories/cat-pizza.png",
          pizzas: "/images/categories/cat-pizza.png",
          dalrice: "/images/categories/cat-dalrice.png",
          "dal rice": "/images/categories/cat-dalrice.png",
          "dal-rice": "/images/categories/cat-dalrice.png",
          khichdi: "/images/categories/cat-dalrice.png",
          "dal khichdi": "/images/categories/cat-dalrice.png",
          pohe: "/images/categories/cat-pohe.png",
          poha: "/images/categories/cat-pohe.png",
          sabudana: "/images/categories/cat-sabudana.png",
          shira: "/images/categories/cat-sheera.png",
          sheera: "/images/categories/cat-sheera.png",
          upma: "/images/categories/cat-upma.png",
        };

        const getCustomCategoryIcon = (key: string, name: string): string => {
          const k = key.toLowerCase();
          const n = name.toLowerCase();
          if (k.includes("poh") || n.includes("poh")) return "/images/categories/cat-pohe.png";
          if (k.includes("sabudana") || n.includes("sabudana")) return "/images/categories/cat-sabudana.png";
          if (k.includes("shir") || k.includes("sheer") || n.includes("shir") || n.includes("sheer")) return "/images/categories/cat-sheera.png";
          if (k.includes("upma") || n.includes("upma")) return "/images/categories/cat-upma.png";
          if (k.includes("southindian") || k.includes("dosa") || k.includes("idli") || n.includes("south indian") || n.includes("dosa")) return "/images/categories/cat-southindian.png";
          if (k.includes("cafe") || k.includes("coffee") || n.includes("cafe")) return "/images/categories/cat-cafe.png";
          if (k.includes("property") || k.includes("rent") || n.includes("rent property")) return "/images/categories/cat-rentproperty.png";
          if (k.includes("baker") || n.includes("bakery")) return "/images/categories/cat-bakery.png";
          if (k.includes("cake") || k.includes("pastry") || n.includes("cake")) return "/images/categories/cat-cake.png";
          if (k.includes("burger") || n.includes("burger")) return "/images/categories/cat-burger.png";
          if (k.includes("pizza") || n.includes("pizza")) return "/images/categories/cat-pizza.png";
          if (k.includes("dalrice") || k.includes("khichdi") || n.includes("dal rice") || n.includes("dalrice")) return "/images/categories/cat-dalrice.png";
          if (k.includes("meal") || k.includes("homely") || k.includes("lunch") || k.includes("thali") || n.includes("homely food") || n.includes("lunch")) return "/images/categories/cat-meal.png";
          if (k.includes("mess") || k.includes("tiffin") || k.includes("dabba") || n.includes("mess")) return "/images/categories/cat-mess.png";
          if (k.includes("health") || n.includes("healthy")) return "/images/categories/cat-healthy.png";
          if (k.includes("snack") || n.includes("snacks")) return "/images/categories/cat-snacks.png";
          if (k.includes("desert") || k.includes("dessert") || n.includes("dessert")) return "/images/categories/cat-deserts.png";
          if (k.includes("shake") || n.includes("shake")) return "/images/categories/cat-shake.png";
          if (k.includes("drink") || k.includes("beverage") || n.includes("drink")) return "/images/categories/cat-drink.png";
          if (k.includes("room") || n.includes("room")) return "/images/categories/cat-rooms.png";
          return "/images/categories/cat-food.png";
        };

        const getCustomCategoryEmoji = (key: string): string => {
          if (key.includes("poh")) return "🥣";
          if (key.includes("sabudana")) return "🥣";
          if (key.includes("shir") || key.includes("sheer")) return "🍮";
          if (key.includes("upma")) return "🥣";
          if (key.includes("southindian") || key.includes("dosa") || key.includes("idli")) return "🥞";
          if (key.includes("cafe") || key.includes("coffee")) return "☕";
          if (key.includes("property") || key.includes("rent")) return "🏠";
          if (key.includes("baker")) return "🥖";
          if (key.includes("cake") || key.includes("pastry")) return "🍰";
          if (key.includes("burger")) return "🍔";
          if (key.includes("pizza")) return "🍕";
          if (key.includes("dal")) return "🍛";
          if (key.includes("meal") || key.includes("thali") || key.includes("lunch") || key.includes("homely")) return "🍱";
          if (key.includes("mess") || key.includes("tiffin")) return "🍱";
          if (key.includes("health")) return "🥗";
          if (key.includes("snack")) return "🍟";
          if (key.includes("desert") || key.includes("dessert")) return "🍨";
          if (key.includes("shake")) return "🥤";
          if (key.includes("drink") || key.includes("beverage")) return "🧃";
          if (key.includes("room")) return "🛏️";
          return "🍽️";
        };

        // 1. Process Categories (Deduplicated)
        const categoryMap = new Map<string, DynamicCategory>();
        categoryMap.set("food", {
          id: "food",
          name: "Food",
          image: "/images/categories/cat-food.png",
          emoji: "🍔",
          route: "/food-explore",
        });

        const processCatEntry = (fc: any) => {
          if (!fc || !fc.name) return;
          const rawName = String(fc.name).trim();
          const lower = rawName.toLowerCase();
          const cleanKey = lower.replace(/[\s\-_]+/g, "");
          if (!lower) return;
          const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          const isMismatchedImg = fc.imageUrl && String(fc.imageUrl).includes("zwy6klrcbxepkcjr1big");
          const customFallback = getCustomCategoryIcon(cleanKey, rawName);

          const dynamicImage =
            fc.imageUrl && !isMismatchedImg
              ? String(fc.imageUrl).trim()
              : fc.image && !isMismatchedImg
              ? String(fc.image).trim()
              : null;

          // Special case: Food
          if (lower === "food") {
            const existingFood = categoryMap.get("food");
            if (dynamicImage && existingFood) {
              categoryMap.set("food", {
                ...existingFood,
                id: fc.id || existingFood.id,
                image: dynamicImage,
              });
            }
            return;
          }

          // Special case: Rooms
          if (lower === "rooms" || lower === "room") {
            const existingRooms = categoryMap.get("rooms");
            categoryMap.set("rooms", {
              id: fc.id || existingRooms?.id || "rooms",
              name: "Rooms",
              image: dynamicImage || existingRooms?.image || "/images/categories/cat-rooms.png",
              emoji: "🛏️",
              route: "/room-booking",
            });
            return;
          }

          // Dynamic image takes priority over static hardcoded fallback
          const mappedImage =
            dynamicImage ||
            (isMismatchedImg
              ? "/images/categories/cat-meal.png"
              : CATEGORY_IMAGE_MAP[lower] ||
                CATEGORY_IMAGE_MAP[cleanKey] ||
                customFallback);

          const existing = categoryMap.get(lower);

          if (!existing) {
            categoryMap.set(lower, {
              id: fc.id || lower,
              name: displayName,
              image: mappedImage,
              emoji: getCustomCategoryEmoji(cleanKey),
              route: "/food-explore?category=" + encodeURIComponent(lower),
            });
          } else {
            categoryMap.set(lower, {
              ...existing,
              id: fc.id || existing.id,
              name: displayName,
              image: dynamicImage || existing.image || mappedImage,
              route: existing.route || `/food-explore?category=${encodeURIComponent(lower)}`,
            });
          }
        };

        if (exploreRes?.foodCategories && Array.isArray(exploreRes.foodCategories) && exploreRes.foodCategories.length > 0) {
          exploreRes.foodCategories.forEach(processCatEntry);
        }
        if (categoriesRes?.foodCategories && Array.isArray(categoriesRes.foodCategories) && categoriesRes.foodCategories.length > 0) {
          categoriesRes.foodCategories.forEach(processCatEntry);
        }
        if (categoriesRes?.categories && Array.isArray(categoriesRes.categories) && categoriesRes.categories.length > 0) {
          categoriesRes.categories.forEach(processCatEntry);
        } else if (Array.isArray(categoriesRes) && categoriesRes.length > 0) {
          categoriesRes.forEach(processCatEntry);
        }

        // Add rooms if not present
        if (!categoryMap.has("rooms")) {
          categoryMap.set("rooms", {
            id: "rooms",
            name: "Rooms",
            image: "/images/categories/cat-rooms.png",
            emoji: "🛏️",
            route: "/room-booking",
          });
        }

        const dbCategories: DynamicCategory[] = Array.from(categoryMap.values());
        setCategories(dbCategories);

        // 2. Process Food Items & Kitchens
        const rawFoodItems: DynamicFoodItem[] = [];
        const kitchenMap = new Map<string, DynamicKitchen>();

        const explorePayload = exploreRes?.data || exploreRes;

        if (explorePayload?.foodItems && Array.isArray(explorePayload.foodItems) && explorePayload.foodItems.length > 0) {
          explorePayload.foodItems.forEach((item: any) => {
            const defaultCoords = getPincodeCoordinates(item.sellerPincode);
            const resolvedLat = item.sellerLatitude ?? defaultCoords?.lat ?? null;
            const resolvedLng = item.sellerLongitude ?? defaultCoords?.lng ?? null;

            const rawStock = item.stockQuantity !== undefined && item.stockQuantity !== null
              ? Number(item.stockQuantity)
              : (item.maxStock !== undefined && item.maxStock !== null ? Number(item.maxStock) : -1);

            const foodItem: DynamicFoodItem = {
              id: item.id,
              name: item.name,
              description: item.description || '',
              price: item.price || 0,
              imageUrl: item.imageUrl || null,
              itemType: item.itemType || 'VEG',
              isAvailable: item.isAvailable !== false && rawStock !== 0,
              stockQuantity: rawStock,
              maxStock: rawStock,
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
              rating: typeof item.rating === "number" ? item.rating : (typeof item.averageRating === "number" ? item.averageRating : (Array.isArray(item.itemRatings) && item.itemRatings.length > 0 ? item.itemRatings.reduce((sum: number, r: any) => sum + (Number(r?.rating) || 0), 0) / item.itemRatings.length : 0)),
              totalRatings: typeof item.totalRatings === "number" ? item.totalRatings : (Array.isArray(item.itemRatings) ? item.itemRatings.length : 0),
              reviewsCount: typeof item.reviewsCount === "number" ? item.reviewsCount : (typeof item.totalRatings === "number" ? item.totalRatings : 0),
              deliveryTime: item.deliveryTime || '20-30 min',
              servedPincodes: item.servedPincodes || [],
              sellerDeliveryRadiusKm: item.sellerDeliveryRadiusKm !== undefined && item.sellerDeliveryRadiusKm !== null ? Number(item.sellerDeliveryRadiusKm) : (item.deliveryRadiusKm !== undefined && item.deliveryRadiusKm !== null ? Number(item.deliveryRadiusKm) : 5.0),
              addons: item.addons || item.variants || [],
              variants: item.variants || item.addons || [],
            };
            rawFoodItems.push(foodItem);
          });
        }

        if (explorePayload?.kitchens && Array.isArray(explorePayload.kitchens) && explorePayload.kitchens.length > 0) {
          explorePayload.kitchens.forEach((k: any) => {
            const defaultCoords = getPincodeCoordinates(k.pincode);
            const resolvedLat = k.latitude ?? defaultCoords?.lat ?? null;
            const resolvedLng = k.longitude ?? defaultCoords?.lng ?? null;

            kitchenMap.set(k.id, {
              id: k.id,
              name: k.name,
              trackingId: k.trackingId || k.id,
              rating: typeof k.rating === "number" ? k.rating : (typeof k.averageRating === "number" ? k.averageRating : 0),
              reviewsCount: typeof k.reviewsCount === "number" ? k.reviewsCount : (typeof k.totalReviews === "number" ? k.totalReviews : 0),
              time: k.time || '20-30 min',
              imageUrl: k.imageUrl || '',
              category: k.type || ((k.foodType === 'VEG' || k.foodType === 'PURE_VEG' || k.foodType === 'VEG_ONLY') ? 'Pure Veg' : 'Cloud Kitchen'),
              locality: k.locality,
              city: k.city,
              pincode: k.pincode,
              latitude: resolvedLat,
              longitude: resolvedLng,
              isLocationPinned: k.isLocationPinned ?? false,
              isOnline: k.isOnline !== false,
              foodType: k.foodType,
              servedPincodes: k.servedPincodes || [],
              deliveryRadiusKm: k.deliveryRadiusKm !== undefined && k.deliveryRadiusKm !== null ? Number(k.deliveryRadiusKm) : (k.sellerDeliveryRadiusKm !== undefined && k.sellerDeliveryRadiusKm !== null ? Number(k.sellerDeliveryRadiusKm) : 5.0),
            });
          });
        }

        setFoodItems(rawFoodItems);
        setKitchens(Array.from(kitchenMap.values()));
        setIsUsingFallback(false);

        // 3. Process Rooms
        const rawRooms: DynamicRoom[] = [];
        if (explorePayload?.availableRooms && Array.isArray(explorePayload.availableRooms)) {
          explorePayload.availableRooms.forEach((r: any) => {
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

            const loc = extractRoomPropertyLocation(r.description, r.about, {
              locality: r.sellerLocality,
              city: r.sellerCity,
              pincode: r.sellerPincode,
              landmark: r.sellerLandmark,
              latitude: r.sellerLatitude,
              longitude: r.sellerLongitude,
            });

            const defaultCoords = getPincodeCoordinates(loc.pincode || r.sellerPincode);
            const resolvedLat = loc.latitude ?? r.sellerLatitude ?? defaultCoords?.lat ?? null;
            const resolvedLng = loc.longitude ?? r.sellerLongitude ?? defaultCoords?.lng ?? null;

            rawRooms.push({
              id: r.id,
              title: r.title || 'Room',
              price: r.price || 0,
              description: cleanRoomAboutText(r.description || r.about || ''),
              capacity: r.capacity || 1,
              images: parsedImages,
              isAvailable: r.isAvailable !== false,
              sellerId: r.sellerId,
              sellerName: r.sellerName || '',
              sellerCity: loc.city || r.sellerCity || 'Pune',
              sellerPincode: loc.pincode || r.sellerPincode || '',
              sellerLocality: loc.locality || r.sellerLocality || '',
              sellerLandmark: loc.landmark || r.sellerLandmark || '',
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
        const couponList = Array.isArray(couponsRes)
          ? couponsRes
          : (couponsRes?.data?.coupons || couponsRes?.coupons || couponsRes?.data || []);
        if (Array.isArray(couponList) && couponList.length > 0) {
          couponList.forEach((c: any) => {
            rawCoupons.push({
              id: c.id,
              code: c.code,
              description: c.description || '',
              discountPercentage: c.discountPercentage,
              discountAmount: c.discountAmount,
              minimumCartValue: c.minimumCartValue,
              appliesToSellerId: c.appliesToSellerId || null,
              appliesToProductId: c.appliesToProductId || null,
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

        // 6. Process Curated Reels
        const rawReels: DynamicCuratedReel[] = [];
        const fetchedReels = reelsRes?.data?.reels || reelsRes?.reels;
        if (Array.isArray(fetchedReels) && fetchedReels.length > 0) {
          fetchedReels.forEach((r: any) => {
            rawReels.push({
              id: r.id,
              instagramMediaId: r.instagramMediaId,
              mediaType: r.mediaType || "VIDEO",
              mediaUrl: r.mediaUrl,
              thumbnailUrl: r.thumbnailUrl || r.mediaUrl,
              permalink: r.permalink,
              caption: r.caption || "",
              likeCount: r.likeCount || 0,
              commentsCount: r.commentsCount || 0,
              displayOrder: r.displayOrder || 0,
              categoryTag: r.categoryTag || "ALL",
              customTitle: r.customTitle,
              customSubtitle: r.customSubtitle,
              redirectType: r.redirectType || "KITCHEN",
              customRedirectUrl: r.customRedirectUrl,
              seller: r.seller || null,
              foodItem: r.foodItem || null,
            });
          });
        }
        setReels(rawReels);
        setError(null);
      } catch (err: any) {
        if (isMounted) {
          console.error('Error loading home data:', err);
          if (!isBackground) {
            setError(err?.message || 'Failed to load live data');
          }
          setIsUsingFallback(false);
        }
      } finally {
        if (isMounted && !isBackground) {
          setIsLoading(false);
        }
      }
    }

    // Initial load
    loadData(false);

    // Live background polling interval (every 4 seconds)
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    }, 4000);

    const handleSync = () => {
      loadData(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleSync);
      window.addEventListener("seller-status-updated", handleSync);
      window.addEventListener("cloudkitchen-new-notification", handleSync);
      window.addEventListener("storage", handleSync);
      window.addEventListener("location-changed", handleSync);
      document.addEventListener("visibilitychange", handleVisibility);
    }

    let bcStatus: BroadcastChannel | null = null;
    let bcNotif: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bcStatus = new BroadcastChannel("cloudkitchen_seller_status_bc");
        bcStatus.onmessage = () => handleSync();
        bcNotif = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
        bcNotif.onmessage = () => handleSync();
      } catch {}
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleSync);
        window.removeEventListener("seller-status-updated", handleSync);
        window.removeEventListener("cloudkitchen-new-notification", handleSync);
        window.removeEventListener("storage", handleSync);
        window.removeEventListener("location-changed", handleSync);
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (bcStatus) {
        try { bcStatus.close(); } catch {}
      }
      if (bcNotif) {
        try { bcNotif.close(); } catch {}
      }
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

  // Compute active location coordinates and pincode with localStorage immediate fallback
  const localLat = typeof window !== "undefined" && localStorage.getItem("guest-lat") ? parseFloat(localStorage.getItem("guest-lat")!) : null;
  const localLng = typeof window !== "undefined" && localStorage.getItem("guest-lng") ? parseFloat(localStorage.getItem("guest-lng")!) : null;
  const localPin = typeof window !== "undefined" ? (localStorage.getItem("active-selected-pincode") || localStorage.getItem("guest-pincode")) : null;

  const activePincode = (options?.pincode || defaultAddress?.pincode || localPin || '').trim() || null;

  const userLat = (defaultAddress?.latitude != null && !isNaN(Number(defaultAddress.latitude)))
    ? Number(defaultAddress.latitude)
    : (localLat !== null && !isNaN(localLat) ? localLat : null);
  const userLng = (defaultAddress?.longitude != null && !isNaN(Number(defaultAddress.longitude)))
    ? Number(defaultAddress.longitude)
    : (localLng !== null && !isNaN(localLng) ? localLng : null);
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

  // Compute enriched rooms with accurate distances
  const enrichedRooms = useMemo(() => {
    return rooms.map((r) => {
      if (hasUserCoords && r.sellerLatitude != null && r.sellerLongitude != null) {
        const dist = calculateDistanceKm(activeUserLat!, activeUserLng!, Number(r.sellerLatitude), Number(r.sellerLongitude));
        return {
          ...r,
          distanceKm: dist,
          distanceText: formatDistance(dist),
        };
      }
      return r;
    });
  }, [rooms, hasUserCoords, activeUserLat, activeUserLng]);

  // Helper to check dynamic seller delivery distance deliverability with pincode fallback
  const isSellerDeliverable = (
    sellerLat?: number | null,
    sellerLng?: number | null,
    sellerPin?: string,
    servedPins?: string[],
    locality?: string,
    landmark?: string,
    sellerRadiusKm?: number | null
  ) => {
    const maxRadius =
      sellerRadiusKm !== undefined && sellerRadiusKm !== null && Number(sellerRadiusKm) > 0
        ? Number(sellerRadiusKm)
        : MAX_DELIVERY_RADIUS_KM;

    // 1. Resolve user coordinates: either direct GPS/pinned lat/lng OR fallback from active pincode
    const resolvedUserLat =
      activeUserLat !== null && !isNaN(activeUserLat)
        ? activeUserLat
        : activePincode
        ? getPincodeCoordinates(activePincode)?.lat ?? null
        : null;

    const resolvedUserLng =
      activeUserLng !== null && !isNaN(activeUserLng)
        ? activeUserLng
        : activePincode
        ? getPincodeCoordinates(activePincode)?.lng ?? null
        : null;

    // 2. Resolve seller coordinates: either direct seller lat/lng OR fallback from seller pincode
    const effectiveSellerPin = sellerPin || (servedPins && servedPins.length > 0 ? servedPins[0] : undefined);
    const resolvedSellerLat =
      sellerLat != null && !isNaN(Number(sellerLat)) && Number(sellerLat) !== 0
        ? Number(sellerLat)
        : effectiveSellerPin
        ? getPincodeCoordinates(effectiveSellerPin)?.lat ?? null
        : null;

    const resolvedSellerLng =
      sellerLng != null && !isNaN(Number(sellerLng)) && Number(sellerLng) !== 0
        ? Number(sellerLng)
        : effectiveSellerPin
        ? getPincodeCoordinates(effectiveSellerPin)?.lng ?? null
        : null;

    // 3. If both user and seller coordinates are resolved, STRICTLY enforce distance <= maxRadius
    if (
      resolvedUserLat !== null &&
      resolvedUserLng !== null &&
      resolvedSellerLat !== null &&
      resolvedSellerLng !== null
    ) {
      const dist = calculateDistanceKm(
        resolvedUserLat,
        resolvedUserLng,
        resolvedSellerLat,
        resolvedSellerLng
      );
      return dist <= maxRadius;
    }

    // 4. Fallback: Pincode serviceability match
    if (activePincode) {
      return isPincodeServiced(activePincode, sellerPin, servedPins, locality, landmark);
    }

    return true;
  };

  // Check if at least one kitchen directly serves the user's active location
  const isDirectlyDeliverable = useMemo(() => {
    if (!activePincode && !hasUserCoords) return true;
    return enrichedKitchens.some((k) =>
      isSellerDeliverable(
        k.latitude,
        k.longitude,
        k.pincode,
        k.servedPincodes,
        k.locality,
        k.landmark,
        k.deliveryRadiusKm
      )
    );
  }, [enrichedKitchens, activePincode, hasUserCoords, activeUserLat, activeUserLng]);

  // Deliverable food items: sorts directly deliverable items first, followed by all other
  // food items so dishes across all active kitchens in Pune are never hidden!
  const deliverableFoodItems = useMemo(() => {
    if (!activePincode && !hasUserCoords) return enrichedFoodItems;
    const deliverable = enrichedFoodItems.filter((item) =>
      isSellerDeliverable(
        item.sellerLatitude,
        item.sellerLongitude,
        item.sellerPincode,
        item.servedPincodes,
        item.sellerLocality,
        item.sellerLandmark,
        item.sellerDeliveryRadiusKm
      )
    );
    const nonDeliverable = enrichedFoodItems.filter((item) => !deliverable.some((d) => d.id === item.id));
    return [...deliverable, ...nonDeliverable];
  }, [enrichedFoodItems, activePincode, hasUserCoords, activeUserLat, activeUserLng]);

  // Deliverable kitchens: sorts directly deliverable kitchens first, followed by all other
  // kitchens so all active kitchens in Pune are always visible on the user dashboard!
  const deliverableKitchens = useMemo(() => {
    if (!activePincode && !hasUserCoords) return enrichedKitchens;
    const deliverable = enrichedKitchens.filter((k) =>
      isSellerDeliverable(
        k.latitude,
        k.longitude,
        k.pincode,
        k.servedPincodes,
        k.locality,
        k.landmark,
        k.deliveryRadiusKm
      )
    );
    const nonDeliverable = enrichedKitchens.filter((k) => !deliverable.some((d) => d.id === k.id));
    return [...deliverable, ...nonDeliverable];
  }, [enrichedKitchens, activePincode, hasUserCoords, activeUserLat, activeUserLng]);

  // Compute filtered food items based on dynamic distance + filter options
  const filteredFoodItems = useMemo(() => {
    let list = deliverableFoodItems.filter((item) => {
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
  }, [deliverableFoodItems, hasUserCoords, options]);

  // Compute filtered kitchens based on dynamic distance + filter options
  const filteredKitchens = useMemo(() => {
    let list = deliverableKitchens.filter((k) => {
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

    // Sort kitchens
    if (options?.sortBy === "rating") {
      list = [...list].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (options?.sortBy === "fastest" || hasUserCoords) {
      list = [...list].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return list;
  }, [deliverableKitchens, hasUserCoords, options]);

  return {
    categories,
    foodItems: filteredFoodItems,
    rooms: enrichedRooms,
    kitchens: filteredKitchens,
    coupons,
    promoBanners,
    reels,
    filteredFoodItems,
    filteredKitchens,
    allFoodItems: enrichedFoodItems,
    allKitchens: enrichedKitchens,
    activePincode,
    isDirectlyDeliverable,
    hasMatchingKitchens: enrichedKitchens.length > 0,
    totalKitchensCount: enrichedKitchens.length,
    isLoading,
    error,
    isUsingFallback,
  };
}
