import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB Seed...");
    const hashPassword = await bcrypt.hash("password123", 10);

    // 1. Superadmin
    const admin = await prisma.user.upsert({
        where: { email: "superadmin@admin.com" },
        update: {
            passwordHash: hashPassword,
            role: "SUPERADMIN",
            isActive: true,
        },
        create: {
            email: "superadmin@admin.com",
            passwordHash: hashPassword,
            role: "SUPERADMIN",
            name: "System Admin",
            phone: "1234567890",
            city: "Global",
            pincode: "000000",
            isActive: true,
        },
    });
    console.log("Seeded Superadmin:", admin.email);

    // 2. Agent
    const agentUser = await prisma.user.upsert({
        where: { email: "agent@domain.com" },
        update: {
            passwordHash: hashPassword,
            role: "AGENT",
            isActive: true,
        },
        create: {
            email: "agent@domain.com",
            passwordHash: hashPassword,
            role: "AGENT",
            name: "Operation Agent 1",
            phone: "0987654321",
            city: "Pune",
            pincode: "411001",
            isActive: true,
            agentProfile: {
                create: {}
            }
        },
    });
    console.log("Seeded Agent:", agentUser.email);

    // 3. Customer
    const customerUser = await prisma.user.upsert({
        where: { email: "customer@domain.com" },
        update: {
            passwordHash: hashPassword,
            role: "USER",
            isActive: true,
        },
        create: {
            email: "customer@domain.com",
            passwordHash: hashPassword,
            role: "USER",
            name: "John Customer",
            phone: "5544332211",
            city: "Pune",
            pincode: "411057",
            isActive: true,
        },
    });
    console.log("Seeded Customer:", customerUser.email);

    // Map existing FoodCategories by lowercase name
    const allFoodCats = await prisma.foodCategory.findMany();
    const foodCatMap = new Map<string, string>();
    allFoodCats.forEach(fc => foodCatMap.set(fc.name.toLowerCase().trim(), fc.id));

    // Kitchen Definitions with strict locality-specific service areas (5 km max)
    const kitchensToSeed = [
        {
            email: "yash@kitchen.com",
            name: "Yash Kitchen",
            businessName: "Yash Kitchen",
            phone: "9876543210",
            city: "Pune",
            pincode: "411057",
            locality: "Rajiv Gandhi Infotech Park, Phase 1, Hinjawadi",
            lat: 18.5913,
            lng: 73.7389,
            type: "HOMELY_FOOD",
            foodType: "BOTH",
            trackingId: "TRK-YASH-01",
            imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
            servedPins: [
                { pincode: "411057", name: "Rajiv Gandhi Infotech Park / Hinjawadi" },
                { pincode: "411061", name: "Wakad" },
            ],
            dishes: [
                { name: "Special Maharashtrian Veg Thali", cat: "meal", price: 150, type: "VEG", desc: "4 Chapatis, 2 Sabzis, Dal Tadka, Jeera Rice, Gulab Jamun, Papad & Pickle" },
                { name: "Authentic Kanda Poha", cat: "pohe", price: 45, type: "VEG", desc: "Traditional soft pressed rice flakes with roasted peanuts, mustard & fresh coriander" },
                { name: "Dal Khichdi Bowl", cat: "dalrice", price: 110, type: "VEG", desc: "Comforting slow-cooked yellow dal khichdi finished with pure desi ghee tadka" },
                { name: "Special Paneer Handi Combo", cat: "meal", price: 210, type: "VEG", desc: "Rich and creamy cottage cheese curry with 3 butter phulkas and spiced onion salad" },
                { name: "Desi Ghee Rawa Sheera", cat: "shira", price: 50, type: "VEG", desc: "Warm semolina sweet dessert infused with pure ghee, cardamom and dry fruits" },
                { name: "Alphonso Mango Thick Shake", cat: "shake", price: 80, type: "VEG", desc: "Creamy seasonal mango milkshake made with real Alphonso mango pulp" },
            ]
        },
        {
            email: "artisano@domain.com",
            name: "Artisano Oven",
            businessName: "Artisano Wood-Fired Oven",
            phone: "9822004455",
            city: "Pune",
            pincode: "411038",
            locality: "Kothrud",
            lat: 18.5074,
            lng: 73.8077,
            type: "BAKERY",
            foodType: "BOTH",
            trackingId: "TRK-ARTISANO-01",
            imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
            servedPins: [
                { pincode: "411038", name: "Kothrud" },
                { pincode: "411052", name: "Karve Nagar" },
            ],
            dishes: [
                { name: "Wood-Fired Farmhouse Pizza", cat: "pizza", price: 270, type: "VEG", desc: "Sourdough crust topped with bell peppers, olives, corn & fresh mozzarella" },
                { name: "Double Smash Cheesy Burger", cat: "burger", price: 180, type: "NON_VEG", desc: "Crisp grilled double patty with melted cheddar and smoky house sauce" },
                { name: "Dutch Truffle Pastry", cat: "pastry", price: 85, type: "VEG", desc: "Rich dark Belgian chocolate sponge layered with smooth ganache" },
                { name: "Black Forest Celebration Cake (500g)", cat: "cake", price: 420, type: "VEG", desc: "Classic whipped cream cake layered with tart cherries and chocolate shavings" },
            ]
        },
        {
            email: "annapurna@domain.com",
            name: "Annapurna Kitchen",
            businessName: "Annapurna Homely Mess",
            phone: "9876501234",
            city: "Pune",
            pincode: "411051",
            locality: "Karve Nagar",
            lat: 18.5016,
            lng: 73.8216,
            type: "HOMELY_FOOD",
            foodType: "VEG",
            trackingId: "TRK-ANNAPURNA-01",
            imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
            servedPins: [
                { pincode: "411051", name: "Karve Nagar" },
                { pincode: "411052", name: "Karve Nagar" },
                { pincode: "411038", name: "Kothrud" },
            ],
            dishes: [
                { name: "Special Puran Poli Thali", cat: "meal", price: 180, type: "VEG", desc: "2 Soft Puran Polis with Katachi Amti, Rice & Batata Bhaji" },
                { name: "Sabudana Khichdi Special", cat: "sabudana", price: 65, type: "VEG", desc: "Upvas special tapioca pearls roasted with crunchy roasted peanuts" },
                { name: "Desi Ghee Rawa Sheera", cat: "shira", price: 50, type: "VEG", desc: "Golden semolina sweet pudding cooked in pure milk and saffron" },
                { name: "Rava Upma Bowl", cat: "upma", price: 40, type: "VEG", desc: "Healthy savory semolina breakfast tempered with mustard and ginger" },
            ]
        },
        {
            email: "royalhandi@domain.com",
            name: "Royal Handi",
            businessName: "Royal Handi & Biryani Hub",
            phone: "9850112233",
            city: "Pune",
            pincode: "411005",
            locality: "Shivajinagar",
            lat: 18.5314,
            lng: 73.8446,
            type: "MESS",
            foodType: "BOTH",
            trackingId: "TRK-ROYALHANDI-01",
            imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
            servedPins: [
                { pincode: "411005", name: "Shivajinagar" },
                { pincode: "411004", name: "Deccan Gymkhana" },
            ],
            dishes: [
                { name: "Royal Dum Handi Biryani", cat: "meal", price: 250, type: "BOTH", desc: "Aromatic aged basmati rice cooked on slow dum with royal spices and raita" },
                { name: "Special Paneer Handi Combo", cat: "meal", price: 210, type: "VEG", desc: "Rich onion-tomato gravy with soft paneer cubes, served with 3 butter rotis" },
                { name: "Alphonso Mango Thick Shake", cat: "shake", price: 80, type: "VEG", desc: "Fresh seasonal mango puree blended thick with cold whole milk" },
            ]
        },
        {
            email: "greenearth@domain.com",
            name: "Green Earth",
            businessName: "Green Earth South Kitchen",
            phone: "9890223344",
            city: "Pune",
            pincode: "411045",
            locality: "Baner",
            lat: 18.5590,
            lng: 73.7868,
            type: "HOMELY_FOOD",
            foodType: "VEG",
            trackingId: "TRK-GREENEARTH-01",
            imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
            servedPins: [
                { pincode: "411045", name: "Baner" },
                { pincode: "411007", name: "Aundh" },
            ],
            dishes: [
                { name: "Crispy Butter Masala Dosa", cat: "dosa", price: 95, type: "VEG", desc: "Crisp fermented crepe roasted with butter, potato masala, coconut chutney & sambar" },
                { name: "Steamed Button Idli Plate", cat: "idli", price: 60, type: "VEG", desc: "4 pillowy soft steamed rice cakes served hot with drumstick sambar" },
                { name: "Cold Badam Pista Milkshake", cat: "shake", price: 75, type: "VEG", desc: "Chilled almond-pistachio thick shake flavored with cardamom" },
            ]
        },
        {
            email: "seller@domain.com",
            name: "Radha's Kitchen",
            businessName: "Radha's Kitchen Base",
            phone: "1122334455",
            city: "Pune",
            pincode: "411028",
            locality: "Hadapsar",
            lat: 18.5089,
            lng: 73.9259,
            type: "HOMELY_FOOD",
            foodType: "BOTH",
            trackingId: "TRK-RADHA-01",
            imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
            servedPins: [
                { pincode: "411028", name: "Hadapsar" },
            ],
            dishes: [
                { name: "Maharashtrian Special Veg Thali", cat: "meal", price: 150, type: "VEG", desc: "4 Chapati, 2 Sabzi, Dal, Jeera Rice, Sweet, Pickle & Papad" },
                { name: "Dal Khichdi Bowl", cat: "dalrice", price: 110, type: "VEG", desc: "Slow-cooked Moong Dal Khichdi with pure desi ghee tempering" },
                { name: "Authentic Kanda Poha", cat: "pohe", price: 45, type: "VEG", desc: "Traditional flattened rice seasoned with mustard, curry leaves & peanuts" },
            ]
        }
    ];

    for (const k of kitchensToSeed) {
        const u = await prisma.user.upsert({
            where: { email: k.email },
            update: {
                passwordHash: hashPassword,
                role: "SELLER",
                isActive: true,
                name: k.name,
                city: k.city,
                pincode: k.pincode,
                phone: k.phone,
            },
            create: {
                email: k.email,
                passwordHash: hashPassword,
                role: "SELLER",
                name: k.name,
                phone: k.phone,
                city: k.city,
                pincode: k.pincode,
                isActive: true,
            },
        });

        const profile = await prisma.sellerProfile.upsert({
            where: { userId: u.id },
            update: {
                businessName: k.businessName,
                type: k.type,
                foodType: k.foodType,
                verificationStatus: "APPROVED",
                isOnline: true,
                addressLocality: k.locality,
                latitude: k.lat,
                longitude: k.lng,
                isLocationPinned: true,
                deliveryRadiusKm: 5.0,
                kitchenImages: JSON.stringify([k.imageUrl]),
            },
            create: {
                userId: u.id,
                businessName: k.businessName,
                type: k.type,
                foodType: k.foodType,
                adhaarUrl: "verified-adhaar",
                trackingId: k.trackingId,
                verificationStatus: "APPROVED",
                isOnline: true,
                addressLocality: k.locality,
                latitude: k.lat,
                longitude: k.lng,
                isLocationPinned: true,
                deliveryRadiusKm: 5.0,
                kitchenImages: JSON.stringify([k.imageUrl]),
            },
        });

        // Add strict served pincodes
        for (const sp of k.servedPins) {
            await prisma.servedPincode.upsert({
                where: {
                    sellerId_pincode: {
                        sellerId: profile.id,
                        pincode: sp.pincode,
                    }
                },
                update: { name: sp.name },
                create: {
                    sellerId: profile.id,
                    pincode: sp.pincode,
                    name: sp.name,
                }
            });
        }

        // Add dishes
        for (const dish of k.dishes) {
            const catId = foodCatMap.get(dish.cat.toLowerCase()) || null;
            const existingDish = await prisma.foodItem.findFirst({
                where: {
                    sellerId: profile.id,
                    name: dish.name,
                }
            });

            if (!existingDish) {
                await prisma.foodItem.create({
                    data: {
                        sellerId: profile.id,
                        name: dish.name,
                        description: dish.desc,
                        price: dish.price,
                        itemType: dish.type,
                        foodCategoryId: catId,
                        isAvailable: true,
                        stockQuantity: 50,
                        imageUrl: k.imageUrl,
                    }
                });
            } else {
                await prisma.foodItem.update({
                    where: { id: existingDish.id },
                    data: {
                        description: dish.desc,
                        price: dish.price,
                        itemType: dish.type,
                        foodCategoryId: catId,
                        isAvailable: true,
                    }
                });
            }
        }

        console.log(`Seeded approved kitchen: ${k.businessName} in ${k.locality} (${k.pincode})`);
    }

    // Pending seller for testing
    await prisma.user.upsert({
        where: { email: "pending_seller@domain.com" },
        update: {
            passwordHash: hashPassword,
            role: "SELLER",
            isActive: true,
        },
        create: {
            email: "pending_seller@domain.com",
            passwordHash: hashPassword,
            role: "SELLER",
            name: "Rahul's Bakery",
            phone: "9988776655",
            city: "Mumbai",
            pincode: "400001",
            isActive: true,
            sellerProfile: {
                create: {
                    type: "BAKERY",
                    adhaarUrl: "fake-url-2",
                    trackingId: "TRK-SEED-99",
                    verificationStatus: "PENDING",
                    businessName: "Rahul's Fresh Bakes"
                }
            }
        },
    });
    console.log("Seeded Pending Seller: pending_seller@domain.com");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
