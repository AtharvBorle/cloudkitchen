import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getPlatformReviews = async () => {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN" && session.user.role !== "AGENT")) {
        throw new ApiError("Unauthorized", 401);
    }

    const reviews = await db.review.findMany({
        include: {
            user: {
                select: { id: true, name: true, email: true, role: true }
            },
            seller: {
                select: { id: true, name: true, phone: true }
            },
            order: {
                select: { id: true, totalAmount: true, status: true }
            },
            itemRatings: {
                include: {
                    foodItem: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const totalReviews = reviews.length;
    let sumRating = 0;
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const aspectCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const sentimentCounts: Record<string, number> = {};

    const parseJsonArray = (val: string | null | undefined): string[] => {
        if (!val) return [];
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const formattedReviews = reviews.map((r) => {
        sumRating += r.rating;
        if (ratingDistribution[r.rating] !== undefined) {
            ratingDistribution[r.rating]++;
        }

        const aspects = parseJsonArray(r.aspects);
        aspects.forEach((a) => {
            aspectCounts[a] = (aspectCounts[a] || 0) + 1;
        });

        const tags = parseJsonArray(r.tags);
        tags.forEach((t) => {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
        });

        if (r.sentiment) {
            sentimentCounts[r.sentiment] = (sentimentCounts[r.sentiment] || 0) + 1;
        }

        return {
            ...r,
            aspects,
            tags,
            sentiment: r.sentiment || null,
            managerResponse: r.sellerReply ? {
                text: r.sellerReply,
                createdAt: r.repliedAt || r.updatedAt,
                date: r.repliedAt || r.updatedAt
            } : null
        };
    });

    const averageRating = totalReviews > 0 ? parseFloat((sumRating / totalReviews).toFixed(2)) : 0;

    return {
        stats: {
            totalReviews,
            averageRating,
            ratingDistribution,
            aspectCounts,
            tagCounts,
            sentimentCounts
        },
        reviews: formattedReviews
    };
};
