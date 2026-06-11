import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";

export const deleteSellerBanner = async (req: Request) => {
    const session = await getAuthSession();

    if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
        throw new ApiError("Unauthorized", 401);
    }

    const { sellerId } = await req.json();

    if (!sellerId) {
        throw new ApiError("Seller ID is required", 400);
    }

    const updatedProfile = await db.sellerProfile.update({
        where: { id: sellerId },
        data: {
            bannerImageUrl: null
        }
    });

    await db.auditLog.create({
        data: {
            action: "BANNER_REMOVED",
            performedBy: session.user.id,
            details: `Banner removed for Seller ${sellerId} due to policy violation`
        }
    });

    return { profile: updatedProfile };
};

export const getPopupBanners = async () => {
    const session = await getAuthSession();
    if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
        throw new ApiError("Unauthorized", 401);
    }

    const banners = await db.popupBanner.findMany({
        orderBy: { createdAt: 'desc' },
    });

    const sellerIds = banners.map(b => b.appliesToSellerId).filter(Boolean) as string[];

    let sellersMap: Record<string, { name: string, trackingId: string | null }> = {};
    if (sellerIds.length > 0) {
        const sellers = await db.sellerProfile.findMany({
            where: { id: { in: sellerIds } },
            select: { id: true, businessName: true, trackingId: true }
        });
        sellers.forEach(s => sellersMap[s.id] = { name: s.businessName, trackingId: s.trackingId });
    }

    const bannersWithSellerNames = banners.map(b => ({
        ...b,
        sellerName: b.appliesToSellerId ? sellersMap[b.appliesToSellerId]?.name : "Global (All Stores)",
        sellerTrackingId: b.appliesToSellerId ? sellersMap[b.appliesToSellerId]?.trackingId : null
    }));

    return { banners: bannersWithSellerNames };
};

export const createPopupBanner = async (req: Request) => {
    const session = await getAuthSession();
    if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
        throw new ApiError("Unauthorized", 401);
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const redirectUrl = formData.get("redirectUrl") as string | null;
    const appliesToSellerId = formData.get("appliesToSellerId") as string;
    const imageFile = formData.get("image") as File | null;

    if (!title || !imageFile) {
        throw new ApiError("Title and Image file are required", 400);
    }

    let isGlobal = appliesToSellerId === "GLOBAL";
    let approvalStatus = "APPROVED";

    // Permission checks for agents
    if (session.user.role === "AGENT") {
        const agentProfile = await db.agentProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!agentProfile || !agentProfile.canManageBanners) {
            throw new ApiError("You do not have permission to manage popup banners", 403);
        }

        if (isGlobal) {
            approvalStatus = "PENDING_APPROVAL";
        }
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const imageUrl = await uploadImage(buffer, imageFile.type, imageFile.name, "banners");

    const newBanner = await db.popupBanner.create({
        data: {
            title,
            imageUrl,
            redirectUrl: redirectUrl || null,
            appliesToSellerId: isGlobal ? null : appliesToSellerId,
            isActive: true,
            approvalStatus
        }
    });

    return { banner: newBanner };
};

export const updateSellerRegistrationStatus = async (req: Request) => {
    const session = await getAuthSession();

    if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
        throw new ApiError("Unauthorized", 401);
    }

    const body = await req.json();
    const { sellerId, action, verificationNote } = body;

    if (!sellerId || !action || !["APPROVE", "REJECT", "REVISION"].includes(action)) {
        throw new ApiError("Invalid request data", 400);
    }

    const status = action === "APPROVE" ? "APPROVED" : (action === "REVISION" ? "REVISION" : "REJECTED");

    let adminProfileId = undefined;
    if (session.user.role === "AGENT") {
        const agentProfile = await db.agentProfile.findUnique({
            where: { userId: session.user.id }
        });
        if (agentProfile) {
            adminProfileId = agentProfile.id;
        }
    }

    const updateData: any = {
        verificationStatus: status,
        agentId: adminProfileId
    };

    if (action === "REVISION" && verificationNote) {
        updateData.verificationNote = verificationNote;
    }

    const updatedProfile = await db.sellerProfile.update({
        where: { id: sellerId },
        data: updateData
    });

    await db.auditLog.create({
        data: {
            action: `SELLER_${status}`,
            performedBy: session.user.id,
            details: `Seller ${sellerId} verification status set to ${status}`
        }
    });

    return { profile: updatedProfile, status };
};
