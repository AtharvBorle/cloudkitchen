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

    if (profile.businessCategory === "FOOD" || profile.businessCategory === "BOTH") {
        updateData.foodVerificationStatus = "PENDING";
    }
    if (profile.businessCategory === "PROPERTY" || profile.businessCategory === "BOTH") {
        updateData.propertyVerificationStatus = "PENDING";
    }

    const adhaarFile = formData.get("adhaarFile") as File;
    const adhaarFrontFile = formData.get("adhaarFrontFile") as File;
    const adhaarBackFile = formData.get("adhaarBackFile") as File;
    const fssaiFile = formData.get("fssaiFile") as File;
    const lightBillFile = formData.get("lightBillFile") as File;
    const passbookFile = formData.get("passbookFile") as File;

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

    const roomFiles: File[] = [];
    let hasNewRoomImages = false;
    for (let i = 0; i < 3; i++) {
        const rFile = formData.get(`roomImage_${i}`) as File;
        if (rFile) {
            roomFiles.push(rFile);
            hasNewRoomImages = true;
        }
    }

    // Fire all these securely and concurrently
    const [savedAdhaar, savedAdhaarFront, savedAdhaarBack, savedFssai, savedLightBill, savedPassbook, resolvedKitchen, resolvedCuisine, resolvedRooms] = await Promise.all([
        saveFile(adhaarFile),
        saveFile(adhaarFrontFile),
        saveFile(adhaarBackFile),
        saveFile(fssaiFile),
        saveFile(lightBillFile),
        saveFile(passbookFile),
        Promise.all(kitchenFiles.map(saveFile)),
        Promise.all(cuisineFiles.map(saveFile)),
        Promise.all(roomFiles.map(saveFile))
    ]);

    if (savedAdhaarFront && savedAdhaarBack) {
        updateData.adhaarUrl = JSON.stringify([savedAdhaarFront, savedAdhaarBack]);
    } else if (savedAdhaarFront) {
        updateData.adhaarUrl = JSON.stringify([savedAdhaarFront]);
    } else if (savedAdhaar) {
        updateData.adhaarUrl = savedAdhaar;
    }
    if (savedFssai) updateData.fssaiUrl = savedFssai;
    if (savedLightBill) updateData.lightBillUrl = savedLightBill;
    if (savedPassbook) updateData.passbookUrl = savedPassbook;

    if (hasNewKitchenImages) {
        const kImages = resolvedKitchen.filter(Boolean) as string[];
        updateData.kitchenImages = JSON.stringify(kImages);
    }

    if (hasNewCuisineImages) {
        const cImages = resolvedCuisine.filter(Boolean) as string[];
        updateData.cuisineImages = JSON.stringify(cImages);
    }

    if (hasNewRoomImages) {
        const rImages = resolvedRooms.filter(Boolean) as string[];
        updateData.roomImages = JSON.stringify(rImages);
    }

    await db.sellerProfile.update({
        where: { id: profile.id },
        data: updateData
    });

    return null;
};
