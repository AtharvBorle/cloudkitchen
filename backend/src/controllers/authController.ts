import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { uploadImage } from "@/lib/upload";
import { ApiError } from "@/lib/api-error";
import jwt from "jsonwebtoken";
import { validateEmail } from "@/lib/email-validation";

export const registerUser = async (req: Request) => {
    const contentType = req.headers.get('content-type') || "";

    let finalName, finalEmail, finalPhone, finalPassword, finalRole, finalSellerType, finalCity, finalPincode, finalBusinessName, finalAddressFlat, finalAddressArea, finalAddressLandmark, finalBusinessCategory, finalFoodType;
    let finalLatitude: number | null = null, finalLongitude: number | null = null, finalIsLocationPinned = false;
    let adhaarUrl = "pending_url", fssaiUrl = null, lightBillUrl = null, passbookUrl = null;
    let kitchenImages: string[] = [];
    let cuisineImages: string[] = [];
    let roomImages: string[] = [];

    if (contentType.includes('application/json')) {
        const body = await req.json();
        finalName = body.name || body.ownerName;
        finalEmail = body.email;
        finalPhone = body.phone;
        finalPassword = body.password;
        finalRole = body.role || (body.businessName ? "SELLER" : "USER");
        finalSellerType = body.sellerType || "FOOD";
        if (body.categories) {
            try {
                const parsed = typeof body.categories === "string" ? JSON.parse(body.categories) : body.categories;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    finalSellerType = parsed.join(", ");
                }
            } catch {
                if (typeof body.categories === "string" && body.categories.trim()) {
                    finalSellerType = body.categories.trim();
                }
            }
        }
        finalCity = body.city;
        finalPincode = body.pincode;
        finalBusinessName = body.businessName;
        finalAddressFlat = body.addressFlat || "";
        finalAddressArea = body.addressArea || body.address || "";
        finalAddressLandmark = body.addressLandmark || null;
        finalBusinessCategory = body.businessCategory || body.sellerType || "FOOD";
        finalFoodType = body.foodType || "BOTH";

        if (body.latitude !== undefined && body.latitude !== null && body.latitude !== "") {
            finalLatitude = parseFloat(body.latitude);
        } else if (body.lat !== undefined && body.lat !== null && body.lat !== "") {
            finalLatitude = parseFloat(body.lat);
        } else if (body.locationCoordinates?.lat) {
            finalLatitude = parseFloat(body.locationCoordinates.lat);
        }

        if (body.longitude !== undefined && body.longitude !== null && body.longitude !== "") {
            finalLongitude = parseFloat(body.longitude);
        } else if (body.lng !== undefined && body.lng !== null && body.lng !== "") {
            finalLongitude = parseFloat(body.lng);
        } else if (body.locationCoordinates?.lng) {
            finalLongitude = parseFloat(body.locationCoordinates.lng);
        }

        if (body.isLocationPinned !== undefined) {
            finalIsLocationPinned = Boolean(body.isLocationPinned);
        } else if (finalLatitude !== null && finalLongitude !== null) {
            finalIsLocationPinned = true;
        }

        if (body.adhaarUrl) adhaarUrl = body.adhaarUrl;
        if (body.identityProofUrl) adhaarUrl = body.identityProofUrl;
        if (body.fssaiUrl) fssaiUrl = body.fssaiUrl;
        if (body.lightBillUrl) lightBillUrl = body.lightBillUrl;
        if (body.utilityBillUrl) lightBillUrl = body.utilityBillUrl;
        if (body.passbookUrl) passbookUrl = body.passbookUrl;
        if (Array.isArray(body.kitchenImages)) kitchenImages = body.kitchenImages;
        if (Array.isArray(body.kitchenPhotos)) kitchenImages = body.kitchenPhotos.filter(Boolean);
        if (Array.isArray(body.cuisineImages)) cuisineImages = body.cuisineImages;
        if (Array.isArray(body.cuisinePhotos)) cuisineImages = body.cuisinePhotos.filter(Boolean);
        if (Array.isArray(body.roomImages)) roomImages = body.roomImages;
        if (Array.isArray(body.roomPhotos)) roomImages = body.roomPhotos.filter(Boolean);
    } else {
        const formData = await req.formData();

        finalName = (formData.get("name") || formData.get("ownerName")) as string;
        finalEmail = formData.get("email") as string;
        finalPhone = formData.get("phone") as string;
        finalPassword = formData.get("password") as string;
        finalRole = (formData.get("role") || (formData.get("businessName") ? "SELLER" : "USER")) as string;
        finalSellerType = (formData.get("sellerType") || "FOOD") as string;
        const rawCategories = formData.get("categories");
        if (rawCategories) {
            try {
                const parsed = typeof rawCategories === "string" ? JSON.parse(rawCategories) : rawCategories;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    finalSellerType = parsed.join(", ");
                }
            } catch {
                if (typeof rawCategories === "string" && rawCategories.trim()) {
                    finalSellerType = rawCategories.trim();
                }
            }
        }
        finalCity = formData.get("city") as string;
        finalPincode = formData.get("pincode") as string;
        finalBusinessName = formData.get("businessName") as string;
        finalAddressFlat = (formData.get("addressFlat") || "") as string;
        finalAddressArea = (formData.get("addressArea") || formData.get("address") || "") as string;
        finalAddressLandmark = (formData.get("addressLandmark") || "") as string;
        finalBusinessCategory = (formData.get("businessCategory") || formData.get("sellerType") || "FOOD") as string;
        finalFoodType = (formData.get("foodType") || "BOTH") as string;

        const rawLat = formData.get("latitude") || formData.get("lat");
        const rawLng = formData.get("longitude") || formData.get("lng");
        const rawPinned = formData.get("isLocationPinned");

        if (rawLat && rawLat !== "") finalLatitude = parseFloat(rawLat as string);
        if (rawLng && rawLng !== "") finalLongitude = parseFloat(rawLng as string);
        if (rawPinned !== null && rawPinned !== undefined) {
            finalIsLocationPinned = rawPinned === "true" || rawPinned === "1";
        } else if (finalLatitude !== null && finalLongitude !== null) {
            finalIsLocationPinned = true;
        }

        const saveFile = async (file: File | null) => {
            if (!file || typeof file === "string" || file.size === 0) return null;
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            return await uploadImage(buffer, file.type, file.name, "sellers");
        };

        try {
            console.log("Starting concurrent file uploads for seller registration...");
            const adhaarFile = (formData.get("adhaarFile") || formData.get("identityProofFile")) as File;
            const adhaarFrontFile = formData.get("adhaarFrontFile") as File;
            const adhaarBackFile = formData.get("adhaarBackFile") as File;
            const fssaiFile = (formData.get("fssaiFile") || formData.get("fssaiLicenseFile")) as File;
            const lightBillFile = (formData.get("lightBillFile") || formData.get("utilityBillFile") || formData.get("electricityBillFile")) as File;
            const passbookFile = (formData.get("passbookFile") || formData.get("bankPassbookFile")) as File;

            const kitchenFiles: File[] = [];
            for (let i = 0; i < 4; i++) {
                const kFile = (formData.get(`kitchenImage_${i}`) || formData.get(`kitchenPhoto_${i}`)) as File;
                if (kFile && typeof kFile !== "string" && kFile.size > 0) kitchenFiles.push(kFile);
            }

            const cuisineFiles: File[] = [];
            for (let i = 0; i < 4; i++) {
                const cFile = (formData.get(`cuisineImage_${i}`) || formData.get(`cuisinePhoto_${i}`)) as File;
                if (cFile && typeof cFile !== "string" && cFile.size > 0) cuisineFiles.push(cFile);
            }

            const roomFiles: File[] = [];
            for (let i = 0; i < 4; i++) {
                const rFile = (formData.get(`roomImage_${i}`) || formData.get(`roomPhoto_${i}`)) as File;
                if (rFile && typeof rFile !== "string" && rFile.size > 0) roomFiles.push(rFile);
            }

            // Await all upload promises concurrently
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
                adhaarUrl = JSON.stringify([savedAdhaarFront, savedAdhaarBack]);
                console.log("Aadhar card saved (front & back):", adhaarUrl);
            } else if (savedAdhaarFront) {
                adhaarUrl = JSON.stringify([savedAdhaarFront]);
            } else if (savedAdhaar) {
                adhaarUrl = savedAdhaar;
                console.log("Aadhar card saved:", adhaarUrl);
            }

            if (savedFssai) {
                fssaiUrl = savedFssai;
                console.log("FSSAI license saved:", fssaiUrl);
            }

            if (savedLightBill) {
                lightBillUrl = savedLightBill;
                console.log("Light bill saved:", lightBillUrl);
            }

            if (savedPassbook) {
                passbookUrl = savedPassbook;
                console.log("Passbook saved:", passbookUrl);
            }

            kitchenImages = resolvedKitchen.filter(Boolean) as string[];
            cuisineImages = resolvedCuisine.filter(Boolean) as string[];
            roomImages = resolvedRooms.filter(Boolean) as string[];

            console.log("All concurrent file uploads completed for seller registration.");
        } catch (uploadError: any) {
            console.error("File upload error during registration:", uploadError);
            throw new ApiError(`Upload failed: ${uploadError.message}`, 500);
        }
    }

    console.log("Registering user:", { finalName, finalEmail, finalRole });

    if (!finalName || !finalEmail || !finalPassword || !finalRole) {
        console.error("Missing required fields for registration");
        throw new ApiError("Missing required fields: Name, email and password are required", 400);
    }

    if (typeof finalPassword !== "string" || finalPassword.length < 6) {
        throw new ApiError("Password must be at least 6 characters long", 400);
    }

    if (finalPhone) {
        const rawDigits = String(finalPhone).replace(/\D/g, "");
        // Strip country code (e.g. 91) if present and extract the 10-digit mobile number
        const phoneDigits = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
        if (phoneDigits.length !== 10) {
            throw new ApiError("Please provide a valid 10-digit phone number", 400);
        }
        finalPhone = phoneDigits;
    }

    const emailCheck = validateEmail(finalEmail);
    if (!emailCheck.isValid) {
        throw new ApiError(emailCheck.error || "Please enter a valid email address.", 400);
    }
    finalEmail = emailCheck.normalizedEmail;

    const existingUser = await db.user.findUnique({
        where: { email: finalEmail },
        include: { sellerProfile: true },
    });

    if (existingUser) {
        console.error("User account already exists with email:", finalEmail);
        throw new ApiError("An account with this email address already exists. Please sign in.", 409);
    }

    if (finalPhone) {
        const existingPhoneUser = await db.user.findFirst({
            where: { phone: finalPhone }
        });
        if (existingPhoneUser) {
            console.error("User account already exists with phone:", finalPhone);
            throw new ApiError("An account with this mobile number already exists. Please sign in.", 409);
        }
    }

    const passwordHash = await bcrypt.hash(finalPassword, 10);

    // Normalize city and pincode from address if empty
    const fullAddress = `${finalAddressFlat || ""} ${finalAddressArea || ""}`.trim();
    if (!finalPincode) {
        const match = fullAddress.match(/\b\d{6}\b/);
        finalPincode = match ? match[0] : "411038";
    }
    if (!finalCity) {
        if (/bangalore|bengaluru/i.test(fullAddress)) finalCity = "Bangalore";
        else if (/pune/i.test(fullAddress)) finalCity = "Pune";
        else if (/mumbai/i.test(fullAddress)) finalCity = "Mumbai";
        else if (/delhi/i.test(fullAddress)) finalCity = "Delhi";
        else finalCity = "Pune";
    }

    try {
        const result = await db.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: finalName,
                    email: finalEmail,
                    phone: finalPhone || "",
                    city: finalCity || "",
                    pincode: finalPincode || "",
                    passwordHash,
                    role: finalRole as any,
                    isActive: true,
                },
            });

            console.log("User record ready:", user.id);
            let createdSellerProfile: any = null;

            if (finalRole === "SELLER") {
                console.log("Creating seller profile...");
                const generatedTrackingId = `SHOP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                createdSellerProfile = await tx.sellerProfile.create({
                    data: {
                        userId: user.id,
                        type: finalSellerType || "FOOD",
                        businessName: finalBusinessName || `${finalName}'s Kitchen`,
                        addressFlat: finalAddressFlat || "",
                        addressLocality: finalAddressArea || "",
                        addressLandmark: finalAddressLandmark || null,
                        latitude: finalLatitude,
                        longitude: finalLongitude,
                        isLocationPinned: finalIsLocationPinned,
                        kitchenImages: Array.isArray(kitchenImages) ? JSON.stringify(kitchenImages) : "[]",
                        cuisineImages: Array.isArray(cuisineImages) ? JSON.stringify(cuisineImages) : "[]",
                        roomImages: Array.isArray(roomImages) ? JSON.stringify(roomImages) : "[]",
                        adhaarUrl: adhaarUrl || "pending_url",
                        fssaiUrl: fssaiUrl || null,
                        lightBillUrl: lightBillUrl || null,
                        passbookUrl: passbookUrl || null,
                        trackingId: generatedTrackingId,
                        businessCategory: finalBusinessCategory || "FOOD",
                        foodType: finalFoodType || "BOTH",
                        foodVerificationStatus: (finalBusinessCategory === "PROPERTY") ? "NONE" : "PENDING",
                        propertyVerificationStatus: (finalBusinessCategory === "PROPERTY" || finalBusinessCategory === "BOTH") ? "PENDING" : "NONE",
                    }
                });
                console.log("Seller profile created successfully with tracking ID:", generatedTrackingId);
            }

            return {
                user: { id: user.id, email: user.email, name: user.name, role: user.role },
                sellerProfile: createdSellerProfile ? {
                    id: createdSellerProfile.id,
                    trackingId: createdSellerProfile.trackingId,
                    businessName: createdSellerProfile.businessName,
                    verificationStatus: createdSellerProfile.verificationStatus,
                    latitude: createdSellerProfile.latitude,
                    longitude: createdSellerProfile.longitude,
                    isLocationPinned: createdSellerProfile.isLocationPinned,
                } : undefined
            };
        });

        return result;
    } catch (dbError: any) {
        console.error("Database registration error:", dbError);
        throw dbError;
    }
};

export const loginUser = async (req: Request) => {
    const { email, password } = await req.json();

    if (!email || !password) {
        throw new ApiError("Email and password are required. Please enter your credentials.", 400);
    }

    const normalizedEmail = email.toLowerCase();

    const user = await db.user.findUnique({
        where: { email: normalizedEmail }
    });

    if (!user) {
        throw new ApiError("Invalid email or password. Please check your credentials and try again.", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new ApiError("Invalid email or password. Please check your credentials and try again.", 401);
    }

    // Use NEXTAUTH_SECRET as the JWT secret, or a fallback for dev
    const secret = process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only";

    // Create a robust JWT payload
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        secret,
        { expiresIn: "30d" } // 30 day expiration for mobile convenience
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
};
