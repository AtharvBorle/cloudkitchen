import img1 from "./popularfood/pizza-margherita-classic.jpg";
import img2 from "./popularfood/pizza-gourmet-table.jpg";
import img3 from "./popularfood/pizza-slice-popart.jpg";
import img4 from "./popularfood/pizza-bbq-paneer.jpg";
import img5 from "./popularfood/pizza-rustic-slices.jpg";
import img6 from "./popularfood/pizza-spinach-ricotta.jpg";

import butterChickenImg from "../explore-desktop/featured-collections/collection-butter-chicken.jpg";
import ramenImg from "../explore-desktop/featured-collections/collection-tonkotsu-ramen.jpg";
import pizzaImg from "../explore-desktop/featured-collections/collection-woodfire-pizza.jpg";
import curryImg from "../explore-desktop/featured-collections/collection-thai-curry.jpg";
import lavaCakeImg from "../explore-desktop/featured-collections/collection-molten-lava-cake.jpg";

import streetFoodImg from "../explore-desktop/curated-dining-collections/dining-street-food.jpg";
import comfortFoodImg from "../explore-desktop/curated-dining-collections/dining-comfort-food.jpg";
import saladImg from "../explore-desktop/curated-dining-collections/dining-fresh-salads.jpg";
import sushiImg from "../explore-desktop/curated-dining-collections/dining-sushi-sashimi.jpg";

export interface FoodCardItem {
  id: string;
  foodItemId?: string;
  title: string;
  description: string;
  rating: string;
  price: string;
  image: any;
  isVeg?: boolean;
  category?: string;
  addons?: Array<{ id: string; name: string; price: number }>;
  stockQuantity?: number;
  maxStock?: number;
  itemType?: string;
  sellerId?: string;
  sellerName?: string;
}

export interface KitchenData {
  id: string;
  trackingId?: string;
  restaurantName: string;
  location: string;
  rating: number;
  reviewsCount: string;
  deliveryTime: string;
  deliveryFeeText: string;
  dietType: string;
  offerText: string;
  chefName: string;
  chefDetails: string;
  categories: readonly string[];
  defaultActiveCategory: string;
  items: FoodCardItem[];
}

export const KITCHENS_REGISTRY: Record<string, KitchenData> = {
  "7-12-kitchen": {
    id: "7-12-kitchen",
    trackingId: "NCK-712",
    restaurantName: "7/12 Kitchen",
    location: "Near Kothrud, Maharishi Society, Pune",
    rating: 4.2,
    reviewsCount: "(240+ reviews)",
    deliveryTime: "25 min",
    deliveryFeeText: "Free Delivery",
    dietType: "Pure Veg",
    offerText: "30% OFF up to ₹150",
    chefName: "Chef Anjali Sharma",
    chefDetails: "5+ years serving home meals • Pune Cantonment",
    categories: ["Popular", "Home Meals", "Thali", "Rotis", "Desserts"],
    defaultActiveCategory: "Popular",
    items: [
      {
        id: "712-1",
        title: "Special Homely Maharashtrian Thali",
        description: "2 Rotis, Bhaji, Dal Tadka, Steamed Rice, Sweet Sheera, Koshimbir & Papad.",
        rating: "4.8",
        price: "₹189",
        image: comfortFoodImg,
        isVeg: true,
        category: "Thali",
      },
      {
        id: "712-2",
        title: "Paneer Butter Masala Meal",
        description: "Soft cottage cheese in rich tomato gravy with jeera rice and 3 butter rotis.",
        rating: "4.7",
        price: "₹219",
        image: butterChickenImg,
        isVeg: true,
        category: "Home Meals",
      },
      {
        id: "712-3",
        title: "Puran Poli with Ghee (2 pcs)",
        description: "Traditional sweet lentil flatbread topped with pure desi cow ghee.",
        rating: "4.9",
        price: "₹120",
        image: streetFoodImg,
        isVeg: true,
        category: "Desserts",
      },
      {
        id: "712-4",
        title: "Dal Khichdi & Achar Combo",
        description: "Comforting moong dal khichdi infused with garlic tadka and ghee.",
        rating: "4.6",
        price: "₹149",
        image: comfortFoodImg,
        isVeg: true,
        category: "Home Meals",
      },
      {
        id: "712-5",
        title: "Gulab Jamun (3 Pcs)",
        description: "Hot melt-in-the-mouth khoya gulab jamuns soaked in cardamom syrup.",
        rating: "4.8",
        price: "₹79",
        image: lavaCakeImg,
        isVeg: true,
        category: "Desserts",
      },
    ],
  },

  "pizza-palace": {
    id: "pizza-palace",
    trackingId: "NCK-PIZZA",
    restaurantName: "Pizza Palace & Gourmet Woodfire",
    location: "Baner Road, Near High Street, Pune",
    rating: 4.8,
    reviewsCount: "(480+ reviews)",
    deliveryTime: "20-30 min",
    deliveryFeeText: "Free Delivery above ₹299",
    dietType: "Italian & Crusts",
    offerText: "Flat ₹100 OFF with code PIZZA100",
    chefName: "Chef Marco Verma",
    chefDetails: "Neapolitan certified pizzaiolo • 8+ years experience",
    categories: ["Popular", "Pizza", "Sides", "Drinks", "Desserts"],
    defaultActiveCategory: "Pizza",
    items: [
      {
        id: "pp-1",
        title: "Classic Margherita Pizza",
        description: "San Marzano tomatoes, fresh buffalo mozzarella, hand-torn basil & extra virgin olive oil.",
        rating: "4.9",
        price: "₹289",
        image: img1,
        isVeg: true,
        category: "Pizza",
      },
      {
        id: "pp-2",
        title: "Smoky BBQ Paneer Woodfire",
        description: "Charred marinated paneer cubes, crisp red onions, bell peppers and smokey chipotle drizzle.",
        rating: "4.8",
        price: "₹349",
        image: img4,
        isVeg: true,
        category: "Pizza",
      },
      {
        id: "pp-3",
        title: "Rustic Farmhouse Gourmet Pizza",
        description: "Wild mushrooms, baby spinach, roasted garlic, black olives and sun-dried tomatoes.",
        rating: "4.7",
        price: "₹369",
        image: img5,
        isVeg: true,
        category: "Pizza",
      },
      {
        id: "pp-4",
        title: "Garlic Herb Cheesy Breadsticks",
        description: "Fresh dough baked with parmesan crust and melted mozzarella center with garlic dip.",
        rating: "4.8",
        price: "₹159",
        image: img3,
        isVeg: true,
        category: "Sides",
      },
      {
        id: "pp-5",
        title: "Belgian Molten Chocolate Cake",
        description: "Gooey chocolate center with crisp outer crust, served warm.",
        rating: "4.9",
        price: "₹179",
        image: lavaCakeImg,
        isVeg: true,
        category: "Desserts",
      },
    ],
  },

  "pizza-lab": {
    id: "pizza-lab",
    trackingId: "NCK-PLAB",
    restaurantName: "Pizza Lab Artisanal",
    location: "Koregaon Park, Lane 7, Pune",
    rating: 4.8,
    reviewsCount: "(310+ reviews)",
    deliveryTime: "25 min",
    deliveryFeeText: "Free Delivery",
    dietType: "Artisanal Crusts",
    offerText: "25% OFF on Medium & Large",
    chefName: "Chef Kabir Sen",
    chefDetails: "Fermentation specialist & master baker",
    categories: ["Popular", "Pizza", "Sides", "Drinks", "Desserts"],
    defaultActiveCategory: "Pizza",
    items: [
      {
        id: "pl-1",
        title: "Woodfire Margherita 90-sec",
        description: "Crushed plum tomatoes, fior di latte cheese and Sicilian sea salt.",
        rating: "4.8",
        price: "₹299",
        image: pizzaImg,
        isVeg: true,
        category: "Pizza",
      },
      {
        id: "pl-2",
        title: "Spinach Ricotta Supreme",
        description: "Creamy ricotta florets, wilted spinach, garlic confit on sourdough base.",
        rating: "4.7",
        price: "₹359",
        image: img6,
        isVeg: true,
        category: "Pizza",
      },
      {
        id: "pl-3",
        title: "Four Cheese Quattro Formaggi",
        description: "Mozzarella, Gorgonzola, aged Parmesan and creamy Fontina.",
        rating: "4.9",
        price: "₹389",
        image: img2,
        isVeg: true,
        category: "Pizza",
      },
    ],
  },

  "spice-biryani": {
    id: "spice-biryani",
    trackingId: "NCK-BIRYANI",
    restaurantName: "Spice Biryani Hub",
    location: "Camp, Pune Cantonment, Pune",
    rating: 4.7,
    reviewsCount: "(390+ reviews)",
    deliveryTime: "20-30 min",
    deliveryFeeText: "Free Delivery above ₹249",
    dietType: "Dum Cooked & Mughlai",
    offerText: "Buy 1 Biryani Get 1 Free Dessert",
    chefName: "Ustad Nazeer Khan",
    chefDetails: "30+ years perfecting royal Awadhi & Hyderabadi dum recipes",
    categories: ["Popular", "Biryani", "Kebabs", "Curries", "Breads"],
    defaultActiveCategory: "Biryani",
    items: [
      {
        id: "sb-1",
        title: "Royal Hyderabadi Dum Biryani",
        description: "Aromatic long-grain basmati cooked on slow dum with royal spices and saffron.",
        rating: "4.9",
        price: "₹279",
        image: streetFoodImg,
        isVeg: false,
        category: "Biryani",
      },
      {
        id: "sb-2",
        title: "Paneer Tikka Dum Biryani",
        description: "Charcoal grilled cottage cheese layers infused with caramelized onions and mint.",
        rating: "4.7",
        price: "₹249",
        image: butterChickenImg,
        isVeg: true,
        category: "Biryani",
      },
      {
        id: "sb-3",
        title: "Shahi Galouti Kebab (4 pcs)",
        description: "Melt-in-the-mouth Lucknowi kebabs served with mint chutney and roomali roti.",
        rating: "4.8",
        price: "₹269",
        image: comfortFoodImg,
        isVeg: false,
        category: "Kebabs",
      },
      {
        id: "sb-4",
        title: "Shahi Tukda with Rabdi",
        description: "Crispy fried bread soaked in saffron syrup topped with thick pistachio rabdi.",
        rating: "4.9",
        price: "₹129",
        image: lavaCakeImg,
        isVeg: true,
        category: "Desserts",
      },
    ],
  },

  "biryani-hub": {
    id: "biryani-hub",
    trackingId: "NCK-BHUB",
    restaurantName: "Biryani Hub Express",
    location: "Kothrud Depot, Pune",
    rating: 4.7,
    reviewsCount: "(410+ reviews)",
    deliveryTime: "20 min",
    deliveryFeeText: "Free Delivery",
    dietType: "Authentic Dum Special",
    offerText: "Flat ₹50 OFF on all Handi portions",
    chefName: "Chef Imran Qureshi",
    chefDetails: "Dum cooking heritage from Old Delhi",
    categories: ["Popular", "Biryani", "Starters", "Beverages"],
    defaultActiveCategory: "Biryani",
    items: [
      {
        id: "bh-1",
        title: "Signature Dum Handi Biryani",
        description: "Traditional sealed clay pot dum biryani with rich aroma of kewra and cardamom.",
        rating: "4.8",
        price: "₹299",
        image: streetFoodImg,
        isVeg: false,
        category: "Biryani",
      },
      {
        id: "bh-2",
        title: "Subz Dum Biryani Handi",
        description: "Garden fresh carrots, cauliflower, beans and paneer slow steamed in spices.",
        rating: "4.6",
        price: "₹229",
        image: comfortFoodImg,
        isVeg: true,
        category: "Biryani",
      },
    ],
  },

  "chef-arjun": {
    id: "chef-arjun",
    trackingId: "NCK-ARJUN",
    restaurantName: "Chef Arjun's Tandoor & Curries",
    location: "Viman Nagar, Phoenix Market Road, Pune",
    rating: 4.9,
    reviewsCount: "(520+ reviews)",
    deliveryTime: "25-35 min",
    deliveryFeeText: "Free Delivery",
    dietType: "North Indian & Mughlai",
    offerText: "20% OFF with code ARJUN20",
    chefName: "Chef Arjun Kapoor",
    chefDetails: "Master of North Indian Curries & Clay Oven Tandoor",
    categories: ["Popular", "Curries", "Tandoori", "Breads", "Desserts"],
    defaultActiveCategory: "Popular",
    items: [
      {
        id: "ca-1",
        title: "Chef Arjun's Signature Butter Chicken",
        description: "Tandoori chicken pulled and simmered in velvet butter & makhani tomato sauce.",
        rating: "5.0",
        price: "₹349",
        image: butterChickenImg,
        isVeg: false,
        category: "Curries",
      },
      {
        id: "ca-2",
        title: "Paneer Lababdar",
        description: "Cottage cheese cooked in grated paneer and cashew nut gravy.",
        rating: "4.8",
        price: "₹279",
        image: comfortFoodImg,
        isVeg: true,
        category: "Curries",
      },
      {
        id: "ca-3",
        title: "Garlic Butter Naan (2 pcs)",
        description: "Clay oven leavened bread brushed with melted butter and fresh crushed garlic.",
        rating: "4.9",
        price: "₹99",
        image: streetFoodImg,
        isVeg: true,
        category: "Breads",
      },
    ],
  },

  "baker-delight": {
    id: "baker-delight",
    trackingId: "NCK-BAKER",
    restaurantName: "Baker Delight & Patisserie",
    location: "FC Road, Shivajinagar, Pune",
    rating: 4.6,
    reviewsCount: "(190+ reviews)",
    deliveryTime: "15-25 min",
    deliveryFeeText: "Free Delivery above ₹199",
    dietType: "Bakery & Desserts",
    offerText: "Flat ₹50 OFF on Artisanal Breads",
    chefName: "Chef Sarah D'Souza",
    chefDetails: "French Patisserie diploma • Artisanal Baker",
    categories: ["Popular", "Breads", "Cakes", "Cookies", "Coffee"],
    defaultActiveCategory: "Popular",
    items: [
      {
        id: "bd-1",
        title: "Fresh Butter Croissant (2 pcs)",
        description: "Golden, flakey, 72-layer layered French pastry made with pure dairy butter.",
        rating: "4.8",
        price: "₹149",
        image: streetFoodImg,
        isVeg: true,
        category: "Breads",
      },
      {
        id: "bd-2",
        title: "Dark Belgian Truffle Pastry",
        description: "Rich 70% dark chocolate ganache layered with moist sponge cake.",
        rating: "4.9",
        price: "₹169",
        image: lavaCakeImg,
        isVeg: true,
        category: "Cakes",
      },
    ],
  },

  "wok-station": {
    id: "wok-station",
    trackingId: "NCK-WOK",
    restaurantName: "Wok Station Pan-Asian",
    location: "Aundh, IT Park Road, Pune",
    rating: 4.7,
    reviewsCount: "(280+ reviews)",
    deliveryTime: "25 min",
    deliveryFeeText: "Free Delivery",
    dietType: "Pan-Asian & Noodles",
    offerText: "Complimentary Dimsums above ₹400",
    chefName: "Chef Yuki Chen",
    chefDetails: "10+ years specializing in Wok Hei & Japanese Ramen",
    categories: ["Popular", "Noodles", "Ramen", "Dimsums", "Curries"],
    defaultActiveCategory: "Popular",
    items: [
      {
        id: "ws-1",
        title: "Tonkotsu Style Rich Noodle Ramen",
        description: "Slow simmered broth, springy ramen noodles, scallions, bamboo shoots and seaweed.",
        rating: "4.9",
        price: "₹349",
        image: ramenImg,
        isVeg: false,
        category: "Ramen",
      },
      {
        id: "ws-2",
        title: "Pad Thai Street Wok Noodles",
        description: "Flat rice noodles stir-fried in tamarind sauce with crushed peanuts and sprouts.",
        rating: "4.7",
        price: "₹269",
        image: curryImg,
        isVeg: true,
        category: "Noodles",
      },
    ],
  },
};

export function formatTitleFromSlug(slug: string): string {
  if (!slug) return "Kitchen";
  return slug
    .replace(/^kitchen-?/i, "")
    .replace(/[-_]/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function getKitchenById(id: string): KitchenData {
  const normalized = (id || "").toLowerCase().trim();

  // 1. Direct registry hit
  if (KITCHENS_REGISTRY[normalized]) {
    return KITCHENS_REGISTRY[normalized];
  }

  // 2. Lookup by trackingId
  const byTracking = Object.values(KITCHENS_REGISTRY).find(
    (k) => (k.trackingId || "").toLowerCase() === normalized
  );
  if (byTracking) return byTracking;

  // 3. Fallback matching (e.g. "pizza" in id -> pizza-palace, "biryani" in id -> spice-biryani)
  if (normalized.includes("pizza")) return { ...KITCHENS_REGISTRY["pizza-palace"], id };
  if (normalized.includes("biryani")) return { ...KITCHENS_REGISTRY["spice-biryani"], id };
  if (normalized.includes("bakery") || normalized.includes("bake")) return { ...KITCHENS_REGISTRY["baker-delight"], id };
  if (normalized.includes("arjun") || normalized.includes("curry")) return { ...KITCHENS_REGISTRY["chef-arjun"], id };
  if (normalized.includes("wok") || normalized.includes("ramen")) return { ...KITCHENS_REGISTRY["wok-station"], id };

  // 4. Dynamic fallback with formatted title
  const displayName = formatTitleFromSlug(id) + " Kitchen";
  return {
    id: id,
    trackingId: `NCK-${id.toUpperCase()}`,
    restaurantName: displayName,
    location: "Kothrud, Pune, Maharashtra",
    rating: 4.5,
    reviewsCount: "(180+ reviews)",
    deliveryTime: "25-35 min",
    deliveryFeeText: "Free Delivery",
    dietType: "Multi-Cuisine",
    offerText: "20% OFF on First Order",
    chefName: "Head Chef " + formatTitleFromSlug(id),
    chefDetails: "Specialized gourmet cloud chef",
    categories: ["Popular", "Meals", "Starters", "Drinks"],
    defaultActiveCategory: "Popular",
    items: KITCHENS_REGISTRY["7-12-kitchen"].items,
  };
}
