import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB Seed with authentic seller and menu data...");
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

    // 4. Map FoodCategories
    const allFoodCats = await prisma.foodCategory.findMany();
    const foodCatMap = new Map<string, string>();
    allFoodCats.forEach(fc => foodCatMap.set(fc.name.toLowerCase().trim(), fc.id));

    let cakeCatId = foodCatMap.get("cake");
    if (!cakeCatId) {
        const createdCat = await prisma.foodCategory.create({
            data: {
                name: "Cake",
                imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1782900799/neo-cloud-room/categories/hcqwhfqe99qdzin92zo5.jpg"
            }
        });
        cakeCatId = createdCat.id;
        foodCatMap.set("cake", cakeCatId);
    }

    // 5. Authentic Sellers
    // A. Yash's Kitchen (Hinjawadi 411057)
    const yashUser = await prisma.user.upsert({
        where: { email: "yashbandgar5560@gmail.com" },
        update: {
            passwordHash: hashPassword,
            role: "SELLER",
            name: "Yash's Kitchen",
            city: "Pune",
            pincode: "411057",
            phone: "9876543210",
            isActive: true,
        },
        create: {
            email: "yashbandgar5560@gmail.com",
            passwordHash: hashPassword,
            role: "SELLER",
            name: "Yash's Kitchen",
            phone: "9876543210",
            city: "Pune",
            pincode: "411057",
            isActive: true,
        },
    });

    const yashSeller = await prisma.sellerProfile.upsert({
        where: { userId: yashUser.id },
        update: {
            businessName: "Yash's Kitchen",
            trackingId: "SHOP-7DQT3N",
            type: "Bakery, Cafe, Homely food, Mess, South Indian, Lunch(Homely Food)",
            foodType: "BOTH",
            verificationStatus: "APPROVED",
            isOnline: true,
            addressLocality: "Kaka Halwai, Hinjawadi Phase 2 Road, Sakhare Vasti, Hinjawadi, Marunji, Mulshi Subdistrict, Pune District, Maharashtra, 411057, India",
            latitude: 18.59218893338844,
            longitude: 73.73770513575333,
            isLocationPinned: true,
            deliveryRadiusKm: 5.0,
            kitchenImages: JSON.stringify(["https://res.cloudinary.com/daiwwk5v7/image/upload/v1790162026/neo-cloud-room/sellers/k2l2k0uly4kb3uj3ynam.png"]),
        },
        create: {
            userId: yashUser.id,
            businessName: "Yash's Kitchen",
            trackingId: "SHOP-7DQT3N",
            type: "Bakery, Cafe, Homely food, Mess, South Indian, Lunch(Homely Food)",
            foodType: "BOTH",
            adhaarUrl: "verified-adhaar",
            verificationStatus: "APPROVED",
            isOnline: true,
            addressLocality: "Kaka Halwai, Hinjawadi Phase 2 Road, Sakhare Vasti, Hinjawadi, Marunji, Mulshi Subdistrict, Pune District, Maharashtra, 411057, India",
            latitude: 18.59218893338844,
            longitude: 73.73770513575333,
            isLocationPinned: true,
            deliveryRadiusKm: 5.0,
            kitchenImages: JSON.stringify(["https://res.cloudinary.com/daiwwk5v7/image/upload/v1790162026/neo-cloud-room/sellers/k2l2k0uly4kb3uj3ynam.png"]),
        },
    });

    await prisma.servedPincode.upsert({
        where: { sellerId_pincode: { sellerId: yashSeller.id, pincode: "411057" } },
        update: { name: "Rajiv Gandhi Infotech Park / Hinjawadi" },
        create: { sellerId: yashSeller.id, pincode: "411057", name: "Rajiv Gandhi Infotech Park / Hinjawadi" }
    });

    const existingBlackForest = await prisma.foodItem.findFirst({
        where: { sellerId: yashSeller.id, name: "Black Forest " }
    });
    if (!existingBlackForest) {
        await prisma.foodItem.create({
            data: {
                sellerId: yashSeller.id,
                name: "Black Forest ",
                description: "Rich chocolate sponge layered with whipped cream, dark chocolate shavings, and juicy cherries for a classic Black Forest delight.",
                price: 499,
                imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790574319/neo-cloud-room/menu/tklfelaivpz2dzcx076x.png",
                itemType: "VEG",
                stockQuantity: 5,
                isAvailable: true,
                foodCategoryId: cakeCatId,
            }
        });
    }
    console.log("Seeded Yash's Kitchen & Black Forest Cake");

    // B. radha's kitchen (Dattawadi / Karve Nagar 411051)
    const radhaUser = await prisma.user.upsert({
        where: { email: "seller@domain.com" },
        update: {
            passwordHash: hashPassword,
            role: "SELLER",
            name: "seller",
            city: "Pune",
            pincode: "411051",
            phone: "1122334455",
            isActive: true,
        },
        create: {
            email: "seller@domain.com",
            passwordHash: hashPassword,
            role: "SELLER",
            name: "seller",
            phone: "1122334455",
            city: "Pune",
            pincode: "411051",
            isActive: true,
        },
    });

    const radhaSeller = await prisma.sellerProfile.upsert({
        where: { userId: radhaUser.id },
        update: {
            businessName: "radha's kitchen",
            trackingId: "SHOP-IBIGV2",
            type: "HOMELY_FOOD",
            foodType: "BOTH",
            verificationStatus: "APPROVED",
            isOnline: true,
            addressLocality: "201 2nd floor, dattawadi near mhasoba chouk, near pmc school",
            latitude: 18.5016,
            longitude: 73.8216,
            isLocationPinned: true,
            deliveryRadiusKm: 5.0,
            kitchenImages: JSON.stringify(["https://res.cloudinary.com/daiwwk5v7/image/upload/v1783143685/neo-cloud-room/sellers/frkbtwlzxlk61ihe1myr.jpg"]),
            bannerImageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1783143685/neo-cloud-room/sellers/frkbtwlzxlk61ihe1myr.jpg",
        },
        create: {
            userId: radhaUser.id,
            businessName: "radha's kitchen",
            trackingId: "SHOP-IBIGV2",
            type: "HOMELY_FOOD",
            foodType: "BOTH",
            adhaarUrl: "fake-url",
            verificationStatus: "APPROVED",
            isOnline: true,
            addressLocality: "201 2nd floor, dattawadi near mhasoba chouk, near pmc school",
            latitude: 18.5016,
            longitude: 73.8216,
            isLocationPinned: true,
            deliveryRadiusKm: 5.0,
            kitchenImages: JSON.stringify(["https://res.cloudinary.com/daiwwk5v7/image/upload/v1783143685/neo-cloud-room/sellers/frkbtwlzxlk61ihe1myr.jpg"]),
            bannerImageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1783143685/neo-cloud-room/sellers/frkbtwlzxlk61ihe1myr.jpg",
        },
    });

    await prisma.servedPincode.upsert({
        where: { sellerId_pincode: { sellerId: radhaSeller.id, pincode: "411051" } },
        update: { name: "Karve Nagar / Dattawadi" },
        create: { sellerId: radhaSeller.id, pincode: "411051", name: "Karve Nagar / Dattawadi" }
    });

    const radhaDishes = [
        {
            name: "Grilled Veggie Wrap ",
            price: 179,
            type: "VEG",
            desc: "Fresh grilled vegetables tossed with herbs and creamy dressing in a warm flatbread wrap",
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790750403/neo-cloud-room/menu/gx4or7ljwlsf4aen31zr.png",
            cat: "meal"
        },
        {
            name: "Paneer Quinoa Bowl",
            price: 299,
            type: "VEG",
            desc: "Nutritious roasted paneer cubes served over seasoned protein-rich quinoa with fresh salad",
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790750172/neo-cloud-room/menu/soloww11a8kp2pmczyk9.png",
            cat: "meal"
        },
        {
            name: "Chiken Thali ",
            price: 259,
            type: "NON_VEG",
            desc: "Traditional slow-cooked chicken gravy served with 3 soft rotis, aromatic rice and salad",
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790578751/neo-cloud-room/menu/ml4rfiyk7k1whttlm8mq.png",
            cat: "meal"
        },
        {
            name: "Jeera Rice Plate ",
            price: 60,
            type: "VEG",
            desc: "Fragrant basmati rice gently tempered with roasted cumin seeds and fresh coriander",
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790659086/neo-cloud-room/menu/acmz5oojk1qjouur7xjp.png",
            cat: "dalrice"
        },
        {
            name: "lemon rice ",
            price: 89,
            type: "VEG",
            desc: "Zesty tempered rice infused with fresh lemon juice, mustard seeds, curry leaves & peanuts",
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790687241/neo-cloud-room/menu/b4u0b0todmuk14hpr3i5.png",
            cat: "dalrice"
        },
        {
            name: "Cold Coffee",
            price: 60,
            type: "VEG",
            desc: "Thick creamy chilled blended coffee with a rich frothy top",
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790579225/neo-cloud-room/menu/go58tn78a68zlqlmdrsk.png",
            cat: "shake"
        },
        {
            name: "Cheese Burger ",
            price: 79,
            type: "VEG",
            desc: "Crisp potato-herb patty topped with melted cheese, fresh tomato, onion and house sauce",
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790578162/neo-cloud-room/menu/e9fehkymyxxc87e38wqh.png",
            cat: "burger"
        },
        {
            name: "Dosa ",
            price: 79,
            type: "VEG",
            desc: "Golden thin crispy crepe served hot with coconut chutney and tangy vegetable sambar",
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790578827/neo-cloud-room/menu/gywcqerwusk8sftjutt2.png",
            cat: "dosa"
        },
    ];

    for (const d of radhaDishes) {
        const catId = foodCatMap.get(d.cat.toLowerCase()) || null;
        const existing = await prisma.foodItem.findFirst({
            where: { sellerId: radhaSeller.id, name: d.name }
        });
        if (!existing) {
            await prisma.foodItem.create({
                data: {
                    sellerId: radhaSeller.id,
                    name: d.name,
                    description: d.desc,
                    price: d.price,
                    itemType: d.type,
                    imageUrl: d.imageUrl,
                    foodCategoryId: catId,
                    isAvailable: true,
                    stockQuantity: 20,
                }
            });
        } else {
            await prisma.foodItem.update({
                where: { id: existing.id },
                data: {
                    description: d.desc,
                    price: d.price,
                    itemType: d.type,
                    imageUrl: d.imageUrl,
                    foodCategoryId: catId,
                    isAvailable: true,
                }
            });
        }
    }
    console.log("Seeded radha's kitchen with dishes and authentic Cloudinary photos");

    // C. Yewale's Kitchens (Deccan Gymkhana 411004)
    const yewaleUser = await prisma.user.upsert({
        where: { email: "saiyewale13@gmail.com" },
        update: {
            passwordHash: hashPassword,
            role: "SELLER",
            name: "Sai Yewale",
            city: "Pune",
            pincode: "411004",
            phone: "9988776611",
            isActive: true,
        },
        create: {
            email: "saiyewale13@gmail.com",
            passwordHash: hashPassword,
            role: "SELLER",
            name: "Sai Yewale",
            phone: "9988776611",
            city: "Pune",
            pincode: "411004",
            isActive: true,
        },
    });

    const yewaleSeller = await prisma.sellerProfile.upsert({
        where: { userId: yewaleUser.id },
        update: {
            businessName: "Yewale's Kitchens",
            trackingId: "SHOP-1XJWXN",
            type: "MESS",
            foodType: "BOTH",
            verificationStatus: "APPROVED",
            isOnline: true,
            addressLocality: "Kashibai Vishnu Sane Path, Deccan Gymkhana, Pune",
            latitude: 18.5165629,
            longitude: 73.8415,
            isLocationPinned: true,
            deliveryRadiusKm: 5.0,
            kitchenImages: JSON.stringify(["https://res.cloudinary.com/daiwwk5v7/image/upload/v1790167021/neo-cloud-room/sellers/eksk0g2fgxqjanqixhnx.png"]),
            bannerImageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790167021/neo-cloud-room/sellers/eksk0g2fgxqjanqixhnx.png",
        },
        create: {
            userId: yewaleUser.id,
            businessName: "Yewale's Kitchens",
            trackingId: "SHOP-1XJWXN",
            type: "MESS",
            foodType: "BOTH",
            adhaarUrl: "fake-url",
            verificationStatus: "APPROVED",
            isOnline: true,
            addressLocality: "Kashibai Vishnu Sane Path, Deccan Gymkhana, Pune",
            latitude: 18.5165629,
            longitude: 73.8415,
            isLocationPinned: true,
            deliveryRadiusKm: 5.0,
            kitchenImages: JSON.stringify(["https://res.cloudinary.com/daiwwk5v7/image/upload/v1790167021/neo-cloud-room/sellers/eksk0g2fgxqjanqixhnx.png"]),
            bannerImageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790167021/neo-cloud-room/sellers/eksk0g2fgxqjanqixhnx.png",
        },
    });

    await prisma.servedPincode.upsert({
        where: { sellerId_pincode: { sellerId: yewaleSeller.id, pincode: "411004" } },
        update: { name: "Deccan Gymkhana" },
        create: { sellerId: yewaleSeller.id, pincode: "411004", name: "Deccan Gymkhana" }
    });

    const mealCatId = foodCatMap.get("meal") || null;
    const existingBiryani = await prisma.foodItem.findFirst({
        where: { sellerId: yewaleSeller.id, name: "Biryani" }
    });
    if (!existingBiryani) {
        await prisma.foodItem.create({
            data: {
                sellerId: yewaleSeller.id,
                name: "Biryani",
                description: "Authentic dum-cooked spiced chicken biryani served with flavored raita and salan.",
                price: 500,
                itemType: "NON_VEG",
                imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790157604/neo-cloud-room/menu/l8ov0oueeydsqxkhw50j.png",
                foodCategoryId: mealCatId,
                isAvailable: true,
                stockQuantity: 20,
            }
        });
    } else {
        await prisma.foodItem.update({
            where: { id: existingBiryani.id },
            data: {
                description: "Authentic dum-cooked spiced chicken biryani served with flavored raita and salan.",
                price: 500,
                itemType: "NON_VEG",
                imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790157604/neo-cloud-room/menu/l8ov0oueeydsqxkhw50j.png",
                foodCategoryId: mealCatId,
                isAvailable: true,
            }
        });
    }
    console.log("Seeded Yewale's Kitchens with Biryani and authentic Cloudinary photo");

    // D. Additional Community Kitchens
    const additionalKitchens = [
        {
            email: "pranav@gmail.com",
            name: "Pranav",
            businessName: "Pranav Kitchen",
            trackingId: "SHOP-J0ADU0",
            pincode: "411051",
            locality: "Karve Nagar, Pune",
            lat: 18.5016,
            lng: 73.8216,
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1789645244/neo-cloud-room/sellers/pwsniwmlsrivaknk067q.jpg",
        },
        {
            email: "tanuja97@gmail.com",
            name: "tanuja",
            businessName: "tanuja's Kitchen",
            trackingId: "SHOP-1F4UDW",
            pincode: "411051",
            locality: "Karve Nagar, Pune",
            lat: 18.4965,
            lng: 73.8188,
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1789815622/neo-cloud-room/sellers/vycvgi49r2lommmbpgu5.jpg",
        },
        {
            email: "ritu@gmail.com",
            name: "Ritu",
            businessName: "Ritu's Kitchen",
            trackingId: "SHOP-ID1CNL",
            pincode: "411038",
            locality: "Sahyadri Hospital, Paud Road, Kothrud, Pune",
            lat: 18.5074,
            lng: 73.8077,
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1789722849/neo-cloud-room/sellers/ylumdix1wk6lrgciia8m.jpg",
        },
        {
            email: ".mitesh@gmail.com",
            name: "1234567890",
            businessName: "Sagar Kitchen",
            trackingId: "SHOP-RZROKV",
            pincode: "411051",
            locality: "Lotus Residency Road, Karve Nagar, Pune",
            lat: 18.5016,
            lng: 73.8216,
            imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1789801121/neo-cloud-room/sellers/cabpoo8lzywmfwxlfawb.jpg",
        },
        {
            email: "yashbandgar5550@gmail.com",
            name: "Yash Bandgar",
            businessName: "Strawberry Bites",
            trackingId: "SHOP-MGEW9M",
            pincode: "411057",
            locality: "Hinjawadi, Pune",
            lat: 18.5913,
            lng: 73.7389,
            status: "PENDING",
            imageUrl: undefined,
        }
    ];

    for (const s of additionalKitchens) {
        const u = await prisma.user.upsert({
            where: { email: s.email },
            update: {
                passwordHash: hashPassword,
                role: "SELLER",
                name: s.name,
                city: "Pune",
                pincode: s.pincode,
                phone: "9988776655",
                isActive: true,
            },
            create: {
                email: s.email,
                passwordHash: hashPassword,
                role: "SELLER",
                name: s.name,
                phone: "9988776655",
                city: "Pune",
                pincode: s.pincode,
                isActive: true,
            },
        });

        const profile = await prisma.sellerProfile.upsert({
            where: { userId: u.id },
            update: {
                businessName: s.businessName,
                trackingId: s.trackingId,
                type: "HOMELY_FOOD",
                foodType: "BOTH",
                verificationStatus: s.status || "APPROVED",
                isOnline: true,
                addressLocality: s.locality,
                latitude: s.lat,
                longitude: s.lng,
                isLocationPinned: true,
                deliveryRadiusKm: 5.0,
                kitchenImages: s.imageUrl ? JSON.stringify([s.imageUrl]) : "[]",
                bannerImageUrl: s.imageUrl || null,
            },
            create: {
                userId: u.id,
                businessName: s.businessName,
                trackingId: s.trackingId,
                type: "HOMELY_FOOD",
                foodType: "BOTH",
                adhaarUrl: "fake-url",
                verificationStatus: s.status || "APPROVED",
                isOnline: true,
                addressLocality: s.locality,
                latitude: s.lat,
                longitude: s.lng,
                isLocationPinned: true,
                deliveryRadiusKm: 5.0,
                kitchenImages: s.imageUrl ? JSON.stringify([s.imageUrl]) : "[]",
                bannerImageUrl: s.imageUrl || null,
            },
        });

        await prisma.servedPincode.upsert({
            where: { sellerId_pincode: { sellerId: profile.id, pincode: s.pincode } },
            update: { name: s.locality },
            create: { sellerId: profile.id, pincode: s.pincode, name: s.locality }
        });

        console.log(`Seeded seller: ${s.businessName}`);
    }

    console.log("All authentic data seeded successfully!");
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
