import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        let category = url.searchParams.get("category");

        const session = await getAuthSession();
        let sellerCategory: string | null = null;
        let seller: any = null;
        if (session?.user && session.user.role === "SELLER") {
            seller = await db.sellerProfile.findUnique({
                where: { userId: session.user.id }
            });
            if (seller) {
                sellerCategory = seller.businessCategory;
            }
        }

        const hasFoodApproval =
            sellerCategory === "FOOD" ||
            sellerCategory === "BOTH" ||
            (seller && seller.foodVerificationStatus === "APPROVED");

        const hasPropertyApproval =
            sellerCategory === "PROPERTY" ||
            sellerCategory === "BOTH" ||
            (seller && seller.propertyVerificationStatus === "APPROVED");

        const isDualApproved =
            sellerCategory === "BOTH" ||
            (hasFoodApproval && hasPropertyApproval);

        let whereClause: any = { isActive: true };

        if (category) {
            const normCat = category.toUpperCase();
            if (normCat === "FOOD") {
                if (isDualApproved) {
                    whereClause.category = { in: ["FOOD", "BOTH"] };
                } else {
                    whereClause.category = "FOOD";
                }
            } else if (normCat === "PROPERTY" || normCat === "ROOM") {
                if (isDualApproved) {
                    whereClause.category = { in: ["PROPERTY", "BOTH"] };
                } else {
                    whereClause.category = "PROPERTY";
                }
            } else if (normCat === "BOTH") {
                whereClause.category = "BOTH";
            } else if (normCat === "ALL") {
                if (!isDualApproved) {
                    if (hasFoodApproval) {
                        whereClause.category = "FOOD";
                    } else if (hasPropertyApproval) {
                        whereClause.category = "PROPERTY";
                    }
                }
                // If isDualApproved, no whereClause.category restriction (returns all active plans)
            }
        } else {
            // When no category query param is supplied:
            if (!isDualApproved) {
                if (hasFoodApproval || sellerCategory === "FOOD") {
                    whereClause.category = "FOOD";
                } else if (hasPropertyApproval || sellerCategory === "PROPERTY" || sellerCategory === "ROOM") {
                    whereClause.category = "PROPERTY";
                }
            }
            // If isDualApproved (or sellerCategory === "BOTH" or null/guest), do not restrict whereClause.category (shows all plans: FOOD, PROPERTY, BOTH)
        }

        const dbPlans = await db.subscriptionPlan.findMany({
            where: whereClause,
            orderBy: { price: 'asc' }
        });

        const queryPlanId = url.searchParams.get("planId");
        if (queryPlanId && !dbPlans.some(p => p.id === queryPlanId || p.name.toLowerCase() === queryPlanId.toLowerCase())) {
            const specificPlan = await db.subscriptionPlan.findFirst({
                where: {
                    OR: [
                        { id: queryPlanId },
                        { name: { equals: queryPlanId, mode: "insensitive" } }
                    ],
                    isActive: true,
                }
            });
            if (specificPlan) {
                dbPlans.push(specificPlan);
            }
        }

        const plans = dbPlans.map(plan => ({
            id: plan.id,
            name: plan.name,
            price: Number(plan.price),
            durationMonths: Number(plan.durationMonths),
            features: JSON.parse(plan.features || "[]"),
            category: plan.category || "BOTH"
        }));
        return successResponse(plans);
    } catch (e: any) {
        console.error("Could not fetch subscription plans:", e);
        return errorResponse("Could not fetch subscription plans", 500);
    }
}
