import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from './fetch-api';
import { useLocation } from '@/components/location-provider';
import {
  calculateDistanceKm,
  formatDistance,
  MAX_DELIVERY_RADIUS_KM,
  getPincodeCoordinates,
  resolveLocationCoordinates,
  resolveUserCoordinates,
  resolveSellerCoordinates,
  getUnifiedDeliveryDistance,
  calculateDeliveryTime,
} from './geo-distance';
import { extractRoomPropertyLocation, cleanRoomAboutText } from './room-location-helper';

export interface HomeFoodSubCategory {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export interface HomeFoodCategory {
  id: string;
  name: string;
  imageUrl?: string | null;
  subCategories: HomeFoodSubCategory[];
}

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
  subCategoryName?: string | null;
  foodCategory?: { id?: string; name?: string } | null;
  foodSubCategory?: { id?: string; name?: string } | null;
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
  totalSales?: number;
  orderCount?: number;
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
  foodCategories: HomeFoodCategory[];
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
  const [foodCategories, setFoodCategories] = useState<HomeFoodCategory[]>([]);
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

        // Check if room module is enabled from backend response or localStorage
        const isRoomEnabledSetting = Boolean(
          exploreRes?.isRoomEnabled ??
          exploreRes?.data?.isRoomEnabled ??
          categoriesRes?.isRoomEnabled ??
          categoriesRes?.data?.isRoomEnabled ??
          (typeof window !== "undefined" ? localStorage.getItem("ENABLE_ROOM_MODULE") === "true" : false)
        );

        // 1. Process Categories (Deduplicated - Food & Sub Food Categories ONLY, NO Business Categories)
        const businessCategoryNames = new Set<string>([
          "homely food", "homely", "home food", "mess", "daily mess", "student mess",
          "cafe", "south indian", "lunch(homely food)", "lunch (homely food)",
          "lunch", "dinner", "food", "rooms", "room", "rent property", "property",
          "furniture", "bakery"
        ]);
        if (categoriesRes?.categories && Array.isArray(categoriesRes.categories)) {
          categoriesRes.categories.forEach((bc: any) => {
            if (bc?.name) businessCategoryNames.add(String(bc.name).toLowerCase().trim());
          });
        }

        const isBusinessCat = (name?: string | null): boolean => {
          if (!name) return true;
          const lower = name.toLowerCase().trim();
          const clean = lower.replace(/[^a-z0-9]/g, "");
          return (
            businessCategoryNames.has(lower) ||
            businessCategoryNames.has(clean) ||
            clean === "food" ||
            clean === "rooms" ||
            clean === "room" ||
            clean === "mess" ||
            clean === "bakery" ||
            clean.includes("room") ||
            clean.includes("property") ||
            lower.includes("homely food") ||
            lower.includes("lunch(homely")
          );
        };

        const categoryMap = new Map<string, DynamicCategory>();

        const processCatEntry = (fc: any) => {
          if (!fc || !fc.name) return;
          const rawName = String(fc.name).trim();
          const lower = rawName.toLowerCase();
          const cleanKey = lower.replace(/[\s\-_]+/g, "");
          if (!lower) return;

          // Strictly exclude business categories or non-food categories
          if (isBusinessCat(rawName)) return;

          const displayName = lower === "dalrice" ? "Dal Rice" : (rawName.charAt(0).toUpperCase() + rawName.slice(1));
          const isMismatchedImg = fc.imageUrl && String(fc.imageUrl).includes("zwy6klrcbxepkcjr1big");
          const customFallback = getCustomCategoryIcon(cleanKey, rawName);

          const dynamicImage =
            fc.imageUrl && !isMismatchedImg
              ? String(fc.imageUrl).trim()
              : fc.image && !isMismatchedImg
              ? String(fc.image).trim()
              : null;

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

        const explorePayload = exploreRes?.data || exploreRes;

        // Process structured Food Categories & Subcategories from DB ONLY (NO business categories)
        const rawFcs = (categoriesRes?.foodCategories && categoriesRes.foodCategories.length > 0)
          ? categoriesRes.foodCategories
          : (explorePayload?.foodCategories || []);

        if (Array.isArray(rawFcs)) {
          rawFcs.forEach((fc: any) => {
            if (!fc || !fc.name || isBusinessCat(fc.name)) return;
            processCatEntry(fc);
            if (Array.isArray(fc.subCategories)) {
              fc.subCategories.forEach((sc: any) => {
                if (sc && sc.name && !isBusinessCat(sc.name)) {
                  processCatEntry(sc);
                }
              });
            }
          });
        }

        const processedFcs: HomeFoodCategory[] = [];
        if (Array.isArray(rawFcs)) {
          rawFcs.forEach((fc: any) => {
            if (!fc || !fc.name || isBusinessCat(fc.name)) return;

            const subs: HomeFoodSubCategory[] = Array.isArray(fc.subCategories)
              ? fc.subCategories
                  .filter((s: any) => s && s.name && !isBusinessCat(s.name))
                  .map((s: any) => ({
                    id: s.id,
                    name: s.name.trim().split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "),
                    imageUrl: s.imageUrl || null,
                  }))
              : [];

            processedFcs.push({
              id: fc.id,
              name: fc.name.toLowerCase().trim() === "dalrice" ? "Dal Rice" : (fc.name.trim().charAt(0).toUpperCase() + fc.name.trim().slice(1)),
              imageUrl: fc.imageUrl || null,
              subCategories: subs,
            });
          });
        }
        setFoodCategories(processedFcs);

        // Ensure rooms, generic food, mess, bakery, or business categories are never present
        businessCategoryNames.forEach((bc) => {
          categoryMap.delete(bc);
          categoryMap.delete(bc.replace(/[^a-z0-9]/g, ""));
        });
        categoryMap.delete("rooms");
        categoryMap.delete("room");
        categoryMap.delete("food");
        categoryMap.delete("mess");
        categoryMap.delete("bakery");

        const dbCategories: DynamicCategory[] = Array.from(categoryMap.values());
        setCategories(dbCategories);

        // 2. Process Food Items & Kitchens
        const rawFoodItems: DynamicFoodItem[] = [];
        const kitchenMap = new Map<string, DynamicKitchen>();

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
              categoryName: (() => {
                const rawFoodCat = (item.foodCategory?.name || "").trim();
                const rawBizCat = (item.category?.name || "").trim();
                const validBizCat = rawBizCat && !isBusinessCat(rawBizCat) ? rawBizCat : "";
                const inferCat = (dishName?: string | null): string => {
                  if (!dishName) return "Food";
                  const lower = dishName.toLowerCase();
                  if (lower.includes("burger")) return "Burger";
                  if (lower.includes("pizza")) return "Pizza";
                  if (lower.includes("biryani")) return "Biryani";
                  if (lower.includes("dosa")) return "Dosa";
                  if (lower.includes("idli")) return "Idli";
                  if (lower.includes("pohe") || lower.includes("poha")) return "Pohe";
                  if (lower.includes("upma")) return "Upma";
                  if (lower.includes("sabudana")) return "Sabudana";
                  if (lower.includes("shira") || lower.includes("sheera")) return "Shira";
                  if (lower.includes("cake") || lower.includes("pastry") || lower.includes("cheesecake")) return "Cake";
                  if (lower.includes("shake") || lower.includes("smoothie") || lower.includes("coffee") || lower.includes("drink") || lower.includes("beverage")) return "Shake";
                  if (lower.includes("thali") || lower.includes("meal") || lower.includes("rice") || lower.includes("dal") || lower.includes("roti") || lower.includes("chapati") || lower.includes("paneer")) return "Meal";
                  if (lower.includes("waffle") || lower.includes("dessert") || lower.includes("ice cream") || lower.includes("sweet")) return "Desserts";
                  if (lower.includes("sandwich") || lower.includes("wrap") || lower.includes("roll")) return "Sandwich";
                  if (lower.includes("snack") || lower.includes("fries") || lower.includes("samosa") || lower.includes("kachori")) return "Snacks";
                  if (lower.includes("noodle") || lower.includes("manchurian") || lower.includes("fried rice") || lower.includes("chinese")) return "Chinese";
                  return "Food";
                };
                return rawFoodCat || validBizCat || inferCat(item.name);
              })(),
              subCategoryName: (() => {
                const rawSub = (item.foodSubCategory?.name || item.subCategory?.name || "").trim();
                return rawSub && !isBusinessCat(rawSub) ? rawSub : null;
              })(),
              foodCategory: item.foodCategory ? { id: item.foodCategory.id, name: item.foodCategory.name } : null,
              foodSubCategory: item.foodSubCategory ? { id: item.foodSubCategory.id, name: item.foodSubCategory.name } : null,
              rating: typeof item.rating === "number" ? item.rating : (typeof item.averageRating === "number" ? item.averageRating : (Array.isArray(item.itemRatings) && item.itemRatings.length > 0 ? item.itemRatings.reduce((sum: number, r: any) => sum + (Number(r?.rating) || 0), 0) / item.itemRatings.length : 0)),
              totalRatings: typeof item.totalRatings === "number" ? item.totalRatings : (Array.isArray(item.itemRatings) ? item.itemRatings.length : 0),
              reviewsCount: typeof item.reviewsCount === "number" ? item.reviewsCount : (typeof item.totalRatings === "number" ? item.totalRatings : 0),
              deliveryTime: item.deliveryTime || '20-30 min',
              servedPincodes: item.servedPincodes || [],
              sellerDeliveryRadiusKm: item.sellerDeliveryRadiusKm !== undefined && item.sellerDeliveryRadiusKm !== null ? Number(item.sellerDeliveryRadiusKm) : (item.deliveryRadiusKm !== undefined && item.deliveryRadiusKm !== null ? Number(item.deliveryRadiusKm) : 5.0),
              addons: item.addons || item.variants || [],
              variants: item.variants || item.addons || [],
              totalSales: typeof item.totalSales === "number" ? item.totalSales : (typeof item.orderCount === "number" ? item.orderCount : 0),
              orderCount: typeof item.orderCount === "number" ? item.orderCount : (typeof item.totalSales === "number" ? item.totalSales : 0),
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
        setRooms(isRoomEnabledSetting ? rawRooms : []);

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

    let syncDebounceTimer: any = null;
    const handleSync = () => {
      if (!isMounted) return;
      if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
      syncDebounceTimer = setTimeout(() => {
        if (isMounted) loadData(true);
      }, 300);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleSync();
      }
    };

    // Real-time SSE connection to receive live updates from admin & seller without polling
    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectLiveStream = () => {
      if (typeof window === "undefined" || !isMounted) return;
      try {
        es = new EventSource("/api/public/live/stream", { withCredentials: true });
        es.addEventListener("live", (e: any) => {
          handleSync();
        });
        es.onmessage = (e) => {
          if (e.data && e.data.trim().startsWith("{")) {
            handleSync();
          }
        };
        es.onerror = () => {
          if (es && es.readyState === EventSource.CLOSED) {
            es.close();
            es = null;
            if (isMounted) {
              reconnectTimeout = setTimeout(connectLiveStream, 5000);
            }
          }
        };
      } catch (err) {
        console.error("Home live stream connection error:", err);
      }
    };

    connectLiveStream();

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleSync);
      window.addEventListener("seller-status-updated", handleSync);
      window.addEventListener("cloudkitchen-new-notification", handleSync);
      window.addEventListener("public-live-shop", handleSync);
      window.addEventListener("public-coupon-updated", handleSync);
      window.addEventListener("seller-menu-updated", handleSync);
      window.addEventListener("public-banner-updated", handleSync);
      window.addEventListener("public-category-updated", handleSync);
      window.addEventListener("public-reel-updated", handleSync);
      window.addEventListener("public-room-updated", handleSync);
      window.addEventListener("public-catalogue-updated", handleSync);
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
      if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (es) {
        try { es.close(); } catch {}
        es = null;
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleSync);
        window.removeEventListener("seller-status-updated", handleSync);
        window.removeEventListener("cloudkitchen-new-notification", handleSync);
        window.removeEventListener("public-live-shop", handleSync);
        window.removeEventListener("public-coupon-updated", handleSync);
        window.removeEventListener("seller-menu-updated", handleSync);
        window.removeEventListener("public-banner-updated", handleSync);
        window.removeEventListener("public-category-updated", handleSync);
        window.removeEventListener("public-reel-updated", handleSync);
        window.removeEventListener("public-room-updated", handleSync);
        window.removeEventListener("public-catalogue-updated", handleSync);
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
  const hasUserExplicitlySelected = typeof window !== "undefined" && localStorage.getItem("user-has-selected-location") === "true";
  const localLat = typeof window !== "undefined" && localStorage.getItem("guest-lat") ? parseFloat(localStorage.getItem("guest-lat")!) : null;
  const localLng = typeof window !== "undefined" && localStorage.getItem("guest-lng") ? parseFloat(localStorage.getItem("guest-lng")!) : null;
  const localPin = typeof window !== "undefined" ? (localStorage.getItem("active-selected-pincode") || localStorage.getItem("guest-pincode")) : null;
  const localLocality = typeof window !== "undefined" ? localStorage.getItem("guest-locality") : null;

  // Resolve user active location: prioritize explicitly selected location / localPin, else defaultAddress
  const rawCandidate = options?.pincode || (hasUserExplicitlySelected && localPin ? localPin : (defaultAddress?.pincode || localPin || ''));
  const resolvedCandidate = resolveLocationCoordinates(rawCandidate || (hasUserExplicitlySelected ? localLocality : (defaultAddress?.locality || localLocality)));
  const activePincode = (resolvedCandidate?.pincode || rawCandidate || '').trim() || null;

  const resolvedCoords = resolveUserCoordinates(defaultAddress);
  const activeUserLat = resolvedCoords?.lat ?? null;
  const activeUserLng = resolvedCoords?.lng ?? null;
  const hasUserCoords = activeUserLat !== null && activeUserLng !== null;

  // Compute enriched food items with accurate distances
  const enrichedFoodItems = useMemo(() => {
    return foodItems.map((item) => {
      const deliveryInfo = getUnifiedDeliveryDistance(
        hasUserCoords ? { lat: activeUserLat, lng: activeUserLng } : defaultAddress,
        item
      );

      if (deliveryInfo.distanceKm !== null) {
        const sCoords = resolveSellerCoordinates(item);
        return {
          ...item,
          sellerLatitude: sCoords?.lat ?? item.sellerLatitude,
          sellerLongitude: sCoords?.lng ?? item.sellerLongitude,
          distanceKm: deliveryInfo.distanceKm,
          distanceText: deliveryInfo.distanceText,
          deliveryTime: deliveryInfo.deliveryTimeText,
        };
      }
      return item;
    });
  }, [foodItems, hasUserCoords, activeUserLat, activeUserLng, defaultAddress]);

  // Compute enriched kitchens with accurate distances
  const enrichedKitchens = useMemo(() => {
    return kitchens.map((k) => {
      const deliveryInfo = getUnifiedDeliveryDistance(
        hasUserCoords ? { lat: activeUserLat, lng: activeUserLng } : defaultAddress,
        k
      );

      if (deliveryInfo.distanceKm !== null) {
        const kCoords = resolveSellerCoordinates(k);
        return {
          ...k,
          latitude: kCoords?.lat ?? k.latitude,
          longitude: kCoords?.lng ?? k.longitude,
          distanceKm: deliveryInfo.distanceKm,
          distanceText: deliveryInfo.distanceText,
          time: deliveryInfo.deliveryTimeText,
          deliveryTime: deliveryInfo.deliveryTimeText,
        };
      }
      return k;
    });
  }, [kitchens, hasUserCoords, activeUserLat, activeUserLng, defaultAddress]);

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

    // 2. Resolve seller coordinates: either direct seller lat/lng OR fallback from seller pincode or locality
    const effectiveSellerPin = sellerPin || (servedPins && servedPins.length > 0 ? servedPins[0] : undefined);
    const sellerPinCoords = effectiveSellerPin
      ? getPincodeCoordinates(effectiveSellerPin)
      : (locality ? resolveLocationCoordinates(locality) : null);

    const resolvedSellerLat =
      sellerLat != null && !isNaN(Number(sellerLat)) && Number(sellerLat) !== 0
        ? Number(sellerLat)
        : sellerPinCoords?.lat ?? null;

    const resolvedSellerLng =
      sellerLng != null && !isNaN(Number(sellerLng)) && Number(sellerLng) !== 0
        ? Number(sellerLng)
        : sellerPinCoords?.lng ?? null;

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

    return false;
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

  // Strictly filter food items by 5 km delivery radius when user location/pincode is active
  const deliverableFoodItems = useMemo(() => {
    if (!activePincode && !hasUserCoords) return enrichedFoodItems;
    return enrichedFoodItems.filter((item) =>
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
  }, [enrichedFoodItems, activePincode, hasUserCoords, activeUserLat, activeUserLng]);

  // Strictly filter kitchens by 5 km delivery radius when user location/pincode is active
  const deliverableKitchens = useMemo(() => {
    if (!activePincode && !hasUserCoords) return enrichedKitchens;
    return enrichedKitchens.filter((k) =>
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
    foodCategories,
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
