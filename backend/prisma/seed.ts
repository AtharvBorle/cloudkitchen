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
            dishes: [
                {
                    name: "Idli Sambar Plate",
                    price: 50,
                    type: "VEG",
                    desc: "Steamed fluffy soft rice idlis served with hot spicy lentil sambar and freshly ground coconut chutney.",
                    imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1782901188/neo-cloud-room/categories/wt278t8swdjesgvh5yso.jpg",
                    cat: "idli"
                },
                {
                    name: "Homely Veg Thali",
                    price: 150,
                    type: "VEG",
                    desc: "Wholesome daily thali with fresh seasonal vegetables, dal tadka, steamed basmati rice, 3 soft phulkas, and fresh salad.",
                    imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1782971267/neo-cloud-room/categories/zwy6klrcbxepkcjr1big.webp",
                    cat: "meal"
                }
            ]
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
            dishes: [
                {
                    name: "Kanda Pohe",
                    price: 40,
                    type: "VEG",
                    desc: "Traditional Maharashtrian flattened rice tossed with sauteed onions, roasted peanuts, mustard seeds, and fresh coriander.",
                    imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1782901318/neo-cloud-room/categories/spopfwsczcalskibua4i.jpg",
                    cat: "pohe"
                },
                {
                    name: "Rava Upma",
                    price: 40,
                    type: "VEG",
                    desc: "Savory roasted semolina cooked with seasoned curry leaves, green chilies, ginger, and crunchy cashews.",
                    imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1782901346/neo-cloud-room/categories/rut1n8r4au3dl7adsipy.jpg",
                    cat: "upma"
                }
            ]
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
            dishes: [
                {
                    name: "Sabudana Khichdi",
                    price: 60,
                    type: "VEG",
                    desc: "Fluffy soaked sago pearls tempered with roasted crushed peanuts, green chilies, cumin, and fresh lemon.",
                    imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1782901291/neo-cloud-room/categories/x2an3rpbw3jriwv8qkmf.jpg",
                    cat: "sabudana"
                },
                {
                    name: "Sujatha Kesari Shira",
                    price: 50,
                    type: "VEG",
                    desc: "Rich aromatic semolina halwa cooked in pure desi ghee, flavored with saffron, cardamom, and toasted nuts.",
                    imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1782901306/neo-cloud-room/categories/wphntimbwbduwuvzr6ge.jpg",
                    cat: "shira"
                }
            ]
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
            dishes: [
                {
                    name: "Chicken Dum Biryani",
                    price: 220,
                    type: "NON_VEG",
                    desc: "Aromatic long-grain basmati rice layered with tender spiced chicken cooked on dum, served with raita.",
                    imageUrl: "https://res.cloudinary.com/daiwwk5v7/image/upload/v1790157604/neo-cloud-room/menu/l8ov0oueeydsqxkhw50j.png",
                    cat: "meal"
                }
            ]
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
            dishes: []
        }
    ];

    const defaultFoodPlan = await prisma.subscriptionPlan.findFirst({
        where: { category: { in: ["FOOD", "BOTH"] } }
    });

    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Ensure core approved sellers have active subscription
    const coreSellers = [yashSeller, radhaSeller, yewaleSeller];
    if (defaultFoodPlan) {
        for (const sProfile of coreSellers) {
            const existingSub = await prisma.subscription.findFirst({
                where: { sellerId: sProfile.id }
            });
            if (!existingSub) {
                await prisma.subscription.create({
                    data: {
                        sellerId: sProfile.id,
                        planId: defaultFoodPlan.id,
                        status: "ACTIVE",
                        amount: defaultFoodPlan.price || 100,
                        validUntil: oneYearLater,
                    }
                });
            } else if (existingSub.status !== "ACTIVE" || !existingSub.validUntil || new Date(existingSub.validUntil) < new Date()) {
                await prisma.subscription.update({
                    where: { id: existingSub.id },
                    data: {
                        status: "ACTIVE",
                        amount: defaultFoodPlan.price || 100,
                        validUntil: oneYearLater,
                    }
                });
            }
        }
    }

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

        // Seed dishes for this seller if any
        if (s.dishes && s.dishes.length > 0) {
            for (const d of s.dishes) {
                const catId = foodCatMap.get(d.cat.toLowerCase()) || null;
                const existingDish = await prisma.foodItem.findFirst({
                    where: { sellerId: profile.id, name: d.name }
                });
                if (!existingDish) {
                    await prisma.foodItem.create({
                        data: {
                            sellerId: profile.id,
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
                        where: { id: existingDish.id },
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
        }

        // Seed active subscription for approved seller
        if (defaultFoodPlan && (s.status === undefined || s.status === "APPROVED")) {
            const existingSub = await prisma.subscription.findFirst({
                where: { sellerId: profile.id }
            });
            if (!existingSub) {
                await prisma.subscription.create({
                    data: {
                        sellerId: profile.id,
                        planId: defaultFoodPlan.id,
                        status: "ACTIVE",
                        amount: defaultFoodPlan.price || 100,
                        validUntil: oneYearLater,
                    }
                });
            } else if (existingSub.status !== "ACTIVE" || !existingSub.validUntil || new Date(existingSub.validUntil) < new Date()) {
                await prisma.subscription.update({
                    where: { id: existingSub.id },
                    data: {
                        status: "ACTIVE",
                        amount: defaultFoodPlan.price || 100,
                        validUntil: oneYearLater,
                    }
                });
            }
        }

        console.log(`Seeded seller: ${s.businessName}`);
    }

    // E. Authentic Coupons & Offers
    const authenticCoupons = [
        {
            code: "BURGER20",
            description: "20% OFF on Radha's Kitchen Burgers",
            discountType: "PERCENTAGE",
            discountPercentage: 20,
            discountAmount: null,
            appliesToSellerId: radhaSeller.id,
            appliesTo: "ALL",
            minimumCartValue: 0,
            isActive: true,
            approvalStatus: "APPROVED",
            noExpiry: true,
            isAutoApply: true,
            category: "BOTH"
        },
        {
            code: "RADHA15",
            description: "15% OFF on Radha's Homestyle Platters",
            discountType: "PERCENTAGE",
            discountPercentage: 15,
            discountAmount: null,
            appliesToSellerId: radhaSeller.id,
            appliesTo: "ALL",
            minimumCartValue: 0,
            isActive: true,
            approvalStatus: "APPROVED",
            noExpiry: true,
            isAutoApply: false,
            category: "BOTH"
        },
        {
            code: "BIRYANI20",
            description: "20% OFF on Authentic Dum Biryani",
            discountType: "PERCENTAGE",
            discountPercentage: 20,
            discountAmount: null,
            appliesToSellerId: yewaleSeller.id,
            appliesTo: "ALL",
            minimumCartValue: 0,
            isActive: true,
            approvalStatus: "APPROVED",
            noExpiry: true,
            isAutoApply: true,
            category: "BOTH"
        },
        {
            code: "CAKE10",
            description: "10% OFF on Yash's Kitchen Cakes & Bakes",
            discountType: "PERCENTAGE",
            discountPercentage: 10,
            discountAmount: null,
            appliesToSellerId: yashSeller.id,
            appliesTo: "ALL",
            minimumCartValue: 0,
            isActive: true,
            approvalStatus: "APPROVED",
            noExpiry: true,
            isAutoApply: true,
            category: "BOTH"
        },
        {
            code: "HOMELY15",
            description: "15% OFF on all Homestyle Kitchens",
            discountType: "PERCENTAGE",
            discountPercentage: 15,
            discountAmount: null,
            appliesToSellerId: null,
            appliesTo: "ALL",
            minimumCartValue: 100,
            isActive: true,
            approvalStatus: "APPROVED",
            noExpiry: true,
            isAutoApply: true,
            category: "BOTH"
        },
        {
            code: "SUMMER20",
            description: "Summer Special - Flat 20% OFF on orders above ₹300",
            discountType: "PERCENTAGE",
            discountPercentage: 20,
            discountAmount: null,
            appliesToSellerId: null,
            appliesTo: "ALL",
            minimumCartValue: 300,
            isActive: true,
            approvalStatus: "APPROVED",
            noExpiry: true,
            isAutoApply: false,
            category: "BOTH"
        },
        {
            code: "WELCOME50",
            description: "Flat ₹50 OFF on your first order",
            discountType: "FLAT",
            discountPercentage: null,
            discountAmount: 50,
            appliesToSellerId: null,
            appliesTo: "ALL",
            minimumCartValue: 150,
            isActive: true,
            approvalStatus: "APPROVED",
            noExpiry: true,
            isAutoApply: false,
            category: "BOTH"
        }
    ];

    for (const c of authenticCoupons) {
        await prisma.coupon.upsert({
            where: { code: c.code },
            update: c,
            create: c,
        });
    }
    console.log("Seeded authentic coupons and offers successfully!");

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
