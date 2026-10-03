import { db } from "./db";

export interface InstagramMediaItem {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REEL" | "STORY" | string;
  media_url: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
}

// High quality mock reels for demonstration / testing when Meta API token is not yet active
const FALLBACK_MOCK_REELS: InstagramMediaItem[] = [
  {
    id: "ig_mock_101",
    media_type: "VIDEO",
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-chef-garnishing-a-delicious-dish-43336-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    permalink: "https://instagram.com/p/reel_demo_101",
    caption: "Slow-cooked Royal Dum Biryani straight from Royal Handi kitchen! Collaborating with @neocloudbites #cloudkitchen #biryani #royalhandi #foodporn",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    like_count: 1420,
    comments_count: 88,
  },
  {
    id: "ig_mock_102",
    media_type: "VIDEO",
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-putting-fresh-pizza-in-the-oven-43343-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    permalink: "https://instagram.com/p/reel_demo_102",
    caption: "Wood-fired artisanal sourdough pizza melting with fresh buffalo mozzarella 🍕 Artisano Oven x @neocloudbites #pizza #sourdough #freshbakes",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    like_count: 2890,
    comments_count: 142,
  },
  {
    id: "ig_mock_103",
    media_type: "VIDEO",
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-steaming-steamed-dumplings-in-a-basket-43339-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80",
    permalink: "https://instagram.com/p/reel_demo_103",
    caption: "Juicy handcrafted Darjeeling Dimsums bursting with hot broth and fiery chili crisps! Dimsum Haus @neocloudbites #dimsums #steamed #cloudkitchen",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    like_count: 950,
    comments_count: 45,
  },
  {
    id: "ig_mock_104",
    media_type: "VIDEO",
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-hands-cutting-a-gourmet-burger-43340-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    permalink: "https://instagram.com/p/reel_demo_104",
    caption: "Double Smash Cheesy Burger with in-house smoked chipotle glaze 🍔 Smash Bros Kitchen feat @neocloudbites #burgerlover #smashburger",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    like_count: 3120,
    comments_count: 210,
  },
  {
    id: "ig_mock_105",
    media_type: "VIDEO",
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-pouring-creamy-sauce-over-pasta-43345-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1621996346565-e3d5d62817ee?auto=format&fit=crop&w=800&q=80",
    permalink: "https://instagram.com/p/reel_demo_105",
    caption: "Truffle Infused Fettuccine Alfredo in parmesan wheel 🍝 Bella Cucina Cloud Kitchen x @neocloudbites #pasta #italian #truffle",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    like_count: 1840,
    comments_count: 76,
  },
  {
    id: "ig_mock_106",
    media_type: "VIDEO",
    media_url: "https://assets.mixkit.co/videos/preview/mixkit-cutting-a-piece-of-chocolate-cake-43341-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    permalink: "https://instagram.com/p/reel_demo_106",
    caption: "Molten Lava Chocolate Cake with Madagascar vanilla bean drizzle 🍫 Sweet Retreat x @neocloudbites #dessert #chocolatelover #sweettooth",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    like_count: 4210,
    comments_count: 310,
  }
];

export async function fetchFromMetaGraphApi(): Promise<{ items: InstagramMediaItem[]; isLiveApi: boolean; message: string }> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_PAGE_ID;

  if (!accessToken || !igAccountId || accessToken.includes("your_") || igAccountId.includes("your_")) {
    return {
      items: FALLBACK_MOCK_REELS,
      isLiveApi: false,
      message: "Using simulated Instagram media. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in .env for live Meta Graph sync.",
    };
  }

  const collected: InstagramMediaItem[] = [];
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";

  try {
    // 1. Fetch account media & reels
    const mediaRes = await fetch(
      `https://graph.facebook.com/v20.0/${igAccountId}/media?fields=${fields}&access_token=${accessToken}`,
      { next: { revalidate: 0 } }
    );

    if (mediaRes.ok) {
      const data = await mediaRes.json();
      if (Array.isArray(data?.data)) {
        collected.push(...data.data);
      }
    } else {
      const err = await mediaRes.json().catch(() => ({}));
      console.warn("Meta Graph API /media warning:", err);
    }

    // 2. Fetch tagged / collaborator media
    try {
      const tagsRes = await fetch(
        `https://graph.facebook.com/v20.0/${igAccountId}/tags?fields=${fields}&access_token=${accessToken}`,
        { next: { revalidate: 0 } }
      );
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        if (Array.isArray(tagsData?.data)) {
          // Avoid duplicate IDs
          const existingIds = new Set(collected.map((m) => m.id));
          for (const item of tagsData.data) {
            if (!existingIds.has(item.id)) {
              collected.push(item);
            }
          }
        }
      }
    } catch (tagErr) {
      console.warn("Meta Graph API /tags fetch ignored:", tagErr);
    }

    // 3. Fetch stories
    try {
      const storiesRes = await fetch(
        `https://graph.facebook.com/v20.0/${igAccountId}/stories?fields=${fields}&access_token=${accessToken}`,
        { next: { revalidate: 0 } }
      );
      if (storiesRes.ok) {
        const storiesData = await storiesRes.json();
        if (Array.isArray(storiesData?.data)) {
          const existingIds = new Set(collected.map((m) => m.id));
          for (const item of storiesData.data) {
            if (!existingIds.has(item.id)) {
              collected.push({ ...item, media_type: "STORY" });
            }
          }
        }
      }
    } catch (storyErr) {
      console.warn("Meta Graph API /stories fetch ignored:", storyErr);
    }

    if (collected.length === 0) {
      return {
        items: FALLBACK_MOCK_REELS,
        isLiveApi: true,
        message: "Connected to Meta Graph API, but no posts/reels were found on the account. Loaded demo reels.",
      };
    }

    return {
      items: collected,
      isLiveApi: true,
      message: `Successfully fetched ${collected.length} reels/stories from Meta Graph API.`,
    };
  } catch (err: any) {
    console.error("Meta Graph API sync error:", err);
    return {
      items: FALLBACK_MOCK_REELS,
      isLiveApi: false,
      message: `Meta API connection failed (${err.message || "Network Error"}). Falling back to sample reels.`,
    };
  }
}

/**
 * Synchronizes Instagram media into the CuratedReel database table.
 * Preserves existing curation attributes (isPublished, sellerId, foodItemId, displayOrder).
 */
export async function syncInstagramReelsToDatabase(curatedByUserId?: string) {
  const { items, isLiveApi, message } = await fetchFromMetaGraphApi();

  let createdCount = 0;
  let updatedCount = 0;

  // Retrieve existing sellers for optional auto-matching by businessName or trackingId
  const activeSellers = await db.sellerProfile.findMany({
    where: { verificationStatus: "APPROVED" },
    select: { id: true, businessName: true, trackingId: true, foodItems: { select: { id: true, name: true } } },
  });

  for (const item of items) {
    const existing = await db.curatedReel.findUnique({
      where: { instagramMediaId: item.id },
    });

    const mediaUrl = item.media_url || item.thumbnail_url || "";
    const thumbnailUrl = item.thumbnail_url || item.media_url || "";
    const postedAt = item.timestamp ? new Date(item.timestamp) : new Date();

    if (existing) {
      // Update metadata without overriding curation decisions
      await db.curatedReel.update({
        where: { id: existing.id },
        data: {
          mediaUrl: mediaUrl || existing.mediaUrl,
          thumbnailUrl: thumbnailUrl || existing.thumbnailUrl,
          permalink: item.permalink || existing.permalink,
          caption: item.caption || existing.caption,
          likeCount: item.like_count ?? existing.likeCount,
          commentsCount: item.comments_count ?? existing.commentsCount,
        },
      });
      updatedCount++;
    } else {
      // Try to auto-detect seller from caption hashtags or name
      let detectedSellerId: string | null = null;
      let detectedDishId: string | null = null;

      const lowerCaption = (item.caption || "").toLowerCase();
      for (const s of activeSellers) {
        const sName = (s.businessName || "").toLowerCase();
        const sTrack = (s.trackingId || "").toLowerCase();
        if ((sName && lowerCaption.includes(sName)) || (sTrack && lowerCaption.includes(sTrack))) {
          detectedSellerId = s.id;
          // Try to match dish
          for (const dish of s.foodItems) {
            if (dish.name && lowerCaption.includes(dish.name.toLowerCase())) {
              detectedDishId = dish.id;
              break;
            }
          }
          break;
        }
      }

      await db.curatedReel.create({
        data: {
          instagramMediaId: item.id,
          mediaType: item.media_type || "VIDEO",
          mediaUrl,
          thumbnailUrl,
          permalink: item.permalink || "",
          caption: item.caption || "",
          postedAt,
          likeCount: item.like_count || 0,
          commentsCount: item.comments_count || 0,
          isPublished: false, // Default unpublished for Reel Manager review
          displayOrder: 0,
          redirectType: detectedDishId ? "DISH" : detectedSellerId ? "KITCHEN" : "KITCHEN",
          sellerId: detectedSellerId,
          foodItemId: detectedDishId,
          curatedBy: curatedByUserId || null,
        },
      });
      createdCount++;
    }
  }

  const totalReels = await db.curatedReel.count();
  const publishedReels = await db.curatedReel.count({ where: { isPublished: true } });

  return {
    success: true,
    isLiveApi,
    message,
    createdCount,
    updatedCount,
    totalReels,
    publishedReels,
  };
}
