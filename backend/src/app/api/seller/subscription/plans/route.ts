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

        let whereClause: any = { isActive: true };
        if (category && category !== "BOTH") {
            const hasFoodApproval = sellerCategory === "FOOD" || sellerCategory === "BOTH" || (seller && seller.foodVerificationStatus === "APPROVED");
            const hasPropertyApproval = sellerCategory === "PROPERTY" || sellerCategory === "BOTH" || (seller && seller.propertyVerificationStatus === "APPROVED");
            
            if (category === "FOOD" && hasFoodApproval) {
                whereClause.category = { in: ["FOOD", "BOTH"] };
            } else if (category === "PROPERTY" && hasPropertyApproval) {
                whereClause.category = { in: ["PROPERTY", "BOTH"] };
            } else {
                if (sellerCategory === "FOOD") {
                    whereClause.category = { in: ["FOOD", "BOTH"] };
                } else if (sellerCategory === "PROPERTY") {
                    whereClause.category = { in: ["PROPERTY", "BOTH"] };
                }
            }
        } else {
            if (sellerCategory === "FOOD") {
                whereClause.category = { in: ["FOOD", "BOTH"] };
            } else if (sellerCategory === "PROPERTY") {
                whereClause.category = { in: ["PROPERTY", "BOTH"] };
            }
        }

        const dbPlans = await db.subscriptionPlan.findMany({
            where: whereClause,
            orderBy: { price: 'asc' }
        });

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
