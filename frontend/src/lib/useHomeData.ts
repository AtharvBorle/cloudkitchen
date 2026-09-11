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
  isLoading: boolean;
  error: string | null;
  isUsingFallback: boolean;
}

// ==========================================
// Comprehensive Rich Fallback Data
// ==========================================
export const FALLBACK_CATEGORIES: DynamicCategory[] = [
  { id: "food", name: "Food", image: "/images/categories/cat-food.png", emoji: "🍔", route: "/explore-desktop" },
  { id: "mess", name: "Mess", image: "/images/categories/cat-mess.png", emoji: "🧺", route: "/explore-desktop?category=mess" },
  { id: "bakery", name: "Bakery", image: "/images/categories/cat-backery.png", emoji: "🥐", route: "/explore-desktop?category=bakery" },
  { id: "home-meals", name: "Home Meals", image: "/images/categories/cat-homemeals.png", emoji: "🍲", route: "/explore-desktop?category=homemeals" },
  { id: "healthy", name: "Healthy", image: "/images/categories/cat-healthy.png", emoji: "🥗", route: "/explore-desktop?category=healthy" },
  { id: "snacks", name: "Snacks", image: "/images/categories/cat-snacks.png", emoji: "🍿", route: "/explore-desktop?category=snacks" },
  { id: "desserts", name: "Desserts", image: "/images/categories/cat-deserts.png", emoji: "🍰", route: "/explore-desktop?category=desserts" },
  { id: "drink", name: "Drink", image: "/images/categories/cat-drink.png", emoji: "🍹", route: "/explore-desktop?category=drinks" },
  { id: "rooms", name: "Rooms", image: "/images/categories/cat-rooms.png", emoji: "🛏️", route: "/room-booking" },
];

export const FALLBACK_KITCHENS: DynamicKitchen[] = [
  {
    id: "k-1",
    name: "Chef Anjali's Gourmet Kitchen",
    trackingId: "chef-anjali",
    rating: 4.9,
    reviewsCount: 240,
    time: "20-30 min",
    imageUrl: "/images/places/place-pizza.png",
    category: "Woodfire Pizzas & Italian",
    locality: "Kothrud",
    city: "Pune",
    pincode: "411038",
    isOnline: true,
    foodType: "BOTH",
    servedPincodes: ["411038", "411052", "411004", "411057", "411014"],
  },
  {
    id: "k-2",
    name: "Purohit Homely Tiffin Service",
    trackingId: "purohit-tiffins",
    rating: 4.8,
    reviewsCount: 180,
    time: "15-25 min",
    imageUrl: "/images/places/place-biryani.png",
    category: "Pure Veg • North & Maharashtrian",
    locality: "Mayur Colony",
    city: "Pune",
    pincode: "411038",
    isOnline: true,
    foodType: "VEG",
    servedPincodes: ["411038", "411004", "411052"],
  },
  {
    id: "k-3",
    name: "Urban Spice Cloud Kitchen",
    trackingId: "urban-spice",
    rating: 4.7,
    reviewsCount: 310,
    time: "25-35 min",
    imageUrl: "/images/places/place-burger.png",
    category: "Biryani, Rolls & Fast Food",
    locality: "Baner",
    city: "Pune",
    pincode: "411045",
    isOnline: true,
    foodType: "BOTH",
    servedPincodes: ["411045", "411057", "411007"],
  },
  {
    id: "k-4",
    name: "Green Garden Organic Bowls",
    trackingId: "green-garden",
    rating: 4.9,
    reviewsCount: 140,
    time: "20-25 min",
    imageUrl: "/images/auth/salad-bowl.jpg",
    category: "Healthy & Diet Food",
    locality: "Aundh",
    city: "Pune",
    pincode: "411007",
    isOnline: true,
    foodType: "VEG",
    servedPincodes: ["411007", "411045", "411057"],
  },
];

export const FALLBACK_FOOD_ITEMS: DynamicFoodItem[] = [
  {
    id: "fb-1",
    name: "Margherita Brick-Oven Pizza",
    description: "Fresh mozzarella, classic marinara sauce, fresh basil and extra virgin olive oil.",
    price: 289,
    imageUrl: "/images/places/place-pizza.png",
    itemType: "VEG",
    isAvailable: true,
    sellerId: "k-1",
    sellerName: "Chef Anjali's Gourmet Kitchen",
    sellerCity: "Pune",
    sellerPincode: "411038",
    sellerLocality: "Kothrud",
    sellerTrackingId: "chef-anjali",
    sellerIsOnline: true,
    sellerFoodType: "BOTH",
    categoryName: "Pizza",
    rating: 4.9,
    deliveryTime: "20-30 min",
    servedPincodes: ["411038", "411052", "411004", "411057"],
  },
  {
    id: "fb-2",
    name: "Smoky BBQ Paneer Woodfire Pizza",
    description: "Charred marinated paneer cubes, crisp red onions, bell peppers and smokey chipotle drizzle.",
    price: 329,
    imageUrl: "/images/places/place-pizza.png",
    itemType: "VEG",
    isAvailable: true,
    sellerId: "k-1",
    sellerName: "Chef Anjali's Gourmet Kitchen",
    sellerCity: "Pune",
    sellerPincode: "411038",
    sellerLocality: "Kothrud",
    sellerTrackingId: "chef-anjali",
    sellerIsOnline: true,
    sellerFoodType: "BOTH",
    categoryName: "Pizza",
    rating: 4.8,
    deliveryTime: "20-30 min",
    servedPincodes: ["411038", "411052", "411004", "411057"],
  },
  {
    id: "fb-3",
    name: "Avocado & Quinoa Power Bowl",
    description: "Organic hass avocado, tricolor quinoa, roasted chickpeas and tahini lime dressing.",
    price: 249,
    imageUrl: "/images/auth/salad-bowl.jpg",
    itemType: "VEG",
    isAvailable: true,
    sellerId: "k-4",
    sellerName: "Green Garden Organic Bowls",
    sellerCity: "Pune",
    sellerPincode: "411007",
    sellerLocality: "Aundh",
    sellerTrackingId: "green-garden",
    sellerIsOnline: true,
    sellerFoodType: "VEG",
    categoryName: "Healthy",
    rating: 4.9,
    deliveryTime: "15-25 min",
    servedPincodes: ["411007", "411045", "411057", "411038"],
  },
  {
    id: "fb-4",
    name: "Royal Hyderabadi Dum Biryani",
    description: "Fragrant basmati rice layered with spiced marinated meat, saffron milk and caramelised onions.",
    price: 349,
    imageUrl: "/images/places/place-biryani.png",
    itemType: "NON_VEG",
    isAvailable: true,
    sellerId: "k-3",
    sellerName: "Urban Spice Cloud Kitchen",
    sellerCity: "Pune",
    sellerPincode: "411045",
    sellerLocality: "Baner",
    sellerTrackingId: "urban-spice",
    sellerIsOnline: true,
    sellerFoodType: "BOTH",
    categoryName: "Home Meals",
    rating: 4.8,
    deliveryTime: "25-35 min",
    servedPincodes: ["411045", "411057", "411007", "411038"],
  },
  {
    id: "fb-5",
    name: "Garlic Herb Cheesy Breadsticks",
    description: "Fresh dough baked with parmesan crust and melted mozzarella center with garlic dip.",
    price: 159,
    imageUrl: "/images/places/place-pizza.png",
    itemType: "VEG",
    isAvailable: true,
    sellerId: "k-1",
    sellerName: "Chef Anjali's Gourmet Kitchen",
    sellerCity: "Pune",
    sellerPincode: "411038",
    sellerLocality: "Kothrud",
    sellerTrackingId: "chef-anjali",
    sellerIsOnline: true,
    sellerFoodType: "BOTH",
    categoryName: "Snacks",
    rating: 4.7,
    deliveryTime: "20-30 min",
    servedPincodes: ["411038", "411052", "411004"],
  },
  {
    id: "fb-6",
    name: "Belgian Dark Molten Lava Cake",
    description: "Warm chocolate sponge with rich, oozing liquid dark chocolate ganache center.",
    price: 179,
    imageUrl: "/images/places/place-burger.png",
    itemType: "VEG",
    isAvailable: true,
    sellerId: "k-1",
    sellerName: "Chef Anjali's Gourmet Kitchen",
    sellerCity: "Pune",
    sellerPincode: "411038",
    sellerLocality: "Kothrud",
    sellerTrackingId: "chef-anjali",
    sellerIsOnline: true,
    sellerFoodType: "BOTH",
    categoryName: "Desserts",
    rating: 4.9,
    deliveryTime: "20-30 min",
    servedPincodes: ["411038", "411052", "411004"],
  },
  {
    id: "fb-7",
    name: "Deluxe Homely Maharashtrian Thali",
    description: "2 Rotis, Dal Tadka, Paneer Bhaji, Steamed Rice, Sweet Gulab Jamun, Papad and Pickle.",
    price: 189,
    imageUrl: "/images/places/place-biryani.png",
    itemType: "VEG",
    isAvailable: true,
    sellerId: "k-2",
    sellerName: "Purohit Homely Tiffin Service",
    sellerCity: "Pune",
    sellerPincode: "411038",
    sellerLocality: "Mayur Colony",
    sellerTrackingId: "purohit-tiffins",
    sellerIsOnline: true,
    sellerFoodType: "VEG",
    categoryName: "Mess",
    rating: 4.9,
    deliveryTime: "15-25 min",
    servedPincodes: ["411038", "411004", "411052"],
  },
  {
    id: "fb-8",
    name: "Crispy Grilled Veg Supreme Burger",
    description: "Herb potato patty, melted cheddar slice, crisp lettuce, tomatoes and thousand island dressing.",
    price: 149,
    imageUrl: "/images/places/place-burger.png",
    itemType: "VEG",
    isAvailable: true,
    sellerId: "k-3",
    sellerName: "Urban Spice Cloud Kitchen",
    sellerCity: "Pune",
    sellerPincode: "411045",
    sellerLocality: "Baner",
    sellerTrackingId: "urban-spice",
    sellerIsOnline: true,
    sellerFoodType: "BOTH",
    categoryName: "Snacks",
    rating: 4.7,
    deliveryTime: "20-30 min",
    servedPincodes: ["411045", "411057", "411007"],
  },
];

export const FALLBACK_COUPONS: DynamicCoupon[] = [
  {
    id: "cp-1",
    code: "CRUST30",
    description: "30% OFF up to ₹150 on your first cloud kitchen order",
    discountPercentage: 30,
    minimumCartValue: 249,
  },
  {
    id: "cp-2",
    code: "WELCOME20",
    description: "Flat 20% OFF on all gourmet meal plans & dishes",
    discountPercentage: 20,
    minimumCartValue: 199,
  },
  {
    id: "cp-3",
    code: "NEOFREESHIP",
    description: "Free Delivery on orders above ₹299",
    discountAmount: 49,
    minimumCartValue: 299,
  },
];

export const FALLBACK_BANNERS: DynamicPromoBanner[] = [
  {
    id: "b-1",
    title: "Limited Welcome Offer - 30% OFF",
    desktopImageUrl: "/images/promo-banner-full.png",
    mobileImageUrl: "/images/promo-welcome-mobile-3d.png",
    redirectUrl: "/explore",
    displayOrder: 1,
  },
];

export function useHomeData(options?: HomeDataFilterOptions): HomeDataState {
  const [categories, setCategories] = useState<DynamicCategory[]>(FALLBACK_CATEGORIES);
  const [foodItems, setFoodItems] = useState<DynamicFoodItem[]>(FALLBACK_FOOD_ITEMS);
  const [rooms, setRooms] = useState<DynamicRoom[]>([]);
  const [kitchens, setKitchens] = useState<DynamicKitchen[]>(FALLBACK_KITCHENS);
  const [coupons, setCoupons] = useState<DynamicCoupon[]>(FALLBACK_COUPONS);
  const [promoBanners, setPromoBanners] = useState<DynamicPromoBanner[]>(FALLBACK_BANNERS);
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

        setCategories(dbCategories.length > 2 ? dbCategories : FALLBACK_CATEGORIES);

        // 2. Process Food Items & Kitchens
        const rawFoodItems: DynamicFoodItem[] = [];
        const kitchenMap = new Map<string, DynamicKitchen>();

        if (exploreRes?.foodItems && Array.isArray(exploreRes.foodItems) && exploreRes.foodItems.length > 0) {
          exploreRes.foodItems.forEach((item: any) => {
            const foodItem: DynamicFoodItem = {
              id: item.id,
              name: item.name,
              description: item.description || 'Fresh gourmet preparation crafted with quality ingredients.',
              price: item.price || 199,
              imageUrl: item.imageUrl || '/images/places/place-biryani.png',
              itemType: item.itemType || 'VEG',
              isAvailable: item.isAvailable !== false,
              sellerId: item.sellerId,
              sellerName: item.sellerName || 'Verified Cloud Kitchen',
              sellerCity: item.sellerCity,
              sellerPincode: item.sellerPincode,
              sellerLocality: item.sellerLocality,
              sellerLandmark: item.sellerLandmark,
              sellerTrackingId: item.sellerTrackingId,
              sellerIsOnline: item.sellerIsOnline !== false,
              sellerFoodType: item.sellerFoodType || 'BOTH',
              categoryName: item.foodCategory?.name || item.category?.name || 'Main Course',
              rating: item.rating || 4.8,
              deliveryTime: '20-30 min',
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
              rating: k.rating || 4.8,
              reviewsCount: k.reviewsCount || 120,
              time: '20-30 min',
              imageUrl: k.imageUrl || '/images/places/place-pizza.png',
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

        // Apply fallback if database items are empty
        const finalFoodItems = rawFoodItems.length > 0 ? rawFoodItems : FALLBACK_FOOD_ITEMS;
        const finalKitchens = kitchenMap.size > 0 ? Array.from(kitchenMap.values()) : FALLBACK_KITCHENS;

        setFoodItems(finalFoodItems);
        setKitchens(finalKitchens);
        setIsUsingFallback(rawFoodItems.length === 0);

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
        setCoupons(rawCoupons.length > 0 ? rawCoupons : FALLBACK_COUPONS);

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
        setPromoBanners(rawBanners.length > 0 ? rawBanners : FALLBACK_BANNERS);
        setError(null);
      } catch (err: any) {
        if (isMounted) {
          console.error('Error loading home data (using fallback):', err);
          setError(err?.message || 'Failed to load live data, using default catalog');
          setIsUsingFallback(true);
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

  // Compute active filtered lists based on passed filter options
  const filteredFoodItems = foodItems.filter((item) => {
    if (!options) return true;
    const { searchQuery, category, vegOnly, pincode, minPrice, maxPrice, minRating } = options;

    if (vegOnly && item.itemType !== "VEG") return false;

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

    if (pincode && pincode.trim()) {
      const p = pincode.trim();
      const matchPin =
        item.sellerPincode === p ||
        (Array.isArray(item.servedPincodes) && item.servedPincodes.includes(p));
      if (!matchPin) return false;
    }

    if (minPrice !== undefined && item.price < minPrice) return false;
    if (maxPrice !== undefined && item.price > maxPrice) return false;
    if (minRating !== undefined && (item.rating || 0) < minRating) return false;

    return true;
  });

  const filteredKitchens = kitchens.filter((k) => {
    if (!options) return true;
    const { searchQuery, category, vegOnly, pincode, minRating } = options;

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

    if (pincode && pincode.trim()) {
      const p = pincode.trim();
      const matchPin =
        k.pincode === p ||
        (Array.isArray(k.servedPincodes) && k.servedPincodes.includes(p));
      if (!matchPin) return false;
    }

    if (minRating !== undefined && (k.rating || 0) < minRating) return false;

    return true;
  });

  return {
    categories,
    foodItems,
    rooms,
    kitchens,
    coupons,
    promoBanners,
    filteredFoodItems: filteredFoodItems.length > 0 ? filteredFoodItems : foodItems,
    filteredKitchens: filteredKitchens.length > 0 ? filteredKitchens : kitchens,
    isLoading,
    error,
    isUsingFallback,
  };
}
