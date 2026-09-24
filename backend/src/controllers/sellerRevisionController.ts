import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";

export const requestSellerRevision = async (req: Request) => {
    const session = await getAuthSession();

    if (!session?.user) {
        throw new ApiError("Please log in first to submit revision documents.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const profile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!profile) {
        throw new ApiError("Seller profile could not be found. Please complete your registration.", 404);
    }

    if (profile.verificationStatus === "APPROVED") {
        throw new ApiError("Your seller profile is already approved.", 400);
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

    const businessAddress = (formData.get("businessAddress") || formData.get("address")) as string | null;
    if (businessAddress && businessAddress.trim()) {
        updateData.addressLocality = businessAddress.trim();
    }
    const businessName = formData.get("businessName") as string | null;
    if (businessName && businessName.trim()) {
        updateData.businessName = businessName.trim();
    }

    const adhaarFile = (formData.get("adhaarFile") || formData.get("identityProofFile") || formData.get("panFile")) as File | null;
    const adhaarFrontFile = formData.get("adhaarFrontFile") as File | null;
    const adhaarBackFile = formData.get("adhaarBackFile") as File | null;
    const fssaiFile = (formData.get("fssaiFile") || formData.get("fssaiDocumentFile")) as File | null;
    const lightBillFile = (formData.get("lightBillFile") || formData.get("utilityBillFile")) as File | null;
    const passbookFile = (formData.get("passbookFile") || formData.get("bankDocumentFile")) as File | null;

    const kitchenFiles: File[] = [];
    let hasNewKitchenImages = false;
    for (let i = 0; i < 5; i++) {
        const kFile = formData.get(`kitchenImage_${i}`) as File | null;
        if (kFile && typeof kFile !== "string" && kFile.size > 0) {
            kitchenFiles.push(kFile);
            hasNewKitchenImages = true;
        }
    }

    const cuisineFiles: File[] = [];
    let hasNewCuisineImages = false;
    for (let i = 0; i < 5; i++) {
        const cFile = formData.get(`cuisineImage_${i}`) as File | null;
        if (cFile && typeof cFile !== "string" && cFile.size > 0) {
            cuisineFiles.push(cFile);
            hasNewCuisineImages = true;
        }
    }

    const roomFiles: File[] = [];
    let hasNewRoomImages = false;
    for (let i = 0; i < 5; i++) {
        const rFile = formData.get(`roomImage_${i}`) as File | null;
        if (rFile && typeof rFile !== "string" && rFile.size > 0) {
            roomFiles.push(rFile);
            hasNewRoomImages = true;
        }
    }

    // Fire all uploads concurrently
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
        if (kImages.length > 0) updateData.kitchenImages = JSON.stringify(kImages);
    }

    if (hasNewCuisineImages) {
        const cImages = resolvedCuisine.filter(Boolean) as string[];
        if (cImages.length > 0) updateData.cuisineImages = JSON.stringify(cImages);
    }

    if (hasNewRoomImages) {
        const rImages = resolvedRooms.filter(Boolean) as string[];
        if (rImages.length > 0) updateData.roomImages = JSON.stringify(rImages);
    }

    const updatedProfile = await db.sellerProfile.update({
        where: { id: profile.id },
        data: updateData
    });

    return updatedProfile;
};

export const getSellerRevisionDetails = async () => {
    const session = await getAuthSession();

    if (!session?.user) {
        throw new ApiError("Please log in first to view revision details.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const profile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id },
        include: { user: { select: { name: true, email: true, phone: true } } }
    });

    if (!profile) {
        throw new ApiError("Seller profile could not be found. Please complete your registration.", 404);
    }

    let parsedKitchen: string[] = [];
    let parsedCuisine: string[] = [];
    let parsedRoom: string[] = [];

    try {
        if (profile.kitchenImages) parsedKitchen = JSON.parse(profile.kitchenImages);
    } catch {}
    try {
        if (profile.cuisineImages) parsedCuisine = JSON.parse(profile.cuisineImages);
    } catch {}
    try {
        if (profile.roomImages) parsedRoom = JSON.parse(profile.roomImages);
    } catch {}

    return {
        id: profile.id,
        businessName: profile.businessName,
        businessCategory: profile.businessCategory,
        verificationStatus: profile.verificationStatus,
        verificationNote: profile.verificationNote,
        foodVerificationStatus: profile.foodVerificationStatus,
        propertyVerificationStatus: profile.propertyVerificationStatus,
        addressLocality: profile.addressLocality,
        adhaarUrl: profile.adhaarUrl,
        fssaiUrl: profile.fssaiUrl,
        lightBillUrl: profile.lightBillUrl,
        passbookUrl: profile.passbookUrl,
        kitchenImages: parsedKitchen,
        cuisineImages: parsedCuisine,
        roomImages: parsedRoom,
        user: profile.user,
    };
};
