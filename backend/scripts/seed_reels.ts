import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking / Creating test Reel Manager user...");
  const passwordHash = await bcrypt.hash("password123", 10);

  const reelManager = await prisma.user.upsert({
    where: { email: "reelmanager@admin.com" },
    update: {
      role: "REEL_MANAGER",
      passwordHash,
      isActive: true,
    },
    create: {
      email: "reelmanager@admin.com",
      name: "Reel Manager Curator",
      phone: "9988776655",
      passwordHash,
      role: "REEL_MANAGER",
      city: "Pune",
      pincode: "411001",
      isActive: true,
    },
  });

  console.log("Reel Manager created/verified:", reelManager.email, "role:", reelManager.role);

  // Sync sample curated reels
  console.log("Seeding sample curated reels...");
  const sampleReels = [
    {
      instagramMediaId: "ig_mock_101",
      mediaType: "VIDEO",
      mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-chef-garnishing-a-delicious-dish-43336-large.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      permalink: "https://instagram.com/p/reel_demo_101",
      caption: "Slow-cooked Royal Dum Biryani straight from Royal Handi kitchen! Collaborating with @neocloudbites #cloudkitchen #biryani #royalhandi #foodporn",
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      likeCount: 1420,
      commentsCount: 88,
      isPublished: true,
      displayOrder: 1,
      customTitle: "Royal Dum Biryani",
      customSubtitle: "Special slow-dum handi biryani",
      redirectType: "KITCHEN",
    },
    {
      instagramMediaId: "ig_mock_102",
      mediaType: "VIDEO",
      mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-putting-fresh-pizza-in-the-oven-43343-large.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
      permalink: "https://instagram.com/p/reel_demo_102",
      caption: "Wood-fired artisanal sourdough pizza melting with fresh buffalo mozzarella 🍕 Artisano Oven x @neocloudbites #pizza #sourdough #freshbakes",
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      likeCount: 2890,
      commentsCount: 142,
      isPublished: true,
      displayOrder: 2,
      customTitle: "Artisanal Sourdough Pizza",
      customSubtitle: "Wood-fired buffalo mozzarella",
      redirectType: "KITCHEN",
    },
    {
      instagramMediaId: "ig_mock_103",
      mediaType: "VIDEO",
      mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-steaming-steamed-dumplings-in-a-basket-43339-large.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80",
      permalink: "https://instagram.com/p/reel_demo_103",
      caption: "Juicy handcrafted Darjeeling Dimsums bursting with hot broth and fiery chili crisps! Dimsum Haus @neocloudbites #dimsums #steamed #cloudkitchen",
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      likeCount: 950,
      commentsCount: 45,
      isPublished: true,
      displayOrder: 3,
      customTitle: "Darjeeling Dimsums",
      customSubtitle: "Steamed basket with chili oil",
      redirectType: "KITCHEN",
    },
    {
      instagramMediaId: "ig_mock_104",
      mediaType: "VIDEO",
      mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-cutting-a-gourmet-burger-43340-large.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      permalink: "https://instagram.com/p/reel_demo_104",
      caption: "Double Smash Cheesy Burger with in-house smoked chipotle glaze 🍔 Smash Bros Kitchen feat @neocloudbites #burgerlover #smashburger",
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
      likeCount: 3120,
      commentsCount: 210,
      isPublished: true,
      displayOrder: 4,
      customTitle: "Smash Bros Cheesy Burger",
      customSubtitle: "Double patty smoked chipotle",
      redirectType: "KITCHEN",
    }
  ];

  const firstSeller = await prisma.sellerProfile.findFirst({
    where: { verificationStatus: "APPROVED" },
    include: { foodItems: true },
  });

  for (const r of sampleReels) {
    const dish = firstSeller?.foodItems?.[0];
    await prisma.curatedReel.upsert({
      where: { instagramMediaId: r.instagramMediaId },
      update: {
        mediaUrl: r.mediaUrl,
        thumbnailUrl: r.thumbnailUrl,
        caption: r.caption,
        isPublished: r.isPublished,
        displayOrder: r.displayOrder,
        customTitle: r.customTitle,
        customSubtitle: r.customSubtitle,
        sellerId: firstSeller?.id || null,
        foodItemId: dish?.id || null,
        redirectType: dish ? "DISH" : "KITCHEN",
      },
      create: {
        ...r,
        sellerId: firstSeller?.id || null,
        foodItemId: dish?.id || null,
        redirectType: dish ? "DISH" : "KITCHEN",
      },
    });
  }

  const count = await prisma.curatedReel.count();
  console.log(`Seeding complete. Total CuratedReel count in DB: ${count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
