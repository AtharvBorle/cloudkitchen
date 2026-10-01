import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { syncInstagramReelsToDatabase } from "@/lib/instagram-sync";
import { unstable_cache } from "next/cache";

export const getAdminReels = async (req: Request) => {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new ApiError("Please log in to view Instagram reels.", 401);
  }
  const allowedRoles = ["REEL_MANAGER", "SUPERADMIN", "AGENT", "SUPPORT"];
  if (!allowedRoles.includes(session.user.role)) {
    throw new ApiError("Access denied. Reel management privileges required.", 403);
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ALL"; // ALL, PUBLISHED, UNPUBLISHED
  const mediaType = searchParams.get("mediaType") || "ALL";
  const sellerId = searchParams.get("sellerId");
  const query = searchParams.get("query")?.trim().toLowerCase();

  const whereClause: any = {};

  if (status === "PUBLISHED") {
    whereClause.isPublished = true;
  } else if (status === "UNPUBLISHED") {
    whereClause.isPublished = false;
  }

  if (mediaType !== "ALL") {
    whereClause.mediaType = mediaType;
  }

  if (sellerId && sellerId !== "ALL") {
    whereClause.sellerId = sellerId;
  }

  if (query) {
    whereClause.OR = [
      { caption: { contains: query, mode: "insensitive" } },
      { customTitle: { contains: query, mode: "insensitive" } },
      { seller: { businessName: { contains: query, mode: "insensitive" } } },
    ];
  }

  const reels = await db.curatedReel.findMany({
    where: whereClause,
    orderBy: [
      { displayOrder: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      seller: {
        select: {
          id: true,
          businessName: true,
          trackingId: true,
          bannerImageUrl: true,
          addressLocality: true,
          user: {
            select: { name: true, city: true },
          },
        },
      },
      foodItem: {
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          itemType: true,
        },
      },
    },
  });

  const totalCount = await db.curatedReel.count();
  const publishedCount = await db.curatedReel.count({ where: { isPublished: true } });
  const pendingCount = totalCount - publishedCount;

  return {
    reels,
    stats: {
      total: totalCount,
      published: publishedCount,
      pending: pendingCount,
    },
  };
};

export const syncAdminReels = async () => {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new ApiError("Please log in to sync Instagram reels.", 401);
  }
  const allowedRoles = ["REEL_MANAGER", "SUPERADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    throw new ApiError("Access denied. Reel Manager or Superadmin privileges required.", 403);
  }

  const result = await syncInstagramReelsToDatabase(session.user.id);
  return result;
};

export const updateAdminReel = async (id: string, req: Request) => {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new ApiError("Please log in to update reel.", 401);
  }
  const allowedRoles = ["REEL_MANAGER", "SUPERADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    throw new ApiError("Access denied. Reel Manager or Superadmin privileges required.", 403);
  }

  const body = await req.json();
  const {
    isPublished,
    displayOrder,
    categoryTag,
    customTitle,
    customSubtitle,
    redirectType,
    sellerId,
    foodItemId,
    customRedirectUrl,
  } = body;

  const existing = await db.curatedReel.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError("Reel not found.", 404);
  }

  const cleanSellerId = sellerId && sellerId !== "none" && sellerId !== "" ? sellerId : null;
  const cleanFoodItemId = foodItemId && foodItemId !== "none" && foodItemId !== "" ? foodItemId : null;

  const updated = await db.curatedReel.update({
    where: { id },
    data: {
      isPublished: isPublished !== undefined ? Boolean(isPublished) : existing.isPublished,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : existing.displayOrder,
      categoryTag: categoryTag !== undefined ? categoryTag : existing.categoryTag,
      customTitle: customTitle !== undefined ? customTitle : existing.customTitle,
      customSubtitle: customSubtitle !== undefined ? customSubtitle : existing.customSubtitle,
      redirectType: redirectType || existing.redirectType,
      sellerId: cleanSellerId,
      foodItemId: cleanFoodItemId,
      customRedirectUrl: customRedirectUrl !== undefined ? customRedirectUrl : existing.customRedirectUrl,
      curatedBy: session.user.id,
    },
    include: {
      seller: {
        select: {
          id: true,
          businessName: true,
          trackingId: true,
          bannerImageUrl: true,
        },
      },
      foodItem: {
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          itemType: true,
        },
      },
    },
  });

  return { reel: updated, message: "Reel updated successfully." };
};

export const deleteAdminReel = async (id: string) => {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new ApiError("Please log in to delete reel.", 401);
  }
  const allowedRoles = ["REEL_MANAGER", "SUPERADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    throw new ApiError("Access denied. Reel Manager or Superadmin privileges required.", 403);
  }

  const existing = await db.curatedReel.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("Reel not found.", 404);
  }

  await db.curatedReel.delete({ where: { id } });
  return { success: true, message: "Reel deleted successfully." };
};

export const getReelSellersAndDishes = async () => {
  const sellers = await db.sellerProfile.findMany({
    where: {
      verificationStatus: "APPROVED",
      user: { isActive: true },
    },
    select: {
      id: true,
      businessName: true,
      trackingId: true,
      type: true,
      bannerImageUrl: true,
      kitchenImages: true,
      foodItems: {
        where: { isAvailable: true },
        select: {
          id: true,
          name: true,
          price: true,
          itemType: true,
          imageUrl: true,
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { businessName: "asc" },
  });

  return { sellers };
};

export const getPublicCuratedReels = unstable_cache(
  async () => {
    const reels = await db.curatedReel.findMany({
      where: { isPublished: true },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            trackingId: true,
            bannerImageUrl: true,
            addressLocality: true,
            kitchenImages: true,
            reviews: { select: { rating: true } },
          },
        },
        foodItem: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            itemType: true,
          },
        },
      },
    });

    return reels.map((r) => {
      let kitchenImage = r.seller?.bannerImageUrl || "";
      if (!kitchenImage && r.seller?.kitchenImages) {
        try {
          const imgs = typeof r.seller.kitchenImages === "string" ? JSON.parse(r.seller.kitchenImages) : r.seller.kitchenImages;
          if (Array.isArray(imgs) && imgs.length > 0) kitchenImage = imgs[0];
        } catch {
          // ignore
        }
      }

      const reviewsCount = r.seller?.reviews?.length || 0;
      const avgRating = reviewsCount > 0
        ? Number((r.seller!.reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviewsCount).toFixed(1))
        : 4.8;

      return {
        id: r.id,
        instagramMediaId: r.instagramMediaId,
        mediaType: r.mediaType,
        mediaUrl: r.mediaUrl,
        thumbnailUrl: r.thumbnailUrl || r.mediaUrl,
        permalink: r.permalink,
        caption: r.caption,
        postedAt: r.postedAt,
        likeCount: r.likeCount,
        commentsCount: r.commentsCount,
        displayOrder: r.displayOrder,
        categoryTag: r.categoryTag,
        customTitle: r.customTitle,
        customSubtitle: r.customSubtitle,
        redirectType: r.redirectType,
        customRedirectUrl: r.customRedirectUrl,
        seller: r.seller
          ? {
              id: r.seller.id,
              name: r.seller.businessName,
              trackingId: r.seller.trackingId,
              locality: r.seller.addressLocality,
              imageUrl: kitchenImage || "/images/places/place-biryani.png",
              rating: avgRating,
              reviewsCount,
            }
          : null,
        foodItem: r.foodItem
          ? {
              id: r.foodItem.id,
              name: r.foodItem.name,
              price: r.foodItem.price,
              imageUrl: r.foodItem.imageUrl,
              itemType: r.foodItem.itemType,
            }
          : null,
      };
    });
  },
  ["public-curated-reels"],
  { revalidate: 30, tags: ["reels", "explore"] }
);
