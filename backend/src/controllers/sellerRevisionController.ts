import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";

export const requestSellerRevision = async (req: Request) => {
    const session = await getAuthSession();

    if (!session || !session.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const profile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!profile || profile.verificationStatus !== "REVISION") {
        throw new ApiError("Profile not in Revision state.", 400);
    }

    const formData = await req.formData();

    const saveFile = async (file: File | null) => {
        if (!file || typeof file === "string" || file.size === 0) return null;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        return await uploadImage(buffer, file.type, file.name, "revisions");
    };

    const updateData: any = {
        verificationStatus: "PENDING",
        verificationNote: null
    };

    const adhaarFile = formData.get("adhaarFile") as File;
    const adhaarFrontFile = formData.get("adhaarFrontFile") as File;
    const adhaarBackFile = formData.get("adhaarBackFile") as File;
    const fssaiFile = formData.get("fssaiFile") as File;

    const kitchenFiles: File[] = [];
    let hasNewKitchenImages = false;
    for (let i = 0; i < 3; i++) {
        const kFile = formData.get(`kitchenImage_${i}`) as File;
        if (kFile) {
            kitchenFiles.push(kFile);
            hasNewKitchenImages = true;
        }
    }

    const cuisineFiles: File[] = [];
    let hasNewCuisineImages = false;
    for (let i = 0; i < 3; i++) {
        const cFile = formData.get(`cuisineImage_${i}`) as File;
        if (cFile) {
            cuisineFiles.push(cFile);
            hasNewCuisineImages = true;
        }
    }

    // Fire all these securely and concurrently
    const [savedAdhaar, savedAdhaarFront, savedAdhaarBack, savedFssai, resolvedKitchen, resolvedCuisine] = await Promise.all([
        saveFile(adhaarFile),
        saveFile(adhaarFrontFile),
        saveFile(adhaarBackFile),
        saveFile(fssaiFile),
        Promise.all(kitchenFiles.map(saveFile)),
        Promise.all(cuisineFiles.map(saveFile))
    ]);

    if (savedAdhaarFront && savedAdhaarBack) {
        updateData.adhaarUrl = JSON.stringify([savedAdhaarFront, savedAdhaarBack]);
    } else if (savedAdhaarFront) {
        updateData.adhaarUrl = JSON.stringify([savedAdhaarFront]);
    } else if (savedAdhaar) {
        updateData.adhaarUrl = savedAdhaar;
    }
    if (savedFssai) updateData.fssaiUrl = savedFssai;

    if (hasNewKitchenImages) {
        const kImages = resolvedKitchen.filter(Boolean) as string[];
        updateData.kitchenImages = JSON.stringify(kImages);
    }

    if (hasNewCuisineImages) {
        const cImages = resolvedCuisine.filter(Boolean) as string[];
        updateData.cuisineImages = JSON.stringify(cImages);
    }

    await db.sellerProfile.update({
        where: { id: profile.id },
        data: updateData
    });

    return null;
};
