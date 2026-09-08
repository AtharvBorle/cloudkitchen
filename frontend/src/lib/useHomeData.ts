import { useState, useEffect } from 'react';
import { fetchApi } from './fetch-api';

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
  time: string;
  imageUrl: string;
  category: string;
  locality?: string;
  city?: string;
  isOnline: boolean;
  foodType?: string;
}

export interface HomeDataState {
  categories: DynamicCategory[];
  foodItems: DynamicFoodItem[];
  rooms: DynamicRoom[];
  kitchens: DynamicKitchen[];
  coupons: DynamicCoupon[];
  promoBanners: DynamicPromoBanner[];
  isLoading: boolean;
  error: string | null;
}

export function useHomeData(): HomeDataState {
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [foodItems, setFoodItems] = useState<DynamicFoodItem[]>([]);
  const [rooms, setRooms] = useState<DynamicRoom[]>([]);
  const [kitchens, setKitchens] = useState<DynamicKitchen[]>([]);
  const [coupons, setCoupons] = useState<DynamicCoupon[]>([]);
  const [promoBanners, setPromoBanners] = useState<DynamicPromoBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const dbCategories: DynamicCategory[] = [];
        
        // 1. Food is always first
        dbCategories.push({
          id: "food",
          name: "Food",
          image: "/images/categories/cat-food.png",
          emoji: "🍔",
          route: "/explore-desktop",
        });

        if (exploreRes?.foodCategories && Array.isArray(exploreRes.foodCategories)) {
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
        } else if (categoriesRes?.categories && Array.isArray(categoriesRes.categories)) {
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
        setCategories(dbCategories);

        const rawFoodItems: DynamicFoodItem[] = [];
        const kitchenMap = new Map<string, DynamicKitchen>();

        if (exploreRes?.foodItems && Array.isArray(exploreRes.foodItems)) {
          exploreRes.foodItems.forEach((item: any) => {
            const foodItem: DynamicFoodItem = {
              id: item.id,
              name: item.name,
              description: item.description || '',
              price: item.price || 0,
              imageUrl: item.imageUrl || '/images/places/place-biryani.png',
              itemType: item.itemType || 'VEG',
              isAvailable: item.isAvailable !== false,
              sellerId: item.sellerId,
              sellerName: item.sellerName || 'Verified Kitchen',
              sellerCity: item.sellerCity,
              sellerPincode: item.sellerPincode,
              sellerLocality: item.sellerLocality,
              sellerLandmark: item.sellerLandmark,
              sellerTrackingId: item.sellerTrackingId,
              sellerIsOnline: item.sellerIsOnline !== false,
              sellerFoodType: item.sellerFoodType || 'BOTH',
              categoryName: item.foodCategory?.name || item.category?.name || 'Main Course',
              rating: 4.8,
              deliveryTime: '25-35 min',
            };
            rawFoodItems.push(foodItem);

            if (item.sellerId && !kitchenMap.has(item.sellerId)) {
              kitchenMap.set(item.sellerId, {
                id: item.sellerId,
                name: item.sellerName || 'Verified Kitchen',
                trackingId: item.sellerTrackingId || item.sellerId,
                rating: 4.8,
                time: '20-35 min',
                imageUrl: item.imageUrl || '/images/places/place-pizza.png',
                category: item.foodCategory?.name || (item.sellerFoodType === 'VEG' ? 'Pure Veg' : 'Multi Cuisine'),
                locality: item.sellerLocality,
                city: item.sellerCity,
                isOnline: item.sellerIsOnline !== false,
                foodType: item.sellerFoodType,
              });
            }
          });
        }
        setFoodItems(rawFoodItems);
        setKitchens(Array.from(kitchenMap.values()));

        const rawRooms: DynamicRoom[] = [];
        if (exploreRes?.availableRooms && Array.isArray(exploreRes.availableRooms)) {
          exploreRes.availableRooms.forEach((r: any) => {
            let parsedImages: string[] = [];
            if (typeof r.images === 'string') {
              try {
                parsedImages = JSON.parse(r.images);
              } catch (e) {
                parsedImages = [r.images];
              }
            } else if (Array.isArray(r.images)) {
              parsedImages = r.images;
            }

            rawRooms.push({
              id: r.id,
              title: r.title || 'Comfort Room',
              price: r.price || 0,
              description: r.description || '',
              capacity: r.capacity || 1,
              images: parsedImages.length > 0 ? parsedImages : ['/images/places/place-rooms.png'],
              isAvailable: r.isAvailable !== false,
              sellerId: r.sellerId,
              sellerName: r.sellerName || 'Verified Host',
              sellerCity: r.sellerCity,
              sellerPincode: r.sellerPincode,
              sellerLocality: r.sellerLocality,
              sellerTrackingId: r.sellerTrackingId,
            });
          });
        }
        setRooms(rawRooms);

        const rawCoupons: DynamicCoupon[] = [];
        if (Array.isArray(couponsRes)) {
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

        const rawBanners: DynamicPromoBanner[] = [];
        const fetchedBanners = bannersRes?.data?.banners || bannersRes?.banners;
        if (Array.isArray(fetchedBanners)) {
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
          setError(err?.message || 'Failed to load home data');
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

  return {
    categories,
    foodItems,
    rooms,
    kitchens,
    coupons,
    promoBanners,
    isLoading,
    error,
  };
}
