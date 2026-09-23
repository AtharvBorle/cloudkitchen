import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getPendingApprovals = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view pending approvals.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const pendingBanners = await db.popupBanner.findMany({
        where: { approvalStatus: "PENDING_APPROVAL" },
        orderBy: { createdAt: "desc" }
    });

    const pendingCoupons = await db.coupon.findMany({
        where: { approvalStatus: "PENDING_APPROVAL" },
        orderBy: { createdAt: "desc" }
    });

    return { banners: pendingBanners, coupons: pendingCoupons };
};

export const updateApprovalStatus = async (req: Request, type: string, id: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update approval status.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const body = await req.json();
    const { action, adminNote } = body;

    if (!["APPROVE", "REJECT", "REVISION"].includes(action)) {
        throw new ApiError("Invalid action specified (must be APPROVE, REJECT, or REVISION).", 400);
    }

    const status = action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "REVISION";

    if (type === "banner") {
        const updated = await db.popupBanner.update({
            where: { id },
            data: { approvalStatus: status, adminNote }
        });
        return { banner: updated };
    } else if (type === "coupon") {
        const updated = await db.coupon.update({
            where: { id },
            data: { approvalStatus: status, adminNote }
        });
        return { coupon: updated };
    } else {
        throw new ApiError("Invalid item type specified.", 400);
    }
};
